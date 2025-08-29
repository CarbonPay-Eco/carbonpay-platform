import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import { Program, AnchorProvider, web3, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { CarbonPay } from "../../../../target/types/carbon_pay";
import idl from "../../../../target/idl/carbon_pay.json";

export class SolanaClient {
  private connection: Connection;
  private provider: AnchorProvider;
  private program: Program<CarbonPay>;

  constructor(connection: Connection, wallet: any) {
    this.connection = connection;
    this.provider = new AnchorProvider(connection, wallet, {
      commitment: "confirmed",
      preflightCommitment: "confirmed",
    });
    this.program = new Program(
      idl as any,
      new PublicKey(idl.metadata.address),
      this.provider
    );
  }

  // Helper para encontrar PDAs
  async findPDA(
    seeds: (Buffer | Uint8Array)[],
    programId: PublicKey
  ): Promise<[PublicKey, number]> {
    return PublicKey.findProgramAddress(seeds, programId);
  }

  // Helper para criar ATA
  async getAssociatedTokenAddress(
    mint: PublicKey,
    owner: PublicKey,
    allowOwnerOffCurve = false
  ): Promise<PublicKey> {
    return web3.AssociatedTokenProgram.getAssociatedTokenAddress(
      mint,
      owner,
      allowOwnerOffCurve,
      TOKEN_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID
    );
  }

  // Inicializar Carbon Credits Account
  async initializeCarbonCredits() {
    try {
      const [carbonCreditsPDA] = await this.findPDA(
        [Buffer.from("carbon_credits")],
        this.program.programId
      );

      const tx = await this.program.methods
        .initializeCarbonCredits()
        .accounts({
          carbonCredits: carbonCreditsPDA,
          payer: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Carbon credits initialized:", tx);
      return tx;
    } catch (error) {
      console.error("Error initializing carbon credits:", error);
      throw error;
    }
  }

  // Inicializar Projeto
  async initializeProject(params: {
    amount: number;
    pricePerToken: number;
    carbonPayFee: number;
    uri: string;
    name: string;
    symbol: string;
    nftMint: PublicKey;
    tokenMint: PublicKey;
  }) {
    try {
      const {
        amount,
        pricePerToken,
        carbonPayFee,
        uri,
        name,
        symbol,
        nftMint,
        tokenMint,
      } = params;

      // Encontrar PDAs
      const [projectPDA] = await this.findPDA(
        [
          Buffer.from("project"),
          this.provider.wallet.publicKey.toBuffer(),
          nftMint.toBuffer(),
        ],
        this.program.programId
      );

      const [carbonCreditsPDA] = await this.findPDA(
        [Buffer.from("carbon_credits")],
        this.program.programId
      );

      // Encontrar ATAs
      const projectOwnerNftAccount = await this.getAssociatedTokenAddress(
        nftMint,
        this.provider.wallet.publicKey
      );
      const vault = await this.getAssociatedTokenAddress(
        tokenMint,
        carbonCreditsPDA
      );

      // Encontrar metadata accounts
      const [metadataPDA] = await this.findPDA(
        [
          Buffer.from("metadata"),
          web3.MetadataProgram.programId.toBuffer(),
          nftMint.toBuffer(),
        ],
        web3.MetadataProgram.programId
      );

      const [masterEditionPDA] = await this.findPDA(
        [
          Buffer.from("metadata"),
          web3.MetadataProgram.programId.toBuffer(),
          nftMint.toBuffer(),
          Buffer.from("edition"),
        ],
        web3.MetadataProgram.programId
      );

      const tx = await this.program.methods
        .initializeProject(
          new BN(amount),
          new BN(pricePerToken),
          new BN(carbonPayFee),
          uri,
          name,
          symbol
        )
        .accounts({
          projectOwner: this.provider.wallet.publicKey,
          project: projectPDA,
          nftMint,
          tokenMint,
          projectOwnerNftAccount,
          vault,
          carbonCredits: carbonCreditsPDA,
          metadata: metadataPDA,
          masterEdition: masterEditionPDA,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: web3.MetadataProgram.programId,
          systemProgram: web3.SystemProgram.programId,
          rent: web3.SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .rpc();

      console.log("Project initialized:", tx);
      return { tx, projectPDA };
    } catch (error) {
      console.error("Error initializing project:", error);
      throw error;
    }
  }

  // Solicitar Offset
  async requestOffset(params: {
    amount: number;
    requestId: string;
    projectPDA: PublicKey;
  }) {
    try {
      const { amount, requestId, projectPDA } = params;

      const [offsetRequestPDA] = await this.findPDA(
        [
          Buffer.from("offset_request"),
          projectPDA.toBuffer(),
          Buffer.from(requestId),
        ],
        this.program.programId
      );

      const tx = await this.program.methods
        .requestOffset(new BN(amount), requestId)
        .accounts({
          project: projectPDA,
          offsetRequest: offsetRequestPDA,
          requester: this.provider.wallet.publicKey,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Offset requested:", tx);
      return tx;
    } catch (error) {
      console.error("Error requesting offset:", error);
      throw error;
    }
  }

  // Comprar Carbon Credits
  async purchaseCarbonCredits(params: {
    amount: number;
    projectPDA: PublicKey;
    tokenMint: PublicKey;
  }) {
    try {
      const { amount, projectPDA, tokenMint } = params;

      const [carbonCreditsPDA] = await this.findPDA(
        [Buffer.from("carbon_credits")],
        this.program.programId
      );

      const buyerTokenAccount = await this.getAssociatedTokenAddress(
        tokenMint,
        this.provider.wallet.publicKey
      );
      const vault = await this.getAssociatedTokenAddress(
        tokenMint,
        carbonCreditsPDA
      );

      const tx = await this.program.methods
        .purchaseCarbonCredits(new BN(amount))
        .accounts({
          project: projectPDA,
          carbonCredits: carbonCreditsPDA,
          buyer: this.provider.wallet.publicKey,
          buyerTokenAccount,
          vault,
          tokenMint,
          tokenProgram: TOKEN_PROGRAM_ID,
          systemProgram: web3.SystemProgram.programId,
        })
        .rpc();

      console.log("Carbon credits purchased:", tx);
      return tx;
    } catch (error) {
      console.error("Error purchasing carbon credits:", error);
      throw error;
    }
  }

  // Buscar dados do projeto
  async getProject(projectPDA: PublicKey) {
    try {
      const project = await this.program.account.project.fetch(projectPDA);
      return project;
    } catch (error) {
      console.error("Error fetching project:", error);
      throw error;
    }
  }

  // Buscar todos os projetos
  async getAllProjects() {
    try {
      const projects = await this.program.account.project.all();
      return projects;
    } catch (error) {
      console.error("Error fetching all projects:", error);
      throw error;
    }
  }

  // Buscar dados do carbon credits
  async getCarbonCredits() {
    try {
      const [carbonCreditsPDA] = await this.findPDA(
        [Buffer.from("carbon_credits")],
        this.program.programId
      );

      const carbonCredits = await this.program.account.carbonCredits.fetch(
        carbonCreditsPDA
      );
      return carbonCredits;
    } catch (error) {
      console.error("Error fetching carbon credits:", error);
      throw error;
    }
  }
}
