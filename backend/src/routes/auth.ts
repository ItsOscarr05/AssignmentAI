import { Router } from "express";
import { AuthController } from "../controllers/AuthController";

const router = Router();
const authController = new AuthController();

// Register route
router.post(
  "/register",
  AuthController.registerValidation,
  authController.register.bind(authController)
);

// Login route
router.post(
  "/login",
  AuthController.loginValidation,
  authController.login.bind(authController)
);

// Refresh token route
router.post("/refresh", authController.refresh.bind(authController));

// Logout route
router.post("/logout", authController.logout.bind(authController));

export default router;
