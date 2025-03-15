import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { AppDataSource } from "../config/database";
import { User } from "../models/User";

export class AuthService {
  private userRepository = AppDataSource.getRepository(User);

  async register(
    email: string,
    password: string,
    fullName: string,
    role: "student" | "teacher" = "student"
  ) {
    // Check if user exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });
    if (existingUser) {
      throw new Error("User already exists");
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create user
    const user = this.userRepository.create({
      email,
      passwordHash,
      fullName,
      role,
    });

    await this.userRepository.save(user);
    return this.generateTokens(user);
  }

  async login(email: string, password: string) {
    // Find user
    const user = await this.userRepository.findOne({ where: { email } });
    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error("Invalid credentials");
    }

    return this.generateTokens(user);
  }

  async refreshToken(refreshToken: string) {
    try {
      // Verify refresh token
      const payload = jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET!
      ) as { id: string };

      // Get user
      const user = await this.userRepository.findOne({
        where: { id: payload.id },
      });
      if (!user) {
        throw new Error("User not found");
      }

      return this.generateTokens(user);
    } catch (error) {
      throw new Error("Invalid refresh token");
    }
  }

  private generateTokens(user: User) {
    // Generate access token
    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET!,
      { expiresIn: Number(process.env.JWT_EXPIRES_IN) }
    );
    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      process.env.JWT_REFRESH_SECRET!,
      { expiresIn: Number(process.env.JWT_REFRESH_EXPIRES_IN) }
    );

    return {
      accessToken,
      refreshToken,
      user: user.toJSON(),
    };
  }
}
