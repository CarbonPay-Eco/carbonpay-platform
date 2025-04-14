export interface ApiResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
  error?: any;
}

export interface Organization {
  id: string;
  name: string;
  walletAddress: string;
  description?: string;
  logo?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  location: string;
  vintage: string;
  standard: string;
  tokenId: string;
  totalSupply: number;
  remainingSupply: number;
  certificationUrl?: string;
  imageUrl?: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface Retirement {
  id: string;
  walletAddress: string;
  organizationId: string;
  projectId: string;
  amount: number;
  transactionHash: string;
  beneficiary?: string;
  retirementMessage?: string;
  createdAt: Date;
}

export interface AuditLog {
  id: string;
  action: string;
  walletAddress: string;
  details: Record<string, any>;
  createdAt: Date;
} 