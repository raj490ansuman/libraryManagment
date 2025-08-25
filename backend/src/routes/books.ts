import { Router, Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { authMiddleware, adminMiddleware } from "../middlewares/auth";

const router = Router();
const prisma = new PrismaClient();

// Extend the Request type to include params
interface BookRequest extends Request {
  params: {
    id?: string;
  };
  body: {
    title?: string;
    author?: string;
    status?: string;
  };
}

// Get all books
router.get("/", authMiddleware, async (req: Request, res: Response) => {
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

// Create a new book (admin only)
router.post("/", authMiddleware, adminMiddleware, async (req: BookRequest, res: Response) => {
  const title = req.body.title as string;
  const author = req.body.author as string;
  const status = (req.body.status as string) || 'available';

  if (!title || !author) {
    return res.status(400).json({ error: "Title and author are required" });
  }

  try {
    const book = await prisma.book.create({
      data: {
        title,
        author,
        status
      },
      select: {
        id: true,
        title: true,
        author: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.status(201).json(book);
  } catch (error) {
    console.error("Error creating book:", error);
    res.status(500).json({ error: "Failed to create book" });
  }
});

// Update a book (admin only)
router.put("/:id", authMiddleware, adminMiddleware, async (req: BookRequest, res: Response) => {
  const id = req.params.id as string;
  const title = req.body.title as string | undefined;
  const author = req.body.author as string | undefined;
  const status = req.body.status as string | undefined;

  try {
    const book = await prisma.book.update({
      where: { id: parseInt(id) },
      data: {
        ...(title && { title }),
        ...(author && { author }),
        ...(status && { status })
      },
      select: {
        id: true,
        title: true,
        author: true,
        status: true,
        createdAt: true,
        updatedAt: true
      }
    });

    res.json(book);
  } catch (error) {
    console.error("Error updating book:", error);
    res.status(500).json({ error: "Failed to update book" });
  }
});

// Delete a book (admin only)
router.delete("/:id", authMiddleware, adminMiddleware, async (req: BookRequest, res: Response) => {
  const id = req.params.id as string;

  try {
    // First check if the book exists and is not borrowed or reserved
    const book = await prisma.book.findUnique({
      where: { id: parseInt(id) },
      include: {
        borrowings: {
          where: {
            returnedAt: null
          }
        },
        reservations: true
      }
    });

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    if (book.borrowings.length > 0) {
      return res.status(400).json({ error: "Cannot delete a borrowed book" });
    }

    // Delete associated reservations first
    if (book.reservations.length > 0) {
      await prisma.reservation.deleteMany({
        where: { bookId: book.id }
      });
    }

    // Then delete the book
    await prisma.book.delete({
      where: { id: parseInt(id) }
    });

    res.json({ message: "Book deleted successfully" });
  } catch (error) {
    console.error("Error deleting book:", error);
    res.status(500).json({ error: "Failed to delete book" });
  }
});

export default router;
