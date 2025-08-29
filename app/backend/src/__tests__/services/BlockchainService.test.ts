import { BlockchainService } from '../../services/BlockchainService';
import { WalletService } from '../../services/WalletService';
import { Connection, PublicKey, Transaction } from '@solana/web3.js';
import {
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  createTransferInstruction,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token';

// Mock dependencies
jest.mock('../../services/WalletService');
jest.mock('@solana/web3.js');
jest.mock('@solana/spl-token');

describe('BlockchainService', () => {
  let mockConnection: any;
  let mockKeypair: any;
  let mockPublicKey: any;
  let mockTransaction: any;

  beforeEach(() => {
    mockConnection = {
      getTokenAccountBalance: jest.fn(),
      getLatestBlockhash: jest.fn(),
      sendRawTransaction: jest.fn(),
      confirmTransaction: jest.fn(),
    };

    mockKeypair = {
      publicKey: {
        toBase58: jest.fn().mockReturnValue('mock-public-key'),
      },
      secretKey: new Uint8Array(32),
    };

    mockPublicKey = {
      toBase58: jest.fn().mockReturnValue('mock-public-key'),
    };

    mockTransaction = {
      add: jest.fn().mockReturnThis(),
      recentBlockhash: '',
      feePayer: null,
      sign: jest.fn(),
      serialize: jest.fn().mockReturnValue(new Uint8Array([1, 2, 3])),
    };

    (Connection as jest.Mock).mockImplementation(() => mockConnection);
    (PublicKey as jest.Mock).mockImplementation((key) => ({
      toBase58: () => key,
      toString: () => key,
    }));
    (Transaction as jest.Mock).mockImplementation(() => mockTransaction);
    (getAssociatedTokenAddress as jest.Mock).mockResolvedValue('mock-token-account');
    (createAssociatedTokenAccountInstruction as jest.Mock).mockReturnValue({});
    (createTransferInstruction as jest.Mock).mockReturnValue({});
    (WalletService.getKeypair as jest.Mock).mockResolvedValue(mockKeypair);

    jest.clearAllMocks();
  });

  describe('getUSDCBalance', () => {
    it('should get USDC balance successfully', async () => {
      const mockBalance = {
        value: {
          amount: '1000000',
          decimals: 6,
        },
      };

      mockConnection.getTokenAccountBalance.mockResolvedValue(mockBalance);

      const result = await BlockchainService.getUSDCBalance('wallet-123', 'password123');

      expect(WalletService.getKeypair).toHaveBeenCalledWith('wallet-123', 'password123');
      expect(getAssociatedTokenAddress).toHaveBeenCalledWith(
        expect.any(PublicKey),
        mockKeypair.publicKey
      );
      expect(mockConnection.getTokenAccountBalance).toHaveBeenCalledWith('mock-token-account');
      expect(result).toBe(1.0); // 1000000 / 10^6
    });

    it('should return 0 when token account does not exist', async () => {
      mockConnection.getTokenAccountBalance.mockRejectedValue(new Error('Account not found'));

      const result = await BlockchainService.getUSDCBalance('wallet-123', 'password123');

      expect(result).toBe(0);
    });

    it('should handle different decimal places correctly', async () => {
      const mockBalance = {
        value: {
          amount: '500000',
          decimals: 6,
        },
      };

      mockConnection.getTokenAccountBalance.mockResolvedValue(mockBalance);

      const result = await BlockchainService.getUSDCBalance('wallet-123', 'password123');

      expect(result).toBe(0.5); // 500000 / 10^6
    });

    it('should handle zero balance', async () => {
      const mockBalance = {
        value: {
          amount: '0',
          decimals: 6,
        },
      };

      mockConnection.getTokenAccountBalance.mockResolvedValue(mockBalance);

      const result = await BlockchainService.getUSDCBalance('wallet-123', 'password123');

      expect(result).toBe(0);
    });
  });

  describe('transferUSDC', () => {
    it('should transfer USDC successfully', async () => {
      const mockBlockhash = {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      };

      mockConnection.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockConnection.sendRawTransaction.mockResolvedValue('mock-signature');
      mockConnection.confirmTransaction.mockResolvedValue({});

      const result = await BlockchainService.transferUSDC(
        'wallet-123',
        'destination-public-key',
        10.5,
        'password123'
      );

      expect(WalletService.getKeypair).toHaveBeenCalledWith('wallet-123', 'password123');
      expect(getAssociatedTokenAddress).toHaveBeenCalledTimes(2); // source and destination
      expect(createAssociatedTokenAccountInstruction).toHaveBeenCalledWith(
        mockKeypair.publicKey,
        expect.any(PublicKey),
        expect.any(PublicKey),
        expect.any(PublicKey)
      );
      expect(createTransferInstruction).toHaveBeenCalledWith(
        expect.any(PublicKey),
        expect.any(PublicKey),
        mockKeypair.publicKey,
        10500000 // 10.5 * 10^6
      );
      expect(mockTransaction.add).toHaveBeenCalledTimes(2);
      expect(mockTransaction.recentBlockhash).toBe('mock-blockhash');
      expect(mockTransaction.feePayer).toBe(mockKeypair.publicKey);
      expect(mockTransaction.sign).toHaveBeenCalledWith(mockKeypair);
      expect(mockConnection.sendRawTransaction).toHaveBeenCalledWith(
        expect.any(Uint8Array)
      );
      expect(mockConnection.confirmTransaction).toHaveBeenCalledWith('mock-signature');
      expect(result).toBe('mock-signature');
    });

    it('should handle zero amount transfer', async () => {
      const mockBlockhash = {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      };

      mockConnection.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockConnection.sendRawTransaction.mockResolvedValue('mock-signature');
      mockConnection.confirmTransaction.mockResolvedValue({});

      const result = await BlockchainService.transferUSDC(
        'wallet-123',
        'destination-public-key',
        0,
        'password123'
      );

      expect(createTransferInstruction).toHaveBeenCalledWith(
        expect.any(PublicKey),
        expect.any(PublicKey),
        mockKeypair.publicKey,
        0
      );
      expect(result).toBe('mock-signature');
    });

    it('should handle decimal amounts correctly', async () => {
      const mockBlockhash = {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      };

      mockConnection.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockConnection.sendRawTransaction.mockResolvedValue('mock-signature');
      mockConnection.confirmTransaction.mockResolvedValue({});

      await BlockchainService.transferUSDC(
        'wallet-123',
        'destination-public-key',
        0.001,
        'password123'
      );

      expect(createTransferInstruction).toHaveBeenCalledWith(
        expect.any(PublicKey),
        expect.any(PublicKey),
        mockKeypair.publicKey,
        1000 // 0.001 * 10^6
      );
    });

    it('should handle large amounts correctly', async () => {
      const mockBlockhash = {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      };

      mockConnection.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockConnection.sendRawTransaction.mockResolvedValue('mock-signature');
      mockConnection.confirmTransaction.mockResolvedValue({});

      await BlockchainService.transferUSDC(
        'wallet-123',
        'destination-public-key',
        1000000,
        'password123'
      );

      expect(createTransferInstruction).toHaveBeenCalledWith(
        expect.any(PublicKey),
        expect.any(PublicKey),
        mockKeypair.publicKey,
        1000000000000 // 1000000 * 10^6
      );
    });

    it('should handle transaction errors', async () => {
      mockConnection.getLatestBlockhash.mockRejectedValue(new Error('Network error'));

      await expect(
        BlockchainService.transferUSDC(
          'wallet-123',
          'destination-public-key',
          10,
          'password123'
        )
      ).rejects.toThrow('Network error');
    });

    it('should handle confirmation errors', async () => {
      const mockBlockhash = {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      };

      mockConnection.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      mockConnection.sendRawTransaction.mockResolvedValue('mock-signature');
      mockConnection.confirmTransaction.mockRejectedValue(new Error('Confirmation failed'));

      await expect(
        BlockchainService.transferUSDC(
          'wallet-123',
          'destination-public-key',
          10,
          'password123'
        )
      ).rejects.toThrow('Confirmation failed');
    });
  });

  describe('environment configuration', () => {
    it('should use default RPC URL when not provided', () => {
      const originalEnv = process.env.SOLANA_RPC_URL;
      delete process.env.SOLANA_RPC_URL;

      // Create a new instance to trigger the default URL
      new BlockchainService();

      expect(Connection).toHaveBeenCalledWith('https://api.mainnet-beta.solana.com');

      process.env.SOLANA_RPC_URL = originalEnv;
    });

    it('should use custom RPC URL when provided', () => {
      const originalEnv = process.env.SOLANA_RPC_URL;
      process.env.SOLANA_RPC_URL = 'https://custom-rpc.solana.com';

      // Create a new instance to trigger the custom URL
      new BlockchainService();

      expect(Connection).toHaveBeenCalledWith('https://custom-rpc.solana.com');

      process.env.SOLANA_RPC_URL = originalEnv;
    });

    it('should use default USDC mint when not provided', () => {
      const originalEnv = process.env.USDC_MINT_ADDRESS;
      delete process.env.USDC_MINT_ADDRESS;

      // Trigger USDC mint creation by calling a method
      BlockchainService.getUSDCBalance('wallet-123', 'password123');

      expect(PublicKey).toHaveBeenCalledWith(
        '4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU'
      );

      process.env.USDC_MINT_ADDRESS = originalEnv;
    });

    it('should use custom USDC mint when provided', () => {
      const originalEnv = process.env.USDC_MINT_ADDRESS;
      process.env.USDC_MINT_ADDRESS = 'CustomUSDCAddress111111111111111111111111';

      // Trigger USDC mint creation by calling a method
      BlockchainService.getUSDCBalance('wallet-123', 'password123');

      expect(PublicKey).toHaveBeenCalledWith(
        'CustomUSDCAddress111111111111111111111111'
      );

      process.env.USDC_MINT_ADDRESS = originalEnv;
    });
  });

  describe('error handling', () => {
    it('should handle wallet service errors', async () => {
      (WalletService.getKeypair as jest.Mock).mockRejectedValue(
        new Error('Wallet not found')
      );

      await expect(
        BlockchainService.getUSDCBalance('wallet-123', 'password123')
      ).rejects.toThrow('Wallet not found');
    });

    it('should handle invalid public key format', async () => {
      const mockBlockhash = {
        blockhash: 'mock-blockhash',
        lastValidBlockHeight: 1000,
      };

      mockConnection.getLatestBlockhash.mockResolvedValue(mockBlockhash);
      (PublicKey as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid public key');
      });

      await expect(
        BlockchainService.transferUSDC(
          'wallet-123',
          'invalid-public-key',
          10,
          'password123'
        )
      ).rejects.toThrow('Invalid public key');
    });
  });
});

