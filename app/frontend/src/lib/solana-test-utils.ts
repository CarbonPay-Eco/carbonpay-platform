import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import { SolanaClient } from "./solana-client";
import { useSolanaClient } from "../hooks/useSolanaClient";

// Utilitários para testar a integração Solana
export class SolanaTestUtils {
  private connection: Connection;
  private client: SolanaClient;

  constructor(connection: Connection, client: SolanaClient) {
    this.connection = connection;
    this.client = client;
  }

  // Teste básico de conexão
  async testConnection(): Promise<boolean> {
    try {
      const version = await this.connection.getVersion();
      console.log("✅ Connection successful:", version);
      return true;
    } catch (error) {
      console.error("❌ Connection failed:", error);
      return false;
    }
  }

  // Teste de criação de projeto
  async testProjectCreation() {
    try {
      console.log("🧪 Testing project creation...");

      // Gerar novos mints
      const nftMint = Keypair.generate();
      const tokenMint = Keypair.generate();

      const result = await this.client.initializeProject({
        amount: 1000,
        pricePerToken: 1,
        carbonPayFee: 5,
        uri: "https://test.com/metadata.json",
        name: "Test Project",
        symbol: "TEST",
        nftMint: nftMint.publicKey,
        tokenMint: tokenMint.publicKey,
      });

      console.log("✅ Project created successfully:", result.tx);
      return result;
    } catch (error) {
      console.error("❌ Project creation failed:", error);
      throw error;
    }
  }

  // Teste de busca de projetos
  async testProjectFetching() {
    try {
      console.log("🧪 Testing project fetching...");

      const projects = await this.client.getAllProjects();
      console.log("✅ Projects fetched:", projects.length);

      return projects;
    } catch (error) {
      console.error("❌ Project fetching failed:", error);
      throw error;
    }
  }

  // Teste de offset request
  async testOffsetRequest(projectPDA: PublicKey) {
    try {
      console.log("🧪 Testing offset request...");

      const requestId = `test_offset_${Date.now()}`;
      const result = await this.client.requestOffset({
        amount: 100,
        requestId,
        projectPDA,
      });

      console.log("✅ Offset requested successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Offset request failed:", error);
      throw error;
    }
  }

  // Teste de compra de credits
  async testCreditPurchase(projectPDA: PublicKey, tokenMint: PublicKey) {
    try {
      console.log("🧪 Testing credit purchase...");

      const result = await this.client.purchaseCarbonCredits({
        amount: 50,
        projectPDA,
        tokenMint,
      });

      console.log("✅ Credits purchased successfully:", result);
      return result;
    } catch (error) {
      console.error("❌ Credit purchase failed:", error);
      throw error;
    }
  }

  // Teste completo do fluxo
  async runFullTest() {
    console.log("🚀 Starting full integration test...");

    try {
      // 1. Testar conexão
      const connectionOk = await this.testConnection();
      if (!connectionOk) {
        throw new Error("Connection test failed");
      }

      // 2. Testar criação de projeto
      const projectResult = await this.testProjectCreation();

      // 3. Testar busca de projetos
      const projects = await this.testProjectFetching();

      // 4. Testar offset request (se houver projetos)
      if (projects.length > 0) {
        const firstProject = projects[0];
        await this.testOffsetRequest(firstProject.publicKey);
      }

      console.log("✅ All tests passed!");
      return {
        success: true,
        projectCreated: projectResult,
        projectsFound: projects.length,
      };
    } catch (error) {
      console.error("❌ Test suite failed:", error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  // Verificar saldo da wallet
  async checkWalletBalance(walletPublicKey: PublicKey) {
    try {
      const balance = await this.connection.getBalance(walletPublicKey);
      console.log("💰 Wallet balance:", balance / 1e9, "SOL");
      return balance;
    } catch (error) {
      console.error("❌ Failed to get wallet balance:", error);
      return 0;
    }
  }

  // Verificar se programa está deployado
  async checkProgramDeployment(programId: PublicKey) {
    try {
      const accountInfo = await this.connection.getAccountInfo(programId);
      if (accountInfo) {
        console.log("✅ Program is deployed");
        return true;
      } else {
        console.log("❌ Program not found");
        return false;
      }
    } catch (error) {
      console.error("❌ Failed to check program deployment:", error);
      return false;
    }
  }
}

// Hook para usar os testes no React
export const useSolanaTests = () => {
  const { client, connection } = useSolanaClient();

  const runTests = async () => {
    if (!client || !connection) {
      throw new Error("Client or connection not available");
    }

    const testUtils = new SolanaTestUtils(connection, client);
    return await testUtils.runFullTest();
  };

  const checkBalance = async (walletPublicKey: PublicKey) => {
    if (!connection) {
      throw new Error("Connection not available");
    }

    const testUtils = new SolanaTestUtils(connection, client!);
    return await testUtils.checkWalletBalance(walletPublicKey);
  };

  return {
    runTests,
    checkBalance,
  };
};
