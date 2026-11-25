
import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import authRoutes from "./modules/auth/routes/auth.routes.js";
import errorHandler from "./middleware/errorHandler.js";
import organizationRoutes from "./modules/organizations/routes/organization.routes.js";
import membershipRoutes from "./modules/memberships/routes/membership.routes.js";

const app = express();

// Security middleware
app.use(helmet());

// Cross-origin configuration
app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true,
  })
);

// Request parsing
app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

// Basic rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 100,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

app.use("/api", limiter);
app.use("/api/v1/auth", authRoutes);

// Organization routes
app.use("/api/v1/organizations", organizationRoutes);

// Membership management routes
app.use(
  "/api/v1/organizations/:organizationId/members",
  membershipRoutes
);

// Health check
app.get("/api/v1/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "BookEase API is running",
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

// Unknown routes
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

app.use(errorHandler);

export default app;
