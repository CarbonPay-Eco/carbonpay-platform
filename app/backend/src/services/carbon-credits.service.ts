import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
} from "@solana/web3.js";
import { Program, AnchorProvider, Wallet, BN } from "@project-serum/anchor";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  createMint,
  getAssociatedTokenAddress,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { WalletService } from "./WalletService";
import { AppDataSource } from "../database/data-source";
import { Wallet as WalletEntity } from "../entities/Wallet";

// Import do IDL gerado automaticamente pelo Anchor
const IDL = require("../../idl/carbon_pay.json");

const PROGRAM_ID = new PublicKey("bGiephq1pZ8kxJVumdgCMEa2BjCEJuviCSwHgL9rdfg");
const METADATA_PROGRAM_ID = new PublicKey(
  "metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s"
);

export interface CarbonCreditProject {
  id: string;
  name: string;
  symbol: string;
  uri: string;
  amount: number;
  pricePerToken: number;
  carbonPayFee: number;
  ownerUserId: string;
}

export interface PurchaseRequest {
  userId: string;
  projectId: string;
  amount: number;
}

export class CarbonCreditsService {
  private connection: Connection;
  private adminKeypair: Keypair;
  private adminWallet: Wallet;
  private provider: AnchorProvider;
  private program: Program;

  constructor() {
    // Configurar conexão com a rede Solana
    const rpcUrl = process.env.SOLANA_RPC_URL || "http://localhost:8899";
    this.connection = new Connection(rpcUrl, "confirmed");

    // Configurar keypair do admin (para web2.5 - backend assina tudo)
    this.initializeAdmin();
  }

  private async initializeAdmin() {
    // Em produção, você deve usar uma chave privada segura do ambiente
    const adminSecretKey = process.env.ADMIN_SECRET_KEY;
    if (adminSecretKey) {
      this.adminKeypair = Keypair.fromSecretKey(
        Buffer.from(adminSecretKey, "base64")
      );
    } else {
      // Para desenvolvimento/teste, gera uma nova chave
      this.adminKeypair = Keypair.generate();
      console.log(
        "Admin Keypair gerado:",
        this.adminKeypair.publicKey.toBase58()
      );
      console.log(
        "Admin Secret Key:",
        Buffer.from(this.adminKeypair.secretKey).toString("base64")
      );
    }

    // Configurar wallet adapter para o provider
    this.adminWallet = {
      publicKey: this.adminKeypair.publicKey,
      signTransaction: async (tx) => {
        tx.partialSign(this.adminKeypair);
        return tx;
      },
      signAllTransactions: async (txs) => {
        txs.forEach((tx) => tx.partialSign(this.adminKeypair));
        return txs;
      },
    };

    // Configurar provider e program
    this.provider = new AnchorProvider(this.connection, this.adminWallet, {
      commitment: "confirmed",
    });

    this.program = new Program(IDL, PROGRAM_ID, this.provider);
  }

  async initializeCarbonCredits(): Promise<string> {
    try {
      // Derivar PDA para carbon_credits
      const [carbonCreditsPda] = await PublicKey.findProgramAddress(
        [Buffer.from("carbon_credits")],
        PROGRAM_ID
      );

      // Verificar se já foi inicializado
      try {
        const account = await this.program.account.carbonCredits.fetch(
          carbonCreditsPda
        );
        console.log(
          "Carbon Credits já inicializado:",
          carbonCreditsPda.toBase58()
        );
        return carbonCreditsPda.toBase58();
      } catch (error) {
        // Conta não existe, precisamos inicializar
      }

      // Garantir que o admin tem SOL suficiente
      await this.ensureAdminBalance();

      const tx = await this.program.methods
        .initializeCarbonCredits()
        .accounts({
          admin: this.adminKeypair.publicKey,
          carbonCredits: carbonCreditsPda,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
        })
        .signers([this.adminKeypair])
        .rpc();

      console.log("Carbon Credits inicializado com sucesso:", tx);
      return tx;
    } catch (error) {
      console.error("Erro ao inicializar Carbon Credits:", error);
      throw error;
    }
  }

  async createProject(projectData: CarbonCreditProject): Promise<string> {
    try {
      // Obter keypair do usuário owner
      const walletRepository = AppDataSource.getRepository(WalletEntity);
      const ownerWallet = await walletRepository.findOneBy({
        userId: projectData.ownerUserId,
      });

      if (!ownerWallet) {
        throw new Error("Wallet do owner não encontrada");
      }

      const ownerKeypair = await WalletService.getKeypair(
        ownerWallet.id,
        process.env.WALLET_ENCRYPTION_KEY || ""
      );

      // Criar mints
      const nftMint = await createMint(
        this.connection,
        this.adminKeypair, // Admin paga as taxas
        ownerKeypair.publicKey, // Owner é o mint authority
        ownerKeypair.publicKey,
        0 // NFT tem 0 decimais
      );

      const tokenMint = await createMint(
        this.connection,
        this.adminKeypair, // Admin paga as taxas
        ownerKeypair.publicKey, // Owner é o mint authority inicial
        ownerKeypair.publicKey,
        0 // Tokens têm 0 decimais (créditos inteiros)
      );

      // Derivar PDAs necessários
      const [carbonCreditsPda] = await PublicKey.findProgramAddress(
        [Buffer.from("carbon_credits")],
        PROGRAM_ID
      );

      const [projectPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("project"),
          ownerKeypair.publicKey.toBuffer(),
          nftMint.toBuffer(),
        ],
        PROGRAM_ID
      );

      // Derivar ATAs
      const projectOwnerNftAccount = await getAssociatedTokenAddress(
        nftMint,
        ownerKeypair.publicKey
      );

      const vaultAta = await getAssociatedTokenAddress(
        tokenMint,
        carbonCreditsPda,
        true // allowOwnerOffCurve para PDAs
      );

      // Derivar metadata PDAs
      const [metadataPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.toBuffer(),
        ],
        METADATA_PROGRAM_ID
      );

