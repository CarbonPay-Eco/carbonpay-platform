import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { User } from "../../entities/User";
import { TokenizedProject } from "./TokenizedProject";

@Entity("emissions")
export class Emission {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column()
  source: string; // e.g., "Office Energy Consumption", "Business Travel", "Manufacturing Process"

  @Column({ type: "decimal", precision: 10, scale: 2 })
  amount: number; // Amount in tCO₂e

  @Column({ type: "date" })
  date: Date; // Date when the emission occurred

  @Column({
    type: "decimal",
    precision: 10,
    scale: 2,
    default: 0,
  })
  offset: number; // Amount that has been offset (in tCO₂e)

  @Column({ name: "offset_project_id", type: "uuid", nullable: true })
  offsetProjectId: string | null; // Project used for offsetting

  @Column({ name: "offset_request_id", type: "varchar", nullable: true })
  offsetRequestId: string | null; // On-chain offset request ID if offset was done on-chain

  @Column({ type: "text", nullable: true })
  description: string; // Optional description

  @Column({ type: "varchar", nullable: true })
  category: string; // e.g., "Scope 1", "Scope 2", "Scope 3"

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => TokenizedProject, { nullable: true })
  @JoinColumn({ name: "offset_project_id" })
  offsetProject: TokenizedProject | null;
}

