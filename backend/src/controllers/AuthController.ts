import { Request, Response } from "express";
import { body, validationResult } from "express-validator";
import { AuthService } from "../services/AuthService";

export class AuthController {
  private authService = new AuthService();

  // Validation rules
  static registerValidation = [
    body("email").isEmail().normalizeEmail(),
    body("password").isLength({ min: 6 }),
    body("fullName").trim().notEmpty(),
    body("role").optional().isIn(["student", "teacher"]),
  ];

  static loginValidation = [
    body("email").isEmail().normalizeEmail(),
    body("password").notEmpty(),
  ];

  // Controllers
  async register(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password, fullName, role } = req.body;
      const result = await this.authService.register(
        email,
        password,
        fullName,
        role
      );

      res.status(201).json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "User already exists") {
        return res.status(409).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async login(req: Request, res: Response) {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, password } = req.body;
      const result = await this.authService.login(email, password);

      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid credentials") {
        return res.status(401).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async refresh(req: Request, res: Response) {
    try {
      const { refreshToken } = req.body;
      if (!refreshToken) {
        return res.status(400).json({ message: "Refresh token is required" });
      }

      const result = await this.authService.refreshToken(refreshToken);
      res.json(result);
    } catch (error) {
      if (error instanceof Error && error.message === "Invalid refresh token") {
        return res.status(401).json({ message: error.message });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  }

  async logout(_req: Request, res: Response) {
    // In a stateless JWT setup, we don't need to do anything server-side
    // The client should remove the tokens
    res.json({ message: "Logged out successfully" });
  }
}
