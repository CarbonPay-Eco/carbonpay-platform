import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToOne, JoinColumn } from 'typeorm';
import { Wallet } from './Wallet';

@Entity('organizations')
export class Organization {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'wallet_id' })
  walletId: string;

  @Column({ name: 'company_name' })
  companyName: string;

  @Column()
  country: string;

  @Column({ name: 'registration_number', nullable: true })
  registrationNumber: string;

  @Column({ name: 'industry_type', nullable: true })
  industryType: string;

  @Column({ name: 'company_size', nullable: true })
  companySize: string;

  @Column({ nullable: true })
  description: string;

  @Column({ name: 'tracks_emissions', default: false })
  tracksEmissions: boolean;

  @Column({ name: 'emission_sources', type: 'simple-array', nullable: true })
  emissionSources: string[];

  @Column({ name: 'sustainability_certifications', type: 'simple-array', nullable: true })
  sustainabilityCertifications: string[];

  @Column({ name: 'prior_offsetting', default: false })
  priorOffsetting: boolean;

  @Column({ name: 'contact_email', nullable: true })
  contactEmail: string;

  @Column({ name: 'website_url', nullable: true })
  websiteUrl: string;

  @Column({ name: 'accepted_terms', default: false })
  acceptedTerms: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relationships
  @OneToOne(() => Wallet, wallet => wallet.organization)
  @JoinColumn({ name: 'wallet_id' })
  wallet: Wallet;
} 