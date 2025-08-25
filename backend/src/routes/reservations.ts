import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { logActivity, ActivityType } from "../services/activity.service";

const router = Router();
const prisma = new PrismaClient();

// 🔹 Reserve a book
router.post("/:bookId", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const bookId = parseInt(req.params.bookId);

  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return res.status(404).json({ error: "Book not found." });

  // Check if user already reserved this book
  const existingReservation = await prisma.reservation.findFirst({
    where: { bookId, userId },
  });
  if (existingReservation)
    return res.status(400).json({ error: "You have already reserved this book." });

  // Optionally, only allow reservation if book is borrowed
  if (book.status === "available")
    return res.status(400).json({ error: "Book is currently available. You can borrow it instead." });

  // First create the reservation
  const reservation = await prisma.reservation.create({
    data: { 
      bookId, 
      userId,
    },
  });

  // Then fetch the full reservation with relations
  const fullReservation = await prisma.reservation.findUnique({
    where: { id: reservation.id },
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

  if (!fullReservation) {
    throw new Error('Failed to create reservation');
  }

  // Log the reservation activity
  await logActivity(
    'RESERVATION' as ActivityType,
    userId,
    bookId,
    fullReservation.book.title,
    `Reserved on ${new Date().toLocaleDateString()}`
  );

  res.json({ message: "Book reserved successfully.", reservation: fullReservation });

});

// 🔹 List reservations for current user
router.get("/", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  
  try {
    // Get all reservations for the current user with queue position
    const userReservations = await prisma.reservation.findMany({
      where: { userId },
      include: { book: true },
      orderBy: { createdAt: "asc" },
    });

    // Calculate queue position for each reservation more efficiently
    const reservationsWithPosition = await Promise.all(
      userReservations.map(async (reservation) => {
        // Get the position in queue for this specific book
        const queuePosition = await prisma.reservation.count({
          where: {
            bookId: reservation.bookId,
            createdAt: {
              lte: reservation.createdAt, // Less than or equal to this reservation's time
            },
          },
        });

        return {
          ...reservation,
          queuePosition,
        };
      })
    );

    res.json(reservationsWithPosition);
  } catch (error) {
    console.error("Error fetching reservations:", error);
    res.status(500).json({ error: "Failed to fetch reservations" });
  }
});

// 🔹 Cancel a reservation
router.delete("/:reservationId", authMiddleware, async (req: AuthRequest, res) => {
  const userId = req.user!.id;
  const reservationId = parseInt(req.params.reservationId);

  const reservation = await prisma.reservation.findFirst({
    where: { id: reservationId, userId },
  });

  if (!reservation) {
    return res.status(404).json({ error: "Reservation not found or you don't have permission to cancel it." });
  }

  // Get reservation with book details before deleting
  const reservationToDelete = await prisma.reservation.findUnique({
    where: { id: reservationId },
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

  if (!reservationToDelete) {
    return res.status(404).json({ error: "Reservation not found." });
  }

  await prisma.reservation.delete({
    where: { id: reservationId },
  });

  // Log the cancellation activity
  await logActivity(
    'SYSTEM' as ActivityType,
    userId,
    reservationToDelete.bookId,
    reservationToDelete.book.title,
    `Reservation cancelled on ${new Date().toLocaleDateString()}`
  );

  res.json({ message: "Reservation cancelled successfully." });
});

export default router;
