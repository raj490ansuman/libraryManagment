import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { Request, Response } from "express";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    email?: string;
  }
}

const router = Router();
const prisma = new PrismaClient();

// 🔹 Register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) return res.status(400).json({ error: "Email already in use" });

  const passwordHash = await bcrypt.hash(password, 10);

  const user = await prisma.user.create({
    data: { name, email, passwordHash },
  });

  res.json({ id: user.id, name: user.name, email: user.email });
});

// 🔹 Login (using sessions)
router.post("/login", async (req: Request, res: Response) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: {
        id: true,
        email: true,
        passwordHash: true,
        role: true,
        name: true
      }
    });
    
    if (!user) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(400).json({ error: "Invalid credentials" });
    }

    // Set session data
    req.session.userId = user.id;
    req.session.email = user.email;
    req.session.role = user.role as 'USER' | 'ADMIN';

    // Save the session
    req.session.save(err => {
      if (err) {
        console.error('Session save error:', err);
        return res.status(500).json({ error: 'Failed to create session' });
      }
      
      // Return user data (without sensitive information)
      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role
        }
      });
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'An error occurred during login' });
  }
});

// 🔹 Logout (destroy session)
router.post("/logout", (req: Request, res: Response) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: "Failed to log out" });
    }
    res.clearCookie('connect.sid');
    res.json({ success: true });
  });
});

// 🔹 Get current user profile
router.get("/profile", async (req: Request, res: Response) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const userId = req.session.userId;

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        name: true, 
        email: true, 
        role: true,
        createdAt: true 
      }
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch user profile" });
  }
});

// Admin only routes
import { adminMiddleware } from "../middlewares/auth";

// Get all users (admin only)
router.get("/", adminMiddleware, async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        _count: {
          select: {
            borrowings: true,
            reservations: true,
            suggestions: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });
    
    res.json(users);
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

export default router;
