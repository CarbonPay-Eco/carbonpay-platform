# Backend Web 2.5 - CarbonPay Platform

## Visão Geral

Este backend foi reestruturado para seguir o modelo **Web 2.5**, onde:

- ✅ **Backend assina todas as transações onchain**
- ✅ **Frontend só envia comandos/intents, nunca transações assinadas**
- ✅ **Autenticação via email/senha (JWT)**
- ✅ **Backend gerencia wallets Solana internamente**
- ✅ **Custódia centralizada de chaves privadas**
- ✅ **Auditoria completa de todas as ações**

## Endpoints Disponíveis

### 🔐 USER ROUTES

#### Autenticação
- `POST /api/user/login` - Login com email/senha
- `POST /api/user/register` - Registro com dados completos de onboarding

#### Operações
- `POST /api/user/add-balance` - Adicionar saldo à conta (placeholder para integração de pagamento)
- `POST /api/user/purchase-credits` - Comprar créditos de carbono com saldo da conta
- `POST /api/user/retire-emissions` - Realizar retirement de créditos para compensar emissões
- `GET /api/user/retirements` - Listar retirements do usuário
- `GET /api/user/retirements/:id` - Obter retirement específico por ID
- `GET /api/user/profile` - Obter perfil do usuário (nome e empresa)

### 👨‍💼 ADMIN ROUTES

#### Organizações
- `POST /api/admin/organizations` - Criar organização (admin)
- `GET /api/admin/organizations` - Listar todas organizações (admin)
- `PUT /api/admin/organizations/:id` - Atualizar organização (admin)

#### Projetos
- `POST /api/admin/projects` - Criar projeto de carbono (admin)
- `GET /api/admin/projects` - Listar todos projetos
- `GET /api/admin/projects/:id` - Obter projeto por ID

## Estrutura Técnica

### Controllers
- `UserController` - Operações de usuário (registro, saldo, compras, perfil)
- `AuthController` - Autenticação email/senha
- `OrganizationController` - Gestão de organizações
- `ProjectController` - Gestão de projetos de carbono
- `RetirementController` - Gestão de retirements

### Services
- `UserService` - Lógica de negócio para usuários
- `AuthService` - Autenticação JWT
- `OrganizationService` - Lógica de organizações
- `RetirementService` - Lógica de retirements
- `SolanaService` - Integração com blockchain Solana
- `WalletService` - Gestão interna de wallets
- `AuditLogService` - Logs de auditoria

### Entidades (Database)
- `User` - Usuários do sistema
- `Organization` - Dados de onboarding das empresas
- `TokenizedProject` - Projetos de créditos de carbono
- `Retirement` - Registros de retirement de emissões
- `Purchase` - Registros de compras de créditos
- `Wallet` - Wallets Solana gerenciadas pelo backend
- `AuditLog` - Logs de auditoria

## Fluxo Web 2.5

### 1. Registro de Usuário
```
Frontend -> POST /api/user/register
{
  email, password, fullName, companyName, country, ...
}

Backend:
- Cria usuário com hash da senha
- Gera wallet Solana automaticamente (custódia backend)
- Cria organização com dados de onboarding
- Retorna JWT token
```

### 2. Compra de Créditos
```
Frontend -> POST /api/user/purchase-credits
{ projectId, quantity }

Backend:
- Valida saldo do usuário
- Deduz valor do saldo
- Assina e envia transação onchain (mint)
- Atualiza disponibilidade do projeto
- Registra compra no banco
- Retorna txHash e dados da compra
```

### 3. Retirement de Emissões
```
Frontend -> POST /api/user/retire-emissions
{ projectId, quantity, beneficiary?, retirementMessage? }

Backend:
- Verifica se usuário possui créditos
- Assina e envia transação onchain (burn)
- Registra retirement no banco
- Retorna dados do retirement
```

## Segurança

### 🔒 Custódia de Chaves
- Chaves privadas das wallets são criptografadas com `WALLET_ENCRYPTION_KEY`
- Backend assina todas as transações internamente
- Frontend nunca tem acesso às chaves privadas

### 🛡️ Autenticação
- JWT com secret configurável (`JWT_SECRET`)
- Tokens expiram em 24h
- Middleware de autenticação em todas rotas protegidas

### 👑 Autorização Admin
- Verificação via `ADMIN_EMAILS` (env variable)
- Middleware de admin para operações sensíveis

