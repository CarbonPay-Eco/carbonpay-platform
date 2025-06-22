import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  SYSVAR_RENT_PUBKEY,
  Transaction as SolanaTransaction,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";

const PROGRAM_ID = new PublicKey("bGiephq1pZ8kxJVumdgCMEa2BjCEJuviCSwHgL9rdfg");

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

export class CarbonCreditsSimpleService {
  private connection: Connection;
  private adminKeypair: Keypair;

  constructor() {
    // Configurar conexão com a rede Solana
    const rpcUrl = process.env.SOLANA_RPC_URL || "http://localhost:8899";
    this.connection = new Connection(rpcUrl, "confirmed");

    // Configurar keypair do admin (para web2.5 - backend assina tudo)
    this.initializeAdmin();
  }

  private initializeAdmin() {
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
        "🔑 Admin Keypair gerado:",
        this.adminKeypair.publicKey.toBase58()
      );
      console.log(
        "🔐 Admin Secret Key (salve em ADMIN_SECRET_KEY):",
        Buffer.from(this.adminKeypair.secretKey).toString("base64")
      );
    }
  }

  async getAdminInfo(): Promise<any> {
    try {
      const balance = await this.connection.getBalance(
        this.adminKeypair.publicKey
      );

      return {
        publicKey: this.adminKeypair.publicKey.toBase58(),
        balance: balance / 1000000000, // Convert lamports to SOL
        hasMinimumBalance: balance > 100000000, // 0.1 SOL minimum
        network: this.connection.rpcEndpoint,
      };
    } catch (error) {
      console.error("Erro ao buscar informações do admin:", error);
      throw error;
    }
  }

  async ensureAdminBalance(): Promise<string | null> {
    try {
      const balance = await this.connection.getBalance(
        this.adminKeypair.publicKey
      );
      const minBalance = 1000000000; // 1 SOL em lamports

      if (balance < minBalance) {
        console.log(
          "💰 Admin precisa de mais SOL. Balance atual:",
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
            console.log("✅ Airdrop realizado:", signature);
            return signature;
          } catch (error) {
            console.error("❌ Erro no airdrop:", error);
            return null;
          }
        } else {
          console.log("⚠️ Não é possível fazer airdrop em mainnet/devnet");
          return null;
        }
      } else {
        console.log(
          "✅ Admin tem SOL suficiente:",
          balance / 1000000000,
          "SOL"
        );
        return null;
      }
    } catch (error) {
      console.error("Erro ao verificar balance do admin:", error);
      throw error;
    }
  }

  async testConnection(): Promise<any> {
    try {
      // Teste básico de conectividade
      const version = await this.connection.getVersion();
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();

      return {
        success: true,
        network: this.connection.rpcEndpoint.includes("localhost")
          ? "localnet"
          : this.connection.rpcEndpoint.includes("devnet")
          ? "devnet"
          : "mainnet",
        slot: slot,
        blockHeight: blockHeight,
        version: version,
        endpoint: this.connection.rpcEndpoint,
      };
    } catch (error) {
      console.error("Erro na conexão com Solana:", error);
      return {
        success: false,
        network: "disconnected",
        slot: 0,
        error: error.message,
        endpoint: this.connection.rpcEndpoint,
      };
    }
  }

  async initializeCarbonCredits(): Promise<string> {
    try {
      // Para a versão simplificada, vamos simular a inicialização
      // Garantir que o admin tem SOL suficiente
      await this.ensureAdminBalance();

      // Derivar PDA para carbon_credits (simulado)
      const [carbonCreditsPda] = await PublicKey.findProgramAddress(
        [Buffer.from("carbon_credits")],
        PROGRAM_ID
      );

      console.log(
        "🌿 Carbon Credits PDA derivado:",
        carbonCreditsPda.toBase58()
      );

      // Por enquanto, vamos simular a transação de inicialização
      // Em uma implementação completa, aqui seria feita a chamada real para o programa
      const mockSignature = `init_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log("✅ Carbon Credits inicializado (simulado):", mockSignature);
      return mockSignature;
    } catch (error) {
      console.error("❌ Erro ao inicializar Carbon Credits:", error);
      throw error;
    }
  }

  async createProject(projectData: CarbonCreditProject): Promise<string> {
    try {
      console.log("🌱 Criando projeto:", projectData.name);

      // Garantir que o admin tem SOL suficiente
      await this.ensureAdminBalance();

      // Por enquanto, vamos simular a criação do projeto
      // Em uma implementação completa, aqui seria feita a interação real com o programa Anchor
      const mockSignature = `project_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log("✅ Projeto criado (simulado):", mockSignature);
      console.log("📋 Dados do projeto:", {
        id: projectData.id,
        name: projectData.name,
        symbol: projectData.symbol,
        amount: projectData.amount,
        pricePerToken: projectData.pricePerToken / 1000000000, // Convert lamports to SOL
      });

      return mockSignature;
    } catch (error) {
      console.error("❌ Erro ao criar projeto:", error);
      throw error;
    }
  }

  async purchaseCredits(purchaseData: PurchaseRequest): Promise<string> {
    try {
      console.log("💳 Comprando créditos:", purchaseData);

      // Por enquanto, vamos simular a compra
      // Em uma implementação completa, aqui seria feita a interação real com o programa
      const mockSignature = `purchase_${Date.now()}_${Math.random()
        .toString(36)
        .substr(2, 9)}`;

      console.log("✅ Créditos comprados (simulado):", mockSignature);
      return mockSignature;
    } catch (error) {
      console.error("❌ Erro ao comprar créditos:", error);
      throw error;
    }
  }

  async getSystemStatus(): Promise<any> {
    try {
      const connectionTest = await this.testConnection();
      const adminInfo = await this.getAdminInfo();

      return {
        service: "CarbonCreditsSimpleService",
        version: "1.0.0",
        isConnected: connectionTest.success,
        network: connectionTest.network,
        adminPublicKey: adminInfo.publicKey,
        status: "operational",
        timestamp: new Date().toISOString(),
        connection: connectionTest,
        admin: adminInfo,
        programId: PROGRAM_ID.toBase58(),
      };
    } catch (error) {
      console.error("Erro ao buscar status do sistema:", error);
      return {
        service: "CarbonCreditsSimpleService",
        version: "1.0.0",
        isConnected: false,
        network: "disconnected",
        adminPublicKey: null,
        status: "error",
        timestamp: new Date().toISOString(),
        error: error.message,
      };
    }
  }

  // Função para testar assinatura de transações pelo backend (web2.5)
  async testBackendSigning(): Promise<any> {
    try {
      // Criar uma transação simples para testar assinatura
      const transaction = new SolanaTransaction();

      // Adicionar uma instrução básica (transfer de 0 SOL para si mesmo)
      const instruction = SystemProgram.transfer({
        fromPubkey: this.adminKeypair.publicKey,
        toPubkey: this.adminKeypair.publicKey,
        lamports: 0, // 0 lamports para não gastar SOL
      });

      transaction.add(instruction);

      // Buscar blockhash recente
      const { blockhash } = await this.connection.getLatestBlockhash();
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = this.adminKeypair.publicKey;

      // Assinar a transação (web2.5 - backend assina)
      transaction.sign(this.adminKeypair);

      // Simular o envio (não vamos realmente enviar para economizar SOL)
      const serialized = transaction.serialize();

      console.log("✅ Transação assinada pelo backend (web2.5)");
      console.log("📝 Tamanho da transação:", serialized.length, "bytes");

      return {
        success: true,
        adminSigned: true,
        signature: `signed_tx_${Date.now()}`,
        type: "backend_signing_test",
        transactionSize: serialized.length,
        signer: this.adminKeypair.publicKey.toBase58(),
        message: "Backend conseguiu assinar transação com sucesso (web2.5)",
      };
    } catch (error) {
      console.error("❌ Erro no teste de assinatura:", error);
      return {
        success: false,
        adminSigned: false,
        signature: null,
        type: "backend_signing_test",
        error: error.message,
      };
    }
  }
}
