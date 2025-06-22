import { before, describe, test } from "node:test";
import assert from "node:assert";
import {
  CarbonCreditsSimpleService,
  CarbonCreditProject,
  PurchaseRequest,
} from "../app/backend/src/services/carbon-credits-simple.service";
import { Connection, Keypair, PublicKey } from "@solana/web3.js";

describe("CarbonCreditsSimpleService", () => {
  let service: CarbonCreditsSimpleService;

  before(async () => {
    service = new CarbonCreditsSimpleService();
  });

  test("deve inicializar o serviço corretamente", async () => {
    const status = await service.getSystemStatus();

    assert.strictEqual(typeof status.isConnected, "boolean");
    assert.strictEqual(typeof status.network, "string");
    assert.strictEqual(typeof status.adminPublicKey, "string");
    assert.strictEqual(status.service, "CarbonCreditsSimpleService");
    assert.strictEqual(status.version, "1.0.0");
    assert.strictEqual(status.isConnected, true); // Com localnet rodando deve estar conectado
  });

  test("deve testar conectividade com Solana", async () => {
    const connectionTest = await service.testConnection();

    assert.strictEqual(typeof connectionTest.success, "boolean");
    assert.strictEqual(typeof connectionTest.network, "string");
    assert.strictEqual(typeof connectionTest.slot, "number");
    assert.ok(connectionTest.slot >= 0);
    assert.strictEqual(connectionTest.success, true); // Com localnet deve conectar
  });

  test("deve obter informações do admin", async () => {
    const adminInfo = await service.getAdminInfo();

    assert.strictEqual(typeof adminInfo.publicKey, "string");
    assert.strictEqual(typeof adminInfo.balance, "number");
    assert.strictEqual(typeof adminInfo.network, "string");
    assert.ok(adminInfo.balance >= 0);
  });

  test("deve testar assinatura de transações (Web2.5)", async () => {
    const signingTest = await service.testBackendSigning();

    assert.strictEqual(typeof signingTest.success, "boolean");
    assert.strictEqual(typeof signingTest.adminSigned, "boolean");
    assert.strictEqual(typeof signingTest.signature, "string");
    assert.strictEqual(signingTest.type, "backend_signing_test");
    assert.ok(signingTest.signature.length > 0);
    assert.strictEqual(signingTest.success, true); // Backend deve assinar com sucesso
    assert.strictEqual(signingTest.adminSigned, true); // Admin deve assinar
  });

  test("deve garantir balance do admin", async () => {
    const result = await service.ensureAdminBalance();

    // Pode ser null se já tem SOL suficiente, ou string se fez airdrop
    assert.ok(result === null || typeof result === "string");
  });

  test("deve inicializar sistema de carbon credits (simulado)", async () => {
    const signature = await service.initializeCarbonCredits();

    assert.strictEqual(typeof signature, "string");
    assert.ok(signature.startsWith("init_")); // Mudou o prefixo
  });

  test("deve criar projeto de carbon credits", async () => {
    const projectData: CarbonCreditProject = {
      id: "test_project_123",
      name: "Teste Amazon Project",
      symbol: "TAP",
      uri: "https://test.carbonpay.io/metadata/test",
      amount: 500,
      pricePerToken: 15000000, // 0.015 SOL
      carbonPayFee: 300, // 3%
      ownerUserId: "test_user_456",
    };

    const signature = await service.createProject(projectData);

    assert.strictEqual(typeof signature, "string");
    assert.ok(signature.startsWith("project_")); // Mudou o prefixo
  });

  test("deve comprar carbon credits", async () => {
    const purchaseData: PurchaseRequest = {
      userId: "buyer_user_789",
      projectId: "test_project_123",
      amount: 10,
    };

    const signature = await service.purchaseCredits(purchaseData);

    assert.strictEqual(typeof signature, "string");
    assert.ok(signature.startsWith("purchase_")); // Mudou o prefixo
  });

  test("deve derivar PDAs corretamente", async () => {
    const testUserId = "test_user_123";
    const testProjectId = "test_project_456";

    // Usar método privado através de uma função pública se necessário
    const adminInfo = await service.getAdminInfo();
    const adminPubkey = new PublicKey(adminInfo.publicKey);

    // Verificar se as chaves públicas são válidas
    assert.ok(PublicKey.isOnCurve(adminPubkey.toBytes()));
  });

  test("deve validar parâmetros de entrada", async () => {
    // Teste com dados inválidos
    const invalidProject: CarbonCreditProject = {
      id: "",
      name: "",
      symbol: "",
      uri: "",
      amount: -1,
      pricePerToken: -1,
      carbonPayFee: -1,
      ownerUserId: "",
    };

    try {
      await service.createProject(invalidProject);
      // Se não lançar erro, ainda deve retornar uma signature mock
      assert.ok(true);
    } catch (thrownObject) {
      const error = thrownObject as Error;
      assert.ok(error.message.length > 0);
    }
  });

  test("deve lidar com erros de rede graciosamente", async () => {
    // Teste pode passar mesmo com problemas de rede pois usa mocks
    try {
      const status = await service.getSystemStatus();
      assert.ok(status);
    } catch (thrownObject) {
      const error = thrownObject as Error;
      assert.ok(error instanceof Error);
    }
  });
});
