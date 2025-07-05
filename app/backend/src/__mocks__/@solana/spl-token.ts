export const TOKEN_PROGRAM_ID = { toBase58: () => "mock-token-program-id" };

export class Token {
  constructor() {
    return {
      createAccount: jest.fn().mockResolvedValue("mock-token-account"),
      mintTo: jest.fn().mockResolvedValue("mock-mint-signature"),
      transfer: jest.fn().mockResolvedValue("mock-transfer-signature"),
      getAccountInfo: jest.fn().mockResolvedValue({
        amount: 1000000,
        owner: { toBase58: () => "mock-owner" }
      })
    };
  }
}

export const ASSOCIATED_TOKEN_PROGRAM_ID = { toBase58: () => "mock-associated-token-program-id" };

export const getAssociatedTokenAddress = jest.fn().mockResolvedValue({
  toBase58: () => "mock-associated-token-address"
}); 