### 📊 Auditoria
- Todas ações importantes são logadas
- Rastreabilidade completa de transações
- Logs incluem: usuário, ação, timestamp, dados relevantes

## Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Wallet Management
WALLET_ENCRYPTION_KEY=your-encryption-key

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=your-program-id

# Admin
ADMIN_EMAILS=admin1@company.com,admin2@company.com

# Payment Integration (placeholder)
STRIPE_SECRET_KEY=sk_...
TRANSAK_API_KEY=...
```

## TODO - Melhorias Futuras

### 💳 Integração de Pagamentos
- [ ] Integrar Stripe para `add-balance`
- [ ] Integrar Transak para compra direta de USDC
- [ ] Webhook handlers para confirmação de pagamentos

### 🔄 Sistema de Notificações
- [ ] WebSockets para status de transações em tempo real
- [ ] Email notifications para ações importantes
- [ ] Dashboard de status de transações

### 📈 Melhorias de Performance
- [ ] Cache Redis para consultas frequentes
- [ ] Background jobs para processamento de transações
- [ ] Rate limiting nos endpoints

### 🔐 Segurança Avançada
- [ ] HSM ou AWS KMS para custódia de chaves
- [ ] Multi-signature para operações críticas
- [ ] Backup e recovery de wallets

### 📊 Analytics
- [ ] Métricas de uso e performance
- [ ] Dashboard admin com estatísticas
- [ ] Relatórios de impacto ambiental

## Estrutura de Arquivos Limpa

### ✅ Mantidos
- `/controllers/` - Controllers necessários
- `/services/` - Services funcionais
- `/database/entities/` - Entidades do banco
- `/middlewares/` - Auth e validação
- `/utils/` - Utilitários
- `/config/` - Configurações

### ❌ Removidos
- `/routes/auth.ts` - Centralizado no index
- `/routes/wallet.ts` - Não exposto no Web 2.5
- `/routes/transak.ts` - Integrado no fluxo de saldo
- `/controllers/wallet.controller.ts` - Gerenciado internamente
- `/controllers/admin.controller.ts` - Funcionalidades distribuídas

A estrutura está agora limpa, funcional e seguindo os princípios Web 2.5 solicitados. 

## Visão Geral

Este backend foi reestruturado para seguir o modelo **Web 2.5**, onde:

- ✅ **Backend assina todas as transações onchain**
- ✅ **Frontend só envia comandos/intents, nunca transações assinadas**
- ✅ **Autenticação via email/senha (JWT)**
- ✅ **Backend gerencia wallets Solana internamente**
- ✅ **Custódia centralizada de chaves privadas**
- ✅ **Auditoria completa de todas as ações**

## Endpoints Disponíveis

### 🔐 USER ROUTES

#### Autenticação
- `POST /api/user/login` - Login com email/senha
- `POST /api/user/register` - Registro com dados completos de onboarding

#### Operações
- `POST /api/user/add-balance` - Adicionar saldo à conta (placeholder para integração de pagamento)
- `POST /api/user/purchase-credits` - Comprar créditos de carbono com saldo da conta
- `POST /api/user/retire-emissions` - Realizar retirement de créditos para compensar emissões
- `GET /api/user/retirements` - Listar retirements do usuário
- `GET /api/user/retirements/:id` - Obter retirement específico por ID
- `GET /api/user/profile` - Obter perfil do usuário (nome e empresa)

### 👨‍💼 ADMIN ROUTES

#### Organizações
- `POST /api/admin/organizations` - Criar organização (admin)
- `GET /api/admin/organizations` - Listar todas organizações (admin)
- `PUT /api/admin/organizations/:id` - Atualizar organização (admin)

#### Projetos
- `POST /api/admin/projects` - Criar projeto de carbono (admin)
- `GET /api/admin/projects` - Listar todos projetos
- `GET /api/admin/projects/:id` - Obter projeto por ID

## Estrutura Técnica

### Controllers
- `UserController` - Operações de usuário (registro, saldo, compras, perfil)
- `AuthController` - Autenticação email/senha
- `OrganizationController` - Gestão de organizações
- `ProjectController` - Gestão de projetos de carbono
- `RetirementController` - Gestão de retirements

### Services
- `UserService` - Lógica de negócio para usuários
- `AuthService` - Autenticação JWT
- `OrganizationService` - Lógica de organizações
- `RetirementService` - Lógica de retirements
- `SolanaService` - Integração com blockchain Solana
- `WalletService` - Gestão interna de wallets
- `AuditLogService` - Logs de auditoria

### Entidades (Database)
- `User` - Usuários do sistema
- `Organization` - Dados de onboarding das empresas
- `TokenizedProject` - Projetos de créditos de carbono
- `Retirement` - Registros de retirement de emissões
- `Purchase` - Registros de compras de créditos
- `Wallet` - Wallets Solana gerenciadas pelo backend
- `AuditLog` - Logs de auditoria

## Fluxo Web 2.5

### 1. Registro de Usuário
```
Frontend -> POST /api/user/register
{
  email, password, fullName, companyName, country, ...
}

