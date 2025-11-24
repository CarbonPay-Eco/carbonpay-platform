# CarbonPay - Quick Start Guide

## 🚀 Setup Rápido (5 minutos)

### 1. Instalar Dependências

```bash
# Backend
cd app/backend
npm install

# Instalar Solana CLI
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"

# Instalar Anchor (para deploy do programa)
cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
avm install latest
avm use latest
```

### 2. Executar Script de Setup

```bash
# Voltar para raiz do projeto
cd ../..

# Executar script automatizado
./scripts/setup-solana.sh
```

O script irá:
- ✅ Configurar Solana CLI
- ✅ Gerar carteira do servidor
- ✅ Fazer airdrop de SOL (devnet/localnet)
- ✅ Deploy do programa (opcional)
- ✅ Criar arquivo `.env.solana` com configurações

### 3. Adicionar Configurações ao .env

```bash
# Copiar configurações Solana para o .env
cat app/backend/.env.solana >> app/backend/.env

# Ou editar manualmente app/backend/.env e adicionar:
# SOLANA_NETWORK=localnet
# SOLANA_PROGRAM_ID=bGiephq1pZ8kxJVumdgCMEa2BjCEJuviCSwHgL9rdfg
# SOLANA_RPC_URL=http://127.0.0.1:8899
# SOLANA_SERVER_PRIVATE_KEY=<sua_chave_privada_base58>
# SOLANA_USDC_MINT=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v
```

### 4. Iniciar Validador Local (se usando localnet)

```bash
# Em um terminal separado
solana-test-validator
```

### 5. Iniciar Backend

```bash
cd app/backend
npm run dev
```

## 📋 Teste os Fluxos

### 1. Registrar Usuário

```bash
curl -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123"
  }'
```

Guarde o `token` retornado.

### 2. Fazer Login

```bash
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "senha123"
  }'
```

### 3. Criar Projeto (Admin)

Primeiro, você precisa criar um usuário admin ou usar o endpoint sem autenticação para teste:

```bash
curl -X POST http://localhost:3000/admin/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token_admin>" \
  -d '{
    "projectName": "Amazon Reforestation Project",
    "location": "Amazon Rainforest, Brazil",
    "description": "Large-scale reforestation project",
    "certificationBody": "VCS",
    "standard": "VCS",
    "vintageYear": 2024,
    "totalIssued": 10000,
    "pricePerTon": 25,
    "ipfsHash": "https://ipfs.io/ipfs/QmExample",
    "tags": ["reforestation", "amazon", "vcs"]
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-projeto",
    "tokenId": "7sJ4...",
    "projectName": "Amazon Reforestation Project",
    "onChainData": {
      "projectPda": "8xK3...",
      "nftMint": "7sJ4...",
      "tokenMint": "9yL5..."
    },
    "onChainMintTx": "project_init_tx_1234567890_7sJ4Ab"
  }
}
```

### 4. Listar Projetos Disponíveis

```bash
curl http://localhost:3000/projects
```

### 5. Comprar Créditos

```bash
curl -X POST http://localhost:3000/user/purchase-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token>" \
  -d '{
    "projectId": "<id_do_projeto>",
    "quantity": 10
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "purchaseId": "uuid-da-compra",
    "projectId": "uuid-do-projeto",
    "quantity": 10,
    "totalCost": 250,
    "txHash": "purchase_tx_1234567890_9yL5Cd",
    "remainingBalance": 750
  }
}
```

### 6. Retirar (Offset) Créditos

```bash
curl -X POST http://localhost:3000/user/retire-emissions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token>" \
  -d '{
    "projectId": "<id_do_projeto>",
    "quantity": 5,
    "beneficiary": "My Company",
    "retirementMessage": "Offsetting 2024 Q1 emissions"
  }'
```

**Resposta:**
```json
{
  "success": true,
  "data": {
    "id": "uuid-do-retirement",
    "quantity": 5,
    "txHash": "offset_tx_1234567890_OFFSET123",
    "publicHash": "abc123def456...",
    "certificateUrl": "/certificate/uuid-do-retirement.pdf"
  }
}
```

### 7. Verificar Certificado

```bash
# HTML
curl http://localhost:3000/certificate/<id_do_retirement>.html

# PDF
curl http://localhost:3000/certificate/<id_do_retirement>.pdf --output certificate.pdf
```

## 🔍 Verificar Transações On-Chain

### Localnet

```bash
solana confirm -v <transaction_hash> --url localhost
```

### Devnet

Acesse: https://explorer.solana.com/?cluster=devnet

Cole o hash da transação retornado pela API.

## 📊 Monitorar Carteira do Servidor

```bash
# Ver saldo
solana balance <public_key> --url localhost

# Ver histórico de transações
solana transaction-history <public_key> --url localhost
```

## ⚠️ Troubleshooting Comum

### "Connection refused" ao chamar API

- Verifique se o backend está rodando: `npm run dev`
- Verifique a porta no `.env`: `PORT=3000`

### "Insufficient SOL balance"

```bash
# Fazer airdrop (localnet/devnet apenas)
solana airdrop 10 <server_public_key> --url localhost
```

### "Project on-chain data not found"

- Projeto foi criado antes da integração
- Recrie o projeto ou execute script de migração

### "Transaction simulation failed"

- Validador local não está rodando (localnet)
- RPC URL incorreta no `.env`
- Programa não foi deployed

## 🔐 Segurança

### Para Desenvolvimento

- ✅ Use localnet ou devnet
- ✅ Não comite arquivo `.env`
- ✅ Use chaves de teste apenas

### Para Produção

- ⚠️ Use hardware wallet ou KMS
- ⚠️ Ative 2FA em todos os acessos
- ⚠️ Faça backup da chave privada
- ⚠️ Use HTTPS para todas as APIs
- ⚠️ Implemente rate limiting
- ⚠️ Monitore todas as transações

## 📚 Documentação Completa

Para informações detalhadas, consulte:

- [SOLANA_INTEGRATION.md](./SOLANA_INTEGRATION.md) - Documentação completa da integração
- [Anchor Book](https://book.anchor-lang.com/) - Documentação do Anchor
- [Solana Cookbook](https://solanacookbook.com/) - Receitas Solana

## 🆘 Suporte

### Logs

```bash
# Ver logs do backend
cd app/backend
npm run dev

# Ver logs do validador
# (em outro terminal onde solana-test-validator está rodando)
```

### Arquivos Importantes

- `app/backend/src/services/solana-onchain.service.ts` - Serviço principal de integração
- `programs/carbon_pay/src/lib.rs` - Programa Solana
- `SOLANA_INTEGRATION.md` - Documentação detalhada

## ✅ Checklist de Setup

- [ ] Solana CLI instalado
- [ ] Anchor CLI instalado
- [ ] Carteira do servidor gerada
- [ ] Validador local rodando (se localnet)
- [ ] Programa deployed
- [ ] `.env` configurado
- [ ] Backend rodando
- [ ] Primeiro projeto criado com sucesso
- [ ] Primeira compra realizada com sucesso
- [ ] Primeiro offset realizado com sucesso

## 🎯 Próximos Passos

1. **Implementar Anchor IDL**: Substituir mocks por chamadas reais
2. **Testes Automatizados**: Adicionar testes e2e
3. **Frontend Integration**: Conectar frontend às APIs
4. **Monitoring**: Setup de métricas e alertas
5. **Production Deploy**: Deploy em produção com segurança

---

**Dica**: Para desenvolvimento rápido, use o Postman ou Insomnia para testar as APIs. Importe a collection disponível em `docs/postman-collection.json` (se existir).
