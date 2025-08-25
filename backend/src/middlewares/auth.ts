import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    email?: string;
    role?: 'USER' | 'ADMIN';
  }
}

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: 'USER' | 'ADMIN';
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.session.userId || !req.session.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  try {
    // Get user from database to ensure they still exist
    const user = await prisma.user.findUnique({
      where: { id: req.session.userId },
      select: { 
        id: true, 
        email: true, 
        role: true,
        name: true,
        passwordHash: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      // Clear invalid session
      req.session.destroy(() => {});
      return res.status(401).json({ error: "User not found" });
    }

    // Set user in request for use in subsequent middleware
    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as 'USER' | 'ADMIN'
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: "Internal server error" });
  }
};

export const adminMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: "Access denied. Admin privileges required." });
  }
  next();
};
