import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logActivity } from "../services/activity.service";

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
  const dueDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days (1 week) from now

  const borrowing = await prisma.borrowing.create({
    data: {
      userId,
      bookId,
      borrowedAt,
      dueDate,
    },
    include: {
      book: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  // Log the activity
  await logActivity(
    'CHECKOUT',
    userId,
    bookId,
    borrowing.book.title,
    `Due on ${borrowing.dueDate.toLocaleDateString()}`
  );

  // Update book status
  await prisma.book.update({ where: { id: bookId }, data: { status: "borrowed" } });

  res.json({ message: "Book borrowed successfully.", borrowing });
});

// Return a book
router.post("/return/:bookId", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const bookId = parseInt(req.params.bookId);

  try {
    // Find the active borrowing
    const borrowing = await prisma.borrowing.findFirst({
      where: {
        bookId,
        userId,
        returnedAt: null,
      },
      include: {
        book: true,
      },
    });

    if (!borrowing) {
      return res.status(400).json({ error: "No active borrowing found for this book and user." });
    }

    // Update the borrowing record
    const updatedBorrowing = await prisma.borrowing.update({
      where: { id: borrowing.id },
      data: { 
        returnedAt: new Date(),
      },
      include: {
        book: true,
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Log the return activity
    await logActivity(
      'RETURN',
      userId,
      bookId,
      updatedBorrowing.book.title,
      `Returned on ${new Date().toLocaleDateString()}`
    );

    // Check for next reservation
    const nextReservation = await prisma.reservation.findFirst({
      where: { bookId },
      orderBy: { createdAt: 'asc' },
    });

    if (nextReservation) {
      // Borrow the book automatically to the first user in queue
      const borrowedAt = new Date();
      const dueDate = new Date();
      dueDate.setDate(borrowedAt.getDate() + 7);
  
      const newBorrowing = await prisma.borrowing.create({
        data: {
          userId: nextReservation.userId,
          bookId,
          borrowedAt,
          dueDate,
        },
        include: {
          book: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });
  
      // Log the auto-borrow activity
      await logActivity(
        'CHECKOUT',
        nextReservation.userId,
        bookId,
        newBorrowing.book.title,
        `Auto-borrowed from reservation queue, due on ${dueDate.toLocaleDateString()}`
      );
  
      // Remove the reservation
      await prisma.reservation.delete({ where: { id: nextReservation.id } });
  
      // Keep book status as "borrowed"
      await prisma.book.update({ where: { id: bookId }, data: { status: "borrowed" } });
  
      return res.json({
        message: `Book returned successfully. Book automatically borrowed by user ${nextReservation.userId} from reservation queue.`,
      });
    }
  
    // No reservations → mark book as available
    await prisma.book.update({ where: { id: bookId }, data: { status: "available" } });
    
    res.json({ message: "Book returned successfully." });
  } catch (error) {
    console.error("Error returning book:", error);
    res.status(500).json({ error: "Failed to return book." });
  }
});
  

export default router;
