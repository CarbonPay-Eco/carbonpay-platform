import {
  Connection,
  PublicKey,
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
  getAccount,
  getMint,
} from "@solana/spl-token";
import { CarbonPay } from "../../../../target/types/carbon_pay";
import idl from "../../../../target/idl/carbon_pay.json";

// Metadata Program ID from Metaplex
const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

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
    return getAssociatedTokenAddress(
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
          systemProgram: SystemProgram.programId,
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
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const [masterEditionPDA] = await this.findPDA(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.toBuffer(),
          Buffer.from("edition"),
        ],
        METADATA_PROGRAM_ID
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
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
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
          systemProgram: SystemProgram.programId,
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
      const buyer = this.provider.wallet.publicKey;

      // 1. Buscar dados do projeto para obter o project owner
      const project = await this.program.account.project.fetch(projectPDA);
      const projectOwner = project.owner;

      // 2. Buscar dados do carbon credits para obter USDC mint e vault
      const [carbonCreditsPDA] = await this.findPDA(
        [Buffer.from("carbon_credits")],
        this.program.programId
      );
      const carbonCredits = await this.program.account.carbonCredits.fetch(
        carbonCreditsPDA
      );
      const usdcMint = carbonCredits.usdcMint;
      const platformUsdcVault = carbonCredits.usdcVault;

      // 3. Criar purchase NFT mint
      const purchaseNftMintKeypair = Keypair.generate();
      const purchaseNftMint = await createMint(
        this.connection,
        this.provider.wallet as any,
        buyer, // mint authority
        buyer, // freeze authority
        0, // decimals (NFT)
        purchaseNftMintKeypair,
        undefined,
        TOKEN_PROGRAM_ID
      );

      // 4. Calcular PDAs e ATAs
      const buyerTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        buyer
      );
      const projectTokenAccount = await getAssociatedTokenAddress(
        tokenMint,
        carbonCreditsPDA
      );
      const buyerNftAccount = await getAssociatedTokenAddress(
        purchaseNftMint,
        buyer
      );
      const buyerUsdcAccount = await getAssociatedTokenAddress(
        usdcMint,
        buyer
      );
      const projectOwnerUsdcAccount = await getAssociatedTokenAddress(
        usdcMint,
        projectOwner
      );

      // 5. Derive Purchase PDA
      const [purchasePDA] = await this.findPDA(
        [
          Buffer.from("purchase"),
          buyer.toBuffer(),
          projectPDA.toBuffer(),
          purchaseNftMint.toBuffer(),
        ],
        this.program.programId
      );

      // 6. Derive purchase metadata PDA
      const [purchaseMetadataPDA] = await this.findPDA(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          purchaseNftMint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      // 7. Criar ATAs se não existirem
      const createAtaIxs = [];
      
      // Verificar e criar buyer token ATA
      try {
        await getAccount(this.connection, buyerTokenAccount);
      } catch {
        createAtaIxs.push(
          createAssociatedTokenAccountInstruction(
            buyer,
            buyerTokenAccount,
            buyer,
            tokenMint
          )
        );
      }

      // Verificar e criar buyer NFT ATA
      try {
        await getAccount(this.connection, buyerNftAccount);
      } catch {
        createAtaIxs.push(
          createAssociatedTokenAccountInstruction(
            buyer,
            buyerNftAccount,
            buyer,
            purchaseNftMint
          )
        );
      }

      // Verificar e criar buyer USDC ATA
      try {
        await getAccount(this.connection, buyerUsdcAccount);
      } catch {
        createAtaIxs.push(
          createAssociatedTokenAccountInstruction(
            buyer,
            buyerUsdcAccount,
            buyer,
            usdcMint
          )
        );
      }

      // 8. Executar transação de compra
      const tx = await this.program.methods
        .purchaseCarbonCredits(new BN(amount))
        .accountsPartial({
          project: projectPDA,
          projectOwner,
          projectMint: tokenMint,
          carbonCredits: carbonCreditsPDA,
          projectTokenAccount,
          purchaseNftMint: purchaseNftMint,
          buyerNftAccount,
          buyerTokenAccount,
          purchase: purchasePDA,
          usdcMint,
          buyerUsdcAccount,
          projectOwnerUsdcAccount,
          platformUsdcVault,
          purchaseMetadata: purchaseMetadataPDA,
          buyer,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .preInstructions(createAtaIxs)
        .signers([purchaseNftMintKeypair])
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
