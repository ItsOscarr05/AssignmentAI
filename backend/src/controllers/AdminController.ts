import { Request, Response } from "express";
import { AppDataSource } from "../config/database";
import { Assignment } from "../models/Assignment";
import { User } from "../models/User";
import { StorageFactory } from "../services/storage/StorageFactory";

export class AdminController {
  private storageFactory = StorageFactory.getInstance();

  async getSystemStatus(req: Request, res: Response) {
    try {
      const userCount = await AppDataSource.getRepository(User).count();
      const assignmentCount = await AppDataSource.getRepository(
        Assignment
      ).count();

      const storageStatus = {
        type: this.storageFactory.getStorageType(),
        hybridAvailable: this.storageFactory.isHybridAvailable(),
      };

      const assignmentStats = await AppDataSource.getRepository(Assignment)
        .createQueryBuilder("assignment")
        .select("assignment.status", "status")
        .addSelect("COUNT(*)", "count")
        .groupBy("assignment.status")
        .getRawMany();

      const stats = {
        users: {
          total: userCount,
          // Add more user stats as needed
        },
        assignments: {
          total: assignmentCount,
          byStatus: assignmentStats,
        },
        storage: storageStatus,
        system: {
          version: process.env.APP_VERSION || "1.0.0",
          nodeVersion: process.version,
          uptime: process.uptime(),
          memoryUsage: process.memoryUsage(),
        },
      };

      res.json(stats);
    } catch (error) {
      console.error("Error getting system status:", error);
      res.status(500).json({ message: "Failed to get system status" });
    }
  }

  async getUserStats(req: Request, res: Response) {
    try {
      const stats = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .select("user.role", "role")
        .addSelect("COUNT(*)", "count")
        .groupBy("user.role")
        .getRawMany();

      const activeUsers = await AppDataSource.getRepository(User)
        .createQueryBuilder("user")
        .where("user.lastLoginAt > :date", {
          date: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        })
        .getCount();

      res.json({
        roleDistribution: stats,
        activeUsers,
        totalUsers: await AppDataSource.getRepository(User).count(),
      });
    } catch (error) {
      console.error("Error getting user stats:", error);
      res.status(500).json({ message: "Failed to get user statistics" });
    }
  }

  async getStorageStats(req: Request, res: Response) {
    try {
      const fileStats = await AppDataSource.getRepository(Assignment)
        .createQueryBuilder("assignment")
        .select("assignment.storageType", "storageType")
        .addSelect("COUNT(*)", "count")
        .addSelect("SUM(assignment.fileSize)", "totalSize")
        .where("assignment.submissionFile IS NOT NULL")
        .groupBy("assignment.storageType")
        .getRawMany();

      const totalSize = fileStats.reduce(
        (acc, stat) => acc + parseInt(stat.totalSize) || 0,
        0
      );

      res.json({
        distribution: fileStats,
        totalFiles: fileStats.reduce(
          (acc, stat) => acc + parseInt(stat.count),
          0
        ),
        totalSize,
        averageFileSize:
          totalSize /
          fileStats.reduce((acc, stat) => acc + parseInt(stat.count), 0),
      });
    } catch (error) {
      console.error("Error getting storage stats:", error);
      res.status(500).json({ message: "Failed to get storage statistics" });
    }
  }

  async getPerformanceMetrics(req: Request, res: Response) {
    try {
      const metrics = {
        system: {
          cpu: process.cpuUsage(),
          memory: process.memoryUsage(),
          uptime: process.uptime(),
        },
        database: {
          // Add database performance metrics
          connectionCount: (
            await AppDataSource.manager.query(
              "SELECT count(*) as count FROM pg_stat_activity"
            )
          )[0].count,
          // Add more metrics as needed
        },
      };

      res.json(metrics);
    } catch (error) {
      console.error("Error getting performance metrics:", error);
      res.status(500).json({ message: "Failed to get performance metrics" });
    }
  }
}
