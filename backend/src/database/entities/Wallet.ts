import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, OneToMany } from 'typeorm';
import { Organization } from './Organization';
import { Retirement } from './Retirement';
import { AuditLog } from './AuditLog';

@Entity('wallets')
export class Wallet {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_address', unique: true })
  walletAddress: string;

  @Column({ nullable: true })
  provider: string;

  @Column({ nullable: true })
  role: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @OneToOne(() => Organization, organization => organization.wallet)
  organization: Organization;

  @OneToMany(() => Retirement, retirement => retirement.wallet)
  retirements: Retirement[];

  @OneToMany(() => AuditLog, auditLog => auditLog.wallet)
  auditLogs: AuditLog[];
} 