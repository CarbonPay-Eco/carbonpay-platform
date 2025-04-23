import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { Wallet } from './Wallet';
import { TokenizedProject } from './TokenizedProject';

@Entity('retirements')
export class Retirement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_id' })
  walletId: string;

  @Column({ name: 'tokenized_project_id' })
  tokenizedProjectId: string;

  @Column()
  quantity: number;

  @CreateDateColumn({ name: 'retirement_date' })
  retirementDate: Date;

  @Column({ name: 'tx_hash' })
  txHash: string;

  @Column({ name: 'proof_url', nullable: true })
  proofUrl: string;

  @Column({ name: 'auto_offset', default: false })
  autoOffset: boolean;

  @Column({ name: 'reporting_period_start', type: 'date', nullable: true })
  reportingPeriodStart: Date;

  @Column({ name: 'reporting_period_end', type: 'date', nullable: true })
  reportingPeriodEnd: Date;

  // Relationships
  @ManyToOne(() => Wallet, wallet => wallet.retirements)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;

  @ManyToOne(() => TokenizedProject, tokenizedProject => tokenizedProject.retirements)
  @JoinColumn({ name: 'tokenized_project_id' })
  tokenizedProject: TokenizedProject;
} 