Backend:
- Cria usuário com hash da senha
- Gera wallet Solana automaticamente (custódia backend)
- Cria organização com dados de onboarding
- Retorna JWT token
```

### 2. Compra de Créditos
```
Frontend -> POST /api/user/purchase-credits
{ projectId, quantity }

Backend:
- Valida saldo do usuário
- Deduz valor do saldo
- Assina e envia transação onchain (mint)
- Atualiza disponibilidade do projeto
- Registra compra no banco
- Retorna txHash e dados da compra
```

### 3. Retirement de Emissões
```
Frontend -> POST /api/user/retire-emissions
{ projectId, quantity, beneficiary?, retirementMessage? }

Backend:
- Verifica se usuário possui créditos
- Assina e envia transação onchain (burn)
- Registra retirement no banco
- Retorna dados do retirement
```

## Segurança

### 🔒 Custódia de Chaves
- Chaves privadas das wallets são criptografadas com `WALLET_ENCRYPTION_KEY`
- Backend assina todas as transações internamente
- Frontend nunca tem acesso às chaves privadas

### 🛡️ Autenticação
- JWT com secret configurável (`JWT_SECRET`)
- Tokens expiram em 24h
- Middleware de autenticação em todas rotas protegidas

### 👑 Autorização Admin
- Verificação via `ADMIN_EMAILS` (env variable)
- Middleware de admin para operações sensíveis

### 📊 Auditoria
- Todas ações importantes são logadas
- Rastreabilidade completa de transações
- Logs incluem: usuário, ação, timestamp, dados relevantes

## Variáveis de Ambiente

```env
# Database
DATABASE_URL=postgresql://...

# JWT
JWT_SECRET=your-secret-key

# Wallet Management
WALLET_ENCRYPTION_KEY=your-encryption-key

# Solana
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
SOLANA_PROGRAM_ID=your-program-id

# Admin
ADMIN_EMAILS=admin1@company.com,admin2@company.com

# Payment Integration (placeholder)
STRIPE_SECRET_KEY=sk_...
TRANSAK_API_KEY=...
```

## TODO - Melhorias Futuras

### 💳 Integração de Pagamentos
- [ ] Integrar Stripe para `add-balance`
- [ ] Integrar Transak para compra direta de USDC
- [ ] Webhook handlers para confirmação de pagamentos

### 🔄 Sistema de Notificações
- [ ] WebSockets para status de transações em tempo real
- [ ] Email notifications para ações importantes
- [ ] Dashboard de status de transações

### 📈 Melhorias de Performance
- [ ] Cache Redis para consultas frequentes
- [ ] Background jobs para processamento de transações
- [ ] Rate limiting nos endpoints

### 🔐 Segurança Avançada
- [ ] HSM ou AWS KMS para custódia de chaves
- [ ] Multi-signature para operações críticas
- [ ] Backup e recovery de wallets

### 📊 Analytics
- [ ] Métricas de uso e performance
- [ ] Dashboard admin com estatísticas
- [ ] Relatórios de impacto ambiental

## Estrutura de Arquivos Limpa

### ✅ Mantidos
- `/controllers/` - Controllers necessários
- `/services/` - Services funcionais
- `/database/entities/` - Entidades do banco
- `/middlewares/` - Auth e validação
- `/utils/` - Utilitários
- `/config/` - Configurações

### ❌ Removidos
- `/routes/auth.ts` - Centralizado no index
- `/routes/wallet.ts` - Não exposto no Web 2.5
- `/routes/transak.ts` - Integrado no fluxo de saldo
- `/controllers/wallet.controller.ts` - Gerenciado internamente
- `/controllers/admin.controller.ts` - Funcionalidades distribuídas

A estrutura está agora limpa, funcional e seguindo os princípios Web 2.5 solicitados. 