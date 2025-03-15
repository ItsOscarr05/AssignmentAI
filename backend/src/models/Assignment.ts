import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "./User";

@Entity("assignments")
export class Assignment {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column()
  title: string;

  @Column("text")
  description: string;

  @Column()
  dueDate: Date;

  @Column({
    type: "enum",
    enum: ["pending", "submitted", "graded"],
    default: "pending",
  })
  status: "pending" | "submitted" | "graded";

  @Column({ type: "float", nullable: true })
  grade?: number;

  @Column({ type: "text", nullable: true })
  feedback?: string;

  @Column("simple-array", { nullable: true })
  attachments: string[];

  @ManyToOne(() => User, (user) => user.assignments)
  @JoinColumn({ name: "userId" })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  submissionFile?: string;

  @Column({ nullable: true })
  originalFileName?: string;

  @Column({ nullable: true })
  fileSize?: number;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({
    type: "enum",
    enum: ["local", "cloud"],
    nullable: true,
  })
  storageType?: "local" | "cloud";

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
