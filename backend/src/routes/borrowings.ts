import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

// Get user's borrowings
router.get("/my-borrowings", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;

  try {
    const borrowings = await prisma.borrowing.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { borrowedAt: "desc" },
    });

    res.json(borrowings);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch borrowings" });
  }
});

// Borrow a book
router.post("/borrow/:bookId", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const bookId = parseInt(req.params.bookId);

  // Check if user already has an active borrow
  const activeBorrow = await prisma.borrowing.findFirst({
    where: { userId, returnedAt: null },
  });

  if (activeBorrow) return res.status(400).json({ error: "You already have a borrowed book." });

  // Check if book is available
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return res.status(404).json({ error: "Book not found." });
  if (book.status !== "available") return res.status(400).json({ error: "Book is not available." });

  // Create borrowing record
  const borrowedAt = new Date();
  const dueDate = new Date();
  dueDate.setDate(borrowedAt.getDate() + 7);

  const borrowing = await prisma.borrowing.create({
    data: { userId, bookId, borrowedAt, dueDate },
  });

  // Update book status
  await prisma.book.update({ where: { id: bookId }, data: { status: "borrowed" } });

  res.json({ message: "Book borrowed successfully.", borrowing });
});

// Return a book
router.post("/return/:bookId", authMiddleware, async (req: AuthRequest, res) => {
    const userId = req.user!.id;
    const bookId = parseInt(req.params.bookId);
  
    const borrowing = await prisma.borrowing.findFirst({
      where: { userId, bookId, returnedAt: null },
    });
  
    if (!borrowing) return res.status(400).json({ error: "You do not have this book borrowed." });
  
    const returnedAt = new Date();
  
    // 1️⃣ Update borrowing record
    await prisma.borrowing.update({
      where: { id: borrowing.id },
      data: { returnedAt },
    });
  
    // 2️⃣ Check reservation queue for this book
    const nextReservation = await prisma.reservation.findFirst({
      where: { bookId },
      orderBy: { createdAt: "asc" },
    });
  
    if (nextReservation) {
      // Borrow the book automatically to the first user in queue
      const borrowedAt = new Date();
      const dueDate = new Date();
      dueDate.setDate(borrowedAt.getDate() + 7);
  
      await prisma.borrowing.create({
        data: {
          userId: nextReservation.userId,
          bookId,
          borrowedAt,
          dueDate,
        },
      });
  
      // Remove the reservation
      await prisma.reservation.delete({ where: { id: nextReservation.id } });
  
      // Keep book status as "borrowed"
      await prisma.book.update({ where: { id: bookId }, data: { status: "borrowed" } });
  
      return res.json({
        message: `Book returned successfully. Book automatically borrowed by user ${nextReservation.userId} from reservation queue.`,
      });
    }
  
    // 3️⃣ No reservations → mark book as available
    await prisma.book.update({ where: { id: bookId }, data: { status: "available" } });
  
    res.json({ message: "Book returned successfully." });
  });
  

export default router;