      const [masterEditionPda] = await PublicKey.findProgramAddress(
        [
          Buffer.from("metadata"),
          METADATA_PROGRAM_ID.toBuffer(),
          nftMint.toBuffer(),
          Buffer.from("edition"),
        ],
        METADATA_PROGRAM_ID
      );

      // Criar ATAs primeiro (admin paga)
      const createAtaIx1 = createAssociatedTokenAccountInstruction(
        this.adminKeypair.publicKey, // payer
        projectOwnerNftAccount,
        ownerKeypair.publicKey, // owner
        nftMint
      );

      const createAtaIx2 = createAssociatedTokenAccountInstruction(
        this.adminKeypair.publicKey, // payer
        vaultAta,
        carbonCreditsPda, // owner - PDA
        tokenMint
      );

      // Executar criação das ATAs
      const createAtaTx = await this.provider.sendAndConfirm(
        await this.provider.connection.getTransaction(
          await this.provider.connection.sendTransaction(
            await this.provider.connection.getTransaction(
              await this.provider.sendAndConfirm(
                await this.provider.connection.sendTransaction(
                  [createAtaIx1, createAtaIx2]
                    .map((ix) => ({ instruction: ix, signers: [] }))
                    .reduce(
                      (tx, { instruction }) => tx.add(instruction),
                      new this.provider.connection.Transaction()
                    ),
                  [this.adminKeypair]
                )
              )
            )
          )
        )
      );

      // Chamar initializeProject (admin assina para web2.5)
      const tx = await this.program.methods
        .initializeProject(
          new BN(projectData.amount),
          new BN(projectData.pricePerToken),
          new BN(projectData.carbonPayFee),
          projectData.uri,
          projectData.name,
          projectData.symbol
        )
        .accounts({
          projectOwner: ownerKeypair.publicKey,
          project: projectPda,
          nftMint: nftMint,
          tokenMint: tokenMint,
          projectOwnerNftAccount: projectOwnerNftAccount,
          vault: vaultAta,
          carbonCredits: carbonCreditsPda,
          metadata: metadataPda,
          masterEdition: masterEditionPda,
          tokenProgram: TOKEN_PROGRAM_ID,
          tokenMetadataProgram: METADATA_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
          rent: SYSVAR_RENT_PUBKEY,
          associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID,
        })
        .signers([this.adminKeypair, ownerKeypair]) // Admin e owner assinam
        .rpc();

      console.log("Projeto criado com sucesso:", tx);
      return tx;
    } catch (error) {
      console.error("Erro ao criar projeto:", error);
      throw error;
    }
  }

  async purchaseCredits(purchaseData: PurchaseRequest): Promise<string> {
    try {
      // Esta função implementaria a compra de créditos
      // O backend assinaria a transação pelo usuário (web2.5)
      console.log("Comprando créditos:", purchaseData);

      // Implementação da compra seria aqui
      // Retornaria a signature da transação
      return "purchase_tx_signature";
    } catch (error) {
      console.error("Erro ao comprar créditos:", error);
      throw error;
    }
  }

  private async ensureAdminBalance() {
    const balance = await this.connection.getBalance(
      this.adminKeypair.publicKey
    );
    const minBalance = 1000000000; // 1 SOL em lamports

    if (balance < minBalance) {
      console.log(
        "Admin precisa de mais SOL. Balance atual:",
        balance / 1000000000,
        "SOL"
      );

      // Em localnet, solicitar airdrop
      if (
        this.connection.rpcEndpoint.includes("localhost") ||
        this.connection.rpcEndpoint.includes("127.0.0.1")
      ) {
        try {
          const signature = await this.connection.requestAirdrop(
            this.adminKeypair.publicKey,
            5 * 1000000000 // 5 SOL
          );
          await this.connection.confirmTransaction(signature);
          console.log("Airdrop realizado:", signature);
        } catch (error) {
          console.error("Erro no airdrop:", error);
        }
      }
    }
  }

  async getProjectInfo(projectPda: string): Promise<any> {
    try {
      const projectPublicKey = new PublicKey(projectPda);
      const projectAccount = await this.program.account.project.fetch(
        projectPublicKey
      );
      return projectAccount;
    } catch (error) {
      console.error("Erro ao buscar informações do projeto:", error);
      throw error;
    }
  }

  async getCarbonCreditsInfo(): Promise<any> {
    try {
      const [carbonCreditsPda] = await PublicKey.findProgramAddress(
        [Buffer.from("carbon_credits")],
        PROGRAM_ID
      );

      const carbonCreditsAccount =
        await this.program.account.carbonCredits.fetch(carbonCreditsPda);
      return carbonCreditsAccount;
    } catch (error) {
      console.error(
        "Erro ao buscar informações dos créditos de carbono:",
        error
      );
      throw error;
    }
  }
}
