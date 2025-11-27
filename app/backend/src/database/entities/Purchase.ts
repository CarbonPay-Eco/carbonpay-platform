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

@Entity("purchases")
export class Purchase {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({ name: "user_id", type: "uuid" })
  userId: string;

  @Column({ name: "project_id", type: "uuid" })
  projectId: string;

  @Column({ type: "decimal", precision: 10, scale: 2 })
  quantity: number;

  @Column({
    name: "price_per_credit",
    type: "decimal",
    precision: 10,
    scale: 2,
  })
  pricePerCredit: number;

  @Column({ name: "total_cost", type: "decimal", precision: 10, scale: 2 })
  totalCost: number;

  @Column({ name: "tx_hash", nullable: true })
  txHash: string;

  @Column({ name: "purchase_pda", nullable: true, type: "varchar" })
  purchasePDA: string | null; // On-chain purchase PDA address

  @Column({ name: "nft_mint", nullable: true, type: "varchar" })
  nftMint: string | null; // Purchase NFT mint address

  @Column({
    type: "enum",
    enum: ["pending", "completed", "failed"],
    default: "pending",
  })
  status: string;

  @Column({ name: "payment_method", nullable: true })
  paymentMethod: string;

  @CreateDateColumn({ name: "created_at" })
  createdAt: Date;

  @UpdateDateColumn({ name: "updated_at" })
  updatedAt: Date;

  // Relationships
  @ManyToOne(() => User)
  @JoinColumn({ name: "user_id" })
  user: User;

  @ManyToOne(() => TokenizedProject)
  @JoinColumn({ name: "project_id" })
  project: TokenizedProject;
}
 