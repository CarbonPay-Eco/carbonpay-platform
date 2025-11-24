# CarbonPay - Integração Solana On-Chain

## Visão Geral

Este documento descreve a integração completa do backend CarbonPay com o programa Solana on-chain, implementando uma arquitetura **Web2.5** onde os usuários interagem usando login/senha tradicional enquanto todas as transações são executadas on-chain.

## Arquitetura Web2.5

### Conceito

Na arquitetura Web2.5 do CarbonPay:

1. **Usuários** fazem login com email e senha (Web2)
2. **Backend** gerencia uma carteira servidor que assina todas as transações
3. **Transações** são executadas on-chain na Solana (Web3)
4. **Usuários** não precisam gerenciar carteiras ou assinar transações

### Benefícios

- ✅ **UX Simplificada**: Login/senha familiar ao invés de gerenciar seed phrases
- ✅ **Sem Gas Fees para Usuários**: Servidor paga todas as taxas de transação
- ✅ **Transparência Blockchain**: Todas as operações são verificáveis on-chain
- ✅ **Segurança**: Programa on-chain garante regras de negócio imutáveis

## Estrutura de Arquivos

```
app/backend/src/
├── services/
│   ├── solana-onchain.service.ts   # Novo serviço de integração on-chain
│   ├── solana.service.ts            # Serviço legado (manter para compatibilidade)
│   ├── project.service.ts           # Atualizado com integração on-chain
│   ├── user.service.ts              # Atualizado com compra on-chain
│   └── retirement.service.ts        # Atualizado com offset on-chain
├── config/
│   └── constants.ts                 # Atualizado com novas variáveis Solana
└── .env.example                     # Exemplo de configuração

programs/carbon_pay/src/              # Programa Solana (Anchor)
├── lib.rs                           # Entry point do programa
├── instructions/
│   ├── initialize_carbon_credits.rs # Inicializar PDA principal
│   ├── initialize_project.rs        # Criar projeto on-chain
│   ├── purchase_carbon_credits.rs   # Comprar créditos com USDC
│   └── request_offset.rs            # Solicitar offset (retirement)
└── state/
    ├── carbon_credits.rs            # Estado global da plataforma
    ├── project.rs                   # Estado de cada projeto
    ├── purchase.rs                  # Estado de cada compra
    └── offset_request.rs            # Estado de cada offset
```

## Configuração

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env`:

```bash
# Solana Configuration
SOLANA_NETWORK=localnet                                              # localnet, devnet ou mainnet
SOLANA_PROGRAM_ID=bGiephq1pZ8kxJVumdgCMEa2BjCEJuviCSwHgL9rdfg      # ID do programa CarbonPay
SOLANA_RPC_URL=http://127.0.0.1:8899                                # URL do RPC Solana
SOLANA_SERVER_PRIVATE_KEY=<sua_chave_privada_base58>               # Chave privada da carteira servidor
SOLANA_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v        # Mint do USDC
```

### 2. Gerar Carteira do Servidor

A carteira do servidor é a chave que assina todas as transações. Para gerar:

```bash
# Instalar Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Gerar nova carteira
solana-keygen new --outfile ~/.config/solana/carbonpay-server.json

# Ver a chave pública
solana-keygen pubkey ~/.config/solana/carbonpay-server.json

# Converter para base58 (para usar no .env)
cat ~/.config/solana/carbonpay-server.json | jq -r '.[0:32] | @base64'
```

**⚠️ IMPORTANTE**: Guarde esta chave privada em um lugar seguro! Ela controla todos os fundos da plataforma.

### 3. Financiar a Carteira do Servidor

A carteira precisa de SOL para pagar taxas de transação:

#### Localnet (desenvolvimento)
```bash
solana airdrop 10 <public_key> --url localhost
```

#### Devnet (teste)
```bash
solana airdrop 2 <public_key> --url devnet
```

#### Mainnet (produção)
Você precisará comprar SOL e transferir para a carteira.

### 4. Deploy do Programa Solana

```bash
# No diretório raiz do projeto
anchor build
anchor deploy --provider.cluster localnet

