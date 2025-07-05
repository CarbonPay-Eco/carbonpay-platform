export class web3 {
  static PublicKey = class {
    constructor(key: string) {
      return { toBase58: () => key };
    }
    static findProgramAddress = jest.fn().mockResolvedValue([{ toBase58: () => "mock-address" }, 1]);
  };

  static Keypair = class {
    static generate = jest.fn().mockReturnValue({
      publicKey: { toBase58: () => "mock-public-key" },
      secretKey: new Uint8Array(32)
    });
  };

  static SystemProgram = {
    programId: { toBase58: () => "mock-program-id" }
  };

  static SYSVAR_RENT_PUBKEY = { toBase58: () => "mock-rent-pubkey" };
}

export class BN {
  constructor(value: number | string) {
    return value;
  }
}

export class Program {
  constructor() {
    return {
      programId: { toBase58: () => "mock-program-id" },
      provider: { connection: { getBalance: jest.fn().mockResolvedValue(1000000) } }
    };
  }
}

export class AnchorProvider {
  static local = jest.fn().mockReturnValue({
    connection: {
      getBalance: jest.fn().mockResolvedValue(1000000)
    },
    wallet: {
      publicKey: { toBase58: () => "mock-public-key" }
    }
  });
}

export class Wallet {
  constructor(keypair: any) {
    return {
      publicKey: keypair.publicKey,
      payer: keypair
    };
  }
} 