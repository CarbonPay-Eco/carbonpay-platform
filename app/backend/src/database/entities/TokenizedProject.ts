import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import { Retirement } from './Retirement';

@Entity('tokenized_projects')
export class TokenizedProject {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'token_id', unique: true })
  tokenId: string;

  @Column({ name: 'project_name' })
  projectName: string;

  @Column()
  location: string;

  @Column()
  description: string;

  @Column({ name: 'certification_body' })
  certificationBody: string;

  @Column({ name: 'project_ref_id' })
  projectRefId: string;

  @Column()
  methodology: string;

  @Column({ name: 'verifier_name' })
  verifierName: string;

  @Column({ name: 'vintage_year' })
  vintageYear: number;

  @Column({ name: 'total_issued' })
  totalIssued: number;

  @Column()
  available: number;

  @Column({ name: 'price_per_ton', type: 'decimal', precision: 10, scale: 2 })
  pricePerTon: number;

  @Column({ name: 'ipfs_hash' })
  ipfsHash: string;

  @Column({ name: 'documentation_url', nullable: true })
  documentationUrl: string;

  @Column({ name: 'on_chain_mint_tx' })
  onChainMintTx: string;

  @Column({ default: 'available' })
  status: string;

  @Column({ name: 'project_image_url', nullable: true })
  projectImageUrl: string;

  @Column({ type: 'simple-array', nullable: true })
  tags: string[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @OneToMany(() => Retirement, retirement => retirement.tokenizedProject)
  retirements: Retirement[];
} 