# O programa ID será exibido - copie para SOLANA_PROGRAM_ID
```

### 5. Inicializar o CarbonCredits PDA

O PDA (Program Derived Address) principal precisa ser inicializado uma vez:

```typescript
// Você pode criar um script de setup ou fazer via API admin
import { SolanaOnchainService } from './services/solana-onchain.service';
import { PublicKey } from '@solana/web3.js';

const service = new SolanaOnchainService();
const usdcMint = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

await service.initializeCarbonCredits(usdcMint);
```

## Fluxos Principais

### 1. Criar Projeto (Initialize Project)

**Endpoint**: `POST /admin/projects`

**Fluxo**:
1. Admin envia dados do projeto via API
2. Backend valida permissões
3. `SolanaOnchainService.initializeProject()` é chamado
4. Servidor assina transação que:
   - Cria NFT mint para o projeto
   - Cria token mint para créditos fungíveis
   - Minta tokens para o vault da plataforma
   - Cria metadata do NFT com Metaplex
   - Registra projeto no PDA
5. Dados on-chain são salvos no banco de dados

**Dados armazenados on-chain**:
```rust
pub struct Project {
    pub owner: Pubkey,           // Carteira do servidor
    pub mint: Pubkey,            // NFT mint do projeto
    pub token_mint: Pubkey,      // Token mint dos créditos
    pub amount: u64,             // Quantidade total de créditos
    pub remaining_amount: u64,   // Créditos disponíveis
    pub offset_amount: u64,      // Créditos já offsetados
    pub price_per_token: u64,    // Preço em micro-USDC
    pub carbon_pay_fee: u64,     // Taxa da plataforma (basis points)
    pub is_active: bool,         // Projeto ativo
}
```

**Exemplo de resposta**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "tokenId": "7sJ4...",
    "projectName": "Amazon Reforestation",
    "onChainData": {
      "projectPda": "8xK3...",
      "nftMint": "7sJ4...",
      "tokenMint": "9yL5..."
    },
    "onChainMintTx": "project_init_tx_..."
  }
}
```

### 2. Comprar Créditos (Purchase Carbon Credits)

**Endpoint**: `POST /user/purchase-credits`

**Fluxo**:
1. Usuário autenticado envia `projectId` e `quantity`
2. Backend valida disponibilidade
3. `SolanaOnchainService.purchaseCarbonCredits()` é chamado
4. Servidor assina transação que:
   - Transfere USDC do comprador para dono do projeto
   - Transfere taxa em USDC para vault da plataforma
   - Minta NFT de compra para o usuário
   - Transfere tokens fungíveis do vault para o usuário
   - Registra compra no PDA
5. Dados são salvos no banco de dados

**Dados armazenados on-chain**:
```rust
pub struct Purchase {
    pub buyer: Pubkey,           // Carteira do comprador
    pub project: Pubkey,         // PDA do projeto
    pub amount: u64,             // Quantidade comprada
    pub remaining_amount: u64,   // Quantidade ainda não offsetada
    pub purchase_date: i64,      // Timestamp da compra
    pub nft_mint: Pubkey,        // NFT mint da compra
}
```

**Exemplo de resposta**:
```json
{
  "success": true,
  "data": {
    "purchaseId": "uuid",
    "projectId": "uuid",
    "quantity": 10,
    "totalCost": 100,
    "txHash": "purchase_tx_...",
    "remainingBalance": 900
  }
}
```

### 3. Offset (Retirement)

**Endpoint**: `POST /user/retire-emissions`

**Fluxo**:
1. Usuário autenticado envia `projectId`, `quantity` e dados opcionais
2. Backend busca compra anterior para obter dados on-chain
3. `SolanaOnchainService.requestOffset()` é chamado
4. Servidor assina transação que:
   - Queima (burn) NFT original da compra
   - Queima tokens fungíveis sendo offsetados
   - Minta novo NFT com créditos restantes (se parcial)
   - Registra offset request no PDA
   - Incrementa contador de offsets no projeto
5. Retirement é registrado no banco com hash público

