export class SolanaService {
  private connection: any;

  constructor() {
    this.connection = {
      getBalance: jest.fn().mockResolvedValue(1000000),
      getRecentBlockhash: jest.fn().mockResolvedValue({
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000
      })
    };
  }

  async mintCredit(walletAddress: string, data: any): Promise<string> {
    return 'mock-tx-hash';
  }

  async burnCredit(walletAddress: string, data: any): Promise<string> {
    return 'mock-tx-hash';
  }

  async getBalance(walletAddress: string): Promise<number> {
    return 1000000;
  }
} 