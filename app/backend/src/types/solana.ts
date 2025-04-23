import { PublicKey } from '@solana/web3.js';
import { AnchorProvider, Program } from '@project-serum/anchor';

export interface WalletSignature {
  address: string;
  message: string;
  signature: string;
}

export interface SolanaWallet {
  publicKey: PublicKey;
  signMessage(message: Uint8Array): Promise<Uint8Array>;
  signTransaction: any;
  signAllTransactions: any;
}

export interface SolanaProvider {
  provider: AnchorProvider;
  program: Program;
}

export interface TokenData {
  tokenId: string;
  projectId: string;
  vintage: string;
  standard: string;
  totalSupply: number;
  remainingSupply: number;
  metadata: Record<string, any>;
}

export interface MintCreditParams {
  project: string;
  vintage: string;
  standard: string;
  amount: number;
  metadata: Record<string, any>;
}

export interface BurnCreditParams {
  tokenId: string;
  amount: number;
  beneficiary?: string;
  retirementMessage?: string;
} 