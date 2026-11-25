
import jwt from "jsonwebtoken";

import User from "../modules/users/models/user.model.js";
import AppError from "../common/errors/AppError.js";

const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AppError("Authentication required", 401);
    }

    const token = authHeader.split(" ")[1];

    let decoded;

    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      throw new AppError("Invalid or expired token", 401);
    }

    const user = await User.findById(decoded.sub);

    if (!user) {
      throw new AppError("User account not found", 401);
    }

    if (user.status !== "ACTIVE") {
      throw new AppError("Your account is suspended", 403);
    }

    req.user = {
      id: user.id,
      email: user.email,
      platformRole: user.platformRole,
    };

    next();
  } catch (error) {
    next(error);
  }
};

export default authenticate;
