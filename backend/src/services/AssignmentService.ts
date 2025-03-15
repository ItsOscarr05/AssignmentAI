import { AppDataSource } from "../config/database";
import { Assignment } from "../models/Assignment";
import { User } from "../models/User";
import {
  Between,
  FindOptionsWhere,
  LessThanOrEqual,
  MoreThanOrEqual,
} from "typeorm";

interface CreateAssignmentDto {
  title: string;
  description: string;
  dueDate: Date;
  userId: string;
}

interface UpdateAssignmentDto {
  title?: string;
  description?: string;
  dueDate?: Date;
  status?: "pending" | "submitted" | "graded";
  grade?: number;
  feedback?: string;
}

interface FilterAssignmentDto {
  status?: "pending" | "submitted" | "graded";
  dueDateStart?: Date;
  dueDateEnd?: Date;
  userId?: string;
  page?: number;
  limit?: number;
}

export class AssignmentService {
  private assignmentRepository = AppDataSource.getRepository(Assignment);
  private userRepository = AppDataSource.getRepository(User);

  async create(data: CreateAssignmentDto) {
    // Verify user exists
    const user = await this.userRepository.findOne({
      where: { id: data.userId },
    });

    if (!user) {
      throw new Error("User not found");
    }

    const assignment = this.assignmentRepository.create({
      ...data,
      status: "pending",
    });

    return this.assignmentRepository.save(assignment);
  }

  async findAll(filters: FilterAssignmentDto = {}) {
    const {
      status,
      dueDateStart,
      dueDateEnd,
      userId,
      page = 1,
      limit = 10,
    } = filters;

    const where: FindOptionsWhere<Assignment> = {};

    if (status) {
      where.status = status;
    }

    if (userId) {
      where.userId = userId;
    }

    if (dueDateStart && dueDateEnd) {
      where.dueDate = Between(dueDateStart, dueDateEnd);
    } else if (dueDateStart) {
      where.dueDate = MoreThanOrEqual(dueDateStart);
    } else if (dueDateEnd) {
      where.dueDate = LessThanOrEqual(dueDateEnd);
    }

    const [assignments, total] = await this.assignmentRepository.findAndCount({
      where,
      relations: ["user"],
      order: { dueDate: "ASC" },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      assignments,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    return assignment;
  }

  async update(id: string, userId: string, data: UpdateAssignmentDto) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    // Only allow updates by the assignment owner or if it's a grade update by a teacher
    if (assignment.userId !== userId && !data.grade && !data.feedback) {
      throw new Error("Not authorized to update this assignment");
    }

    Object.assign(assignment, data);
    return this.assignmentRepository.save(assignment);
  }

  async delete(id: string, userId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.userId !== userId) {
      throw new Error("Not authorized to delete this assignment");
    }

    await this.assignmentRepository.remove(assignment);
    return { message: "Assignment deleted successfully" };
  }

  async submitAssignment(id: string, userId: string) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.userId !== userId) {
      throw new Error("Not authorized to submit this assignment");
    }

    if (assignment.status !== "pending") {
      throw new Error("Assignment cannot be submitted");
    }

    assignment.status = "submitted";
    return this.assignmentRepository.save(assignment);
  }

  async gradeAssignment(
    id: string,
    grade: number,
    feedback: string,
    teacherId: string
  ) {
    const assignment = await this.assignmentRepository.findOne({
      where: { id },
      relations: ["user"],
    });

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    if (assignment.status !== "submitted") {
      throw new Error("Assignment cannot be graded");
    }

    // Verify the grader is a teacher
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId },
    });

    if (!teacher || teacher.role !== "teacher") {
      throw new Error("Not authorized to grade assignments");
    }

    assignment.status = "graded";
    assignment.grade = grade;
    assignment.feedback = feedback;

    return this.assignmentRepository.save(assignment);
  }
}
