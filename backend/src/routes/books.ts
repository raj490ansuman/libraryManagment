import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

// Get all books
router.get("/", authMiddleware, async (req, res) => {
  try {
    const books = await prisma.book.findMany({
      select: {
        id: true,
        title: true,
        author: true,
        status: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            borrowings: true,
            reservations: true
          }
        }
      },
      orderBy: {
        title: 'asc'
      }
    });
    
    res.json(books);
  } catch (error) {
    console.error("Error fetching books:", error);
    res.status(500).json({ error: "Failed to fetch books" });
  }
});

export default router;
