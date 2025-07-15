import jwt from "jsonwebtoken";
import { MESSAGES } from "../helpers/constants";
import dotenv from "dotenv";
dotenv.config();
// Middleware to verify JWT token on sign-in requests
export const AuthSignIn = (req: any, res: any, next: any): void => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) {
    return res.json({
      success: false,
      code: 401,
      data: [],
      message: MESSAGES?.ACCESS_DENIED || "Access Denied",
      error: true,
    });
  }
   const JWT_SECRET: any = `${process.env.JWT_SECRET}`;
  jwt.verify(token, JWT_SECRET, (err: any, decoded: any) => {
    if (err) {
      const errorMessage = err.name === "TokenExpiredError"
        ? "Token has expired."
        : "Invalid token.";

      return res.json({
        success: false,
        code: 401,
        message: errorMessage,
        error: true,
      });
    }

    req.user = decoded as { id: string; email: string }; // Strongly typed
    next();
  });
};