**Dados armazenados on-chain**:
```rust
pub struct OffsetRequest {
    pub offset_requester: Pubkey, // Quem solicitou offset
    pub purchase: Pubkey,         // PDA da compra
    pub project: Pubkey,          // PDA do projeto
    pub amount: u64,              // Quantidade offsetada
    pub request_id: String,       // ID único do request
    pub status: RequestStatus,    // Pending/Approved/Rejected
    pub request_date: i64,        // Data do request
    pub processed_date: i64,      // Data do processamento
}
```

**Exemplo de resposta**:
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "quantity": 5,
    "txHash": "offset_tx_...",
    "publicHash": "abc123...",
    "certificateUrl": "/certificate/uuid.pdf"
  }
}
```

## Estrutura de Dados

### Banco de Dados (PostgreSQL)

#### TokenizedProject
```typescript
{
  id: string;
  tokenId: string;              // NFT mint do projeto
  projectName: string;
  totalIssued: number;
  available: number;
  pricePerTon: number;
  onChainMintTx: string;        // Hash da transação de criação
  onChainData: {                // Dados on-chain
    projectPda: string;
    nftMint: string;
    tokenMint: string;
  };
  // ... outros campos
}
```

#### Purchase
```typescript
{
  id: string;
  userId: string;
  projectId: string;
  quantity: number;
  totalCost: number;
  txHash: string;               // Hash da transação on-chain
  status: 'pending' | 'completed' | 'failed';
  metadata: {                   // Dados on-chain
    purchasePda: string;
    purchaseNftMint: string;
    onChainTxHash: string;
  };
  // ... outros campos
}
```

#### Retirement
```typescript
{
  id: string;
  walletId: string;
  tokenizedProjectId: string;
  quantity: number;
  txHash: string;               // Hash da transação on-chain
  publicHash: string;           // Hash público para verificação
  metadata: {                   // Dados on-chain
    offsetRequestPda: string;
    newNftMint: string | null;
    requestId: string;
    onChainTxHash: string;
    beneficiary?: string;
    retirementMessage?: string;
  };
  // ... outros campos
}
```

### On-Chain (Solana)

#### CarbonCredits PDA
```rust
#[account]
pub struct CarbonCredits {
    pub bump: u8,
    pub total_credits: u64,      // Total de créditos na plataforma
    pub offset_credits: u64,     // Total de créditos offsetados
    pub usdc_mint: Pubkey,       // USDC mint para pagamentos
    pub usdc_decimals: u8,       // Decimais do USDC (6)
    pub usdc_vault: Pubkey,      // Vault de taxas em USDC
}
```

Seeds: `["carbon_credits"]`

## Segurança

### 1. Gestão de Chaves

- ✅ Chave privada do servidor armazenada em variável de ambiente
- ✅ Nunca expor a chave no código ou logs
- ✅ Usar KMS (Key Management Service) em produção
- ✅ Rotação periódica de chaves (planejar migração)

### 2. Validações On-Chain

O programa Solana valida:
- ✅ Propriedade de contas (ownership)
- ✅ Saldos suficientes antes de transferências
- ✅ Autoridade de assinatura correta
- ✅ PDAs derivados corretamente
- ✅ Overflow/underflow aritmético

### 3. Validações Backend

- ✅ Autenticação JWT antes de operações
- ✅ Autorização baseada em roles (admin/user)
- ✅ Validação de disponibilidade de créditos
- ✅ Rate limiting nas APIs
- ✅ Sanitização de inputs

## Monitoramento

### Logs Importantes

O sistema loga:
- ✅ Inicialização da carteira servidor
- ✅ Cada transação on-chain com hash
- ✅ Erros de transação com detalhes
- ✅ Mudanças de estado (available, offset_amount)

### Métricas

Monitore:
- ✅ Balance SOL da carteira servidor
- ✅ Taxa de sucesso de transações
- ✅ Tempo de confirmação de transações
- ✅ Erros de RPC/timeout

### Audit Logs

Todos os eventos são registrados em `audit_logs`:
- `PROJECT_CREATE`
- `CREDITS_PURCHASE`
- `CREDIT_RETIRE`

## Troubleshooting

### Erro: "SOLANA_SERVER_PRIVATE_KEY is not set"

**Causa**: Variável de ambiente não configurada

**Solução**:
```bash
# Gere uma chave ou use existente
solana-keygen new --outfile server-key.json

