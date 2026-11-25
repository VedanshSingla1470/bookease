
import { Router } from "express";
import rateLimit from "express-rate-limit";

import authController from "../controllers/auth.controller.js";
import {
  registerSchema,
  loginSchema,
} from "../validators/auth.validator.js";

import validate from "../../../middleware/validate.js";

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-7",
  legacyHeaders: false,
});

router.post(
  "/register",
  authLimiter,
  validate(registerSchema),
  authController.register
);

router.post(
  "/login",
  authLimiter,
  validate(loginSchema),
  authController.login
);

export default router;
