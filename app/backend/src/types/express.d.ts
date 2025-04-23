import 'express';

declare global {
  namespace Express {
    export interface Request {
      walletAddress?: string;
    }
  }
} 