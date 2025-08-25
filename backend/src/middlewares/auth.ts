import { Request, Response, NextFunction } from "express";

declare module 'express-session' {
  interface SessionData {
    userId?: number;
    email?: string;
  }
}

export interface AuthRequest extends Request {
  user?: { id: number; email: string };
}

export const authMiddleware = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Check if user is authenticated via session
  if (!req.session.userId || !req.session.email) {
    return res.status(401).json({ error: "Not authenticated" });
  }

  // Attach user info to request
  req.user = {
    id: req.session.userId,
    email: req.session.email
  };
  
  next();
};
