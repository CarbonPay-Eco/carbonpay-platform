import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from "typeorm";
import { UserWallet } from "../../entities/UserWallet";

@Entity("audit_logs")
export class AuditLog {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "wallet_id" })
  walletId: string;

  @Column()
  action: string;

  @Column({ name: "entity_type" })
  entityType: string;

  @Column({ name: "entity_id", nullable: true })
  entityId: string;

  @Column({ type: "jsonb", nullable: true })
  metadata: Record<string, any>;

  @CreateDateColumn({ name: "timestamp" })
  timestamp: Date;

  // Relationships
  @ManyToOne(() => UserWallet, { eager: false })
  @JoinColumn({ name: "wallet_id", referencedColumnName: "id" })
  wallet: UserWallet;
}