# Extraia a chave base58
cat server-key.json | node -e "console.log(require('bs58').encode(Buffer.from(JSON.parse(require('fs').readFileSync(0, 'utf-8')))))"

# Adicione ao .env
SOLANA_SERVER_PRIVATE_KEY=<chave_base58>
```

### Erro: "Insufficient SOL balance"

**Causa**: Carteira servidor sem SOL para taxas

**Solução**:
```bash
# Localnet
solana airdrop 10 <public_key> --url localhost

# Devnet
solana airdrop 2 <public_key> --url devnet

# Mainnet - transferir SOL manualmente
```

### Erro: "Project on-chain data not found"

**Causa**: Projeto criado antes da integração ou falha na criação

**Solução**:
1. Verifique se `onChainData` existe no projeto
2. Se não, recrie o projeto via API
3. Ou migre projetos existentes executando `initializeProject` para cada um

### Erro: "Purchase on-chain data not found"

**Causa**: Compra feita antes da integração

**Solução**:
1. Usuário precisa fazer nova compra
2. Ou implementar script de migração para criar PDAs retroativos

## Migração de Dados Existentes

Se você já tem projetos/compras no banco sem dados on-chain:

### 1. Script de Migração de Projetos

```typescript
// scripts/migrate-projects.ts
import { SolanaOnchainService } from '../src/services/solana-onchain.service';
import { AppDataSource } from '../src/database/data-source';
import { TokenizedProject } from '../src/database/entities/TokenizedProject';

async function migrateProjects() {
  const solana = new SolanaOnchainService();
  const repo = AppDataSource.getRepository(TokenizedProject);

  const projects = await repo.find({
    where: { onChainData: null }
  });

  for (const project of projects) {
    console.log(`Migrating project ${project.id}...`);

    const result = await solana.initializeProject({
      projectName: project.projectName,
      projectSymbol: project.standard || 'CRBN',
      projectUri: project.ipfsHash || `https://carbonpay.com/metadata/${project.id}`,
      amount: project.totalIssued,
      pricePerToken: Math.floor(project.pricePerTon * 1_000_000),
      carbonPayFee: 500,
    });

    project.onChainData = {
      projectPda: result.projectPda,
      nftMint: result.nftMint,
      tokenMint: result.tokenMint,
    } as any;

    project.onChainMintTx = result.txHash;
    await repo.save(project);

    console.log(`✅ Migrated project ${project.id}`);
  }
}

migrateProjects().catch(console.error);
```

## Próximos Passos

### Funcionalidades Futuras

1. **Anchor IDL Integration**: Substituir mocks por chamadas reais ao programa
2. **Multi-signature**: Requer múltiplas assinaturas para operações críticas
3. **Custodial Wallets**: Criar sub-wallets para cada usuário
4. **Direct Wallet Connection**: Permitir usuários conectarem suas próprias wallets
5. **Programa de Verificação**: Processar offset requests on-chain
6. **Governance**: DAO para decisões da plataforma

### Melhorias de Performance

1. **Transaction Batching**: Agrupar transações similares
2. **Parallel Transactions**: Executar transações independentes em paralelo
3. **RPC Caching**: Cache de consultas frequentes
4. **Websockets**: Updates em tempo real de transações

### Compliance e Auditoria

1. **Transaction Explorer**: Interface para visualizar todas as transações
2. **Automated Reports**: Relatórios regulatórios automáticos
3. **External Audit**: Audit de segurança do programa Solana
4. **Insurance**: Seguros para fundos gerenciados

## Suporte

Para dúvidas ou problemas:

1. Verifique este documento primeiro
2. Consulte os logs do servidor
3. Verifique transações no Solana Explorer
4. Abra uma issue no repositório

## Licença

MIT License - CarbonPay Platform
