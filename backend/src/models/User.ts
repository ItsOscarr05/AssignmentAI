import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Assignment } from "./Assignment";

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @Column()
  fullName: string;

  @Column({
    type: "enum",
    enum: ["student", "teacher"],
    default: "student",
  })
  role: "student" | "teacher";

  @Column({ nullable: true })
  avatar: string;

  @OneToMany(() => Assignment, (assignment) => assignment.user)
  assignments: Assignment[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to remove sensitive data
  toJSON() {
    const { passwordHash, ...user } = this;
    return user;
  }
}
