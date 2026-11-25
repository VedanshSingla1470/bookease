
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

import User from "../../users/models/user.model.js";
import AppError from "../../../common/errors/AppError.js";

const SALT_ROUNDS = 12;

const generateToken = (user) => {
  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  return jwt.sign(
    {
      platformRole: user.platformRole,
    },
    process.env.JWT_SECRET,
    {
      subject: user.id,
      expiresIn: process.env.JWT_EXPIRES_IN || "1d",
    }
  );
};

const register = async (userData) => {
  const { firstName, lastName, email, password } = userData;

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    throw new AppError("An account with this email already exists", 409);
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  const user = await User.create({
    firstName,
    lastName,
    email,
    passwordHash,
  });

  const token = generateToken(user);

  return {
    user,
    token,
  };
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email }).select("+passwordHash");

  if (!user) {
    throw new AppError("Invalid email or password", 401);
  }

  const passwordMatches = await user.comparePassword(password);

  if (!passwordMatches) {
    throw new AppError("Invalid email or password", 401);
  }

  if (user.status !== "ACTIVE") {
    throw new AppError("Your account is currently suspended", 403);
  }

  user.lastLoginAt = new Date();

  await user.save();

  const token = generateToken(user);

  return {
    user,
    token,
  };
};

export default {
  register,
  login,
};
