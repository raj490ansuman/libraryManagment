import express from "express";
import cors from "cors";
import session from "express-session";
import { PrismaClient } from "@prisma/client";
import userRoutes from "./routes/users";
import borrowingRoutes from "./routes/borrowings";
import reservationRoutes from "./routes/reservations";
import bookRoutes from "./routes/books";
import activityRoutes from "./routes/activity.routes";
import cookieParser from "cookie-parser";
import path from 'path';

declare module "express-session" {
  interface SessionData {
    userId?: number;
    email?: string;
  }
}

const app = express();
const prisma = new PrismaClient();

const isProduction = process.env.NODE_ENV === "production";
const secureCookies = isProduction && process.env.USE_HTTPS === 'true';

// Session configuration
const sessionConfig: session.SessionOptions = {
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: secureCookies,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 1 day
    sameSite: secureCookies ? 'none' : 'lax',
  } as session.CookieOptions,
};

// Initialize cookie if not present
if (!sessionConfig.cookie) {
  sessionConfig.cookie = {} as session.CookieOptions;
}

if (app.get("env") === "production") {
  app.set("trust proxy", 1); // Trust first proxy
  sessionConfig.cookie.secure = true; // Serve secure cookies
}
// Allowed origins
const allowedOrigins = [
  "http://localhost:3000",
  // "https://lib-managemant-fe.vercel.app",
  "https://m6zjk5s2-4000.asse.devtunnels.ms",
  // "https://86e599eed21b.ngrok-free.app",
  // "https://lotus-sitting-crisis-tour.trycloudflare.com",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    exposedHeaders: ["set-cookie"],
  })
);

// 🔑 Correct middleware order
app.use(express.json());
app.use(cookieParser());
app.use(session(sessionConfig));

// Routes
app.use("/users", userRoutes);
app.use("/borrowings", borrowingRoutes);
app.use("/reservations", reservationRoutes);
app.use("/books", bookRoutes);
app.use("/activities", activityRoutes);

// Serve React build
const frontendPath = path.join(__dirname, '../frontend/build'); // adjust path
app.use(express.static(frontendPath));

// For all other routes, serve index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Health check
app.get("/", (req, res) => {
  res.json({ message: "Library API running 🚀" });
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
