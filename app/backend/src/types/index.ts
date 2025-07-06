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
  tokenId: string;
  projectName: string;
  location?: string;
  description?: string;
  certificationBody?: string;
  projectRefId?: string;
  methodology?: string;
  verifierName?: string;
  vintageYear?: number;
  standard?: string;
  totalIssued: number;
  available: number;
  pricePerTon?: number;
  ipfsHash?: string;
  documentationUrl?: string;
  onChainMintTx?: string;
  status: string;
  projectImageUrl?: string;
  tags?: string[];
  createdAt: Date;
  updatedAt?: Date;
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