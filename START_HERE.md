# 🚀 CarbonPay - Guia de Início Rápido

## ✅ Setup Completo - PostgreSQL + Docker

### 1️⃣ Iniciar PostgreSQL

```bash
# Na raiz do projeto
docker-compose up -d postgres
```

✅ **Pronto!** PostgreSQL está rodando na porta `5432`

### 2️⃣ Verificar PostgreSQL

```bash
# Ver status
docker-compose ps

# Ver logs
docker-compose logs -f postgres
```

Você deve ver:
```
NAME                 STATUS
carbonpay-postgres   Up (healthy)
```

### 3️⃣ Iniciar Backend

```bash
cd app/backend
npm run dev
```

O backend irá:
- ✅ Conectar ao PostgreSQL automaticamente
- ✅ Criar todas as tabelas necessárias
- ✅ Iniciar na porta `3000`

### 4️⃣ Testar a API

```bash
# Health check
curl http://localhost:3000/health
```

Resposta esperada:
```json
{
  "status": "OK",
  "timestamp": "2024-11-24T..."
}
```

## 🗄️ Acessar o Banco de Dados

### Opção 1: Via Docker (Terminal)

```bash
docker-compose exec postgres psql -U carbonpay -d carbonpay
```

Comandos úteis:
```sql
\dt              -- Listar tabelas
\d user          -- Ver estrutura da tabela user
SELECT * FROM "user";  -- Consultar dados
\q               -- Sair
```

### Opção 2: Via pgAdmin (Interface Gráfica)

```bash
# Iniciar pgAdmin
docker-compose --profile tools up -d pgadmin

# Acessar: http://localhost:5050
# Email: admin@carbonpay.com
# Senha: admin
```

### Opção 3: Cliente SQL Externo

Use qualquer cliente (DBeaver, DataGrip, TablePlus):
```
Host: localhost
Port: 5432
Database: carbonpay
Username: carbonpay
Password: carbonpay
```

## 🧪 Testar Integração Solana

### 1. Configurar Solana

Você precisa configurar a chave privada do servidor:

```bash
# Executar script de setup
./scripts/setup-solana.sh
```

O script irá:
- Instalar Solana CLI
- Gerar carteira do servidor
- Fazer airdrop de SOL (devnet/localnet)
- Configurar variáveis de ambiente

### 2. Copiar Configurações

```bash
# Copiar configurações Solana para o .env
cat app/backend/.env.solana >> app/backend/.env
```

### 3. Testar Fluxo Completo

```bash
# 1. Registrar usuário
curl -X POST http://localhost:3000/user/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@carbonpay.com",
    "password": "senha123"
  }'

# 2. Login (guarde o token)
curl -X POST http://localhost:3000/user/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "teste@carbonpay.com",
    "password": "senha123"
  }'

# 3. Criar projeto (admin)
curl -X POST http://localhost:3000/admin/projects \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <seu_token>" \
  -d '{
    "projectName": "Amazon Reforestation",
    "location": "Brazil",
    "totalIssued": 10000,
    "pricePerTon": 25,
    "standard": "VCS",
    "vintageYear": 2024
  }'
```

## 📊 Ver Dados no Banco

```bash
# Listar projetos
docker-compose exec postgres psql -U carbonpay -d carbonpay -c "SELECT * FROM tokenized_project;"

# Listar usuários
docker-compose exec postgres psql -U carbonpay -d carbonpay -c "SELECT id, email, role FROM \"user\";"

# Listar compras
docker-compose exec postgres psql -U carbonpay -d carbonpay -c "SELECT * FROM purchase;"
```

## 🛑 Parar Tudo

```bash
# Parar PostgreSQL (mantém dados)
docker-compose stop postgres

# Parar backend
# Ctrl+C no terminal onde está rodando

# Parar e remover tudo (CUIDADO: apaga dados!)
docker-compose down -v
```

## 🔄 Resetar Banco de Dados

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U carbonpay -d postgres

# Resetar banco
DROP DATABASE carbonpay;
CREATE DATABASE carbonpay;
\q

# Reiniciar backend para recriar tabelas
cd app/backend && npm run dev
```

## 📁 Estrutura do Projeto

```
carbonpay-platform/
├── docker-compose.yml          # Config PostgreSQL
├── app/backend/
│   ├── src/
│   │   ├── services/
│   │   │   └── solana-onchain.service.ts  # Integração Solana
│   │   └── database/
│   │       └── data-source.ts              # Config TypeORM
│   ├── .env                                # Configurações
│   └── carbonpay.sqlite                    # (não usado, PostgreSQL ativo)
├── programs/carbon_pay/        # Programa Solana
└── scripts/
    └── setup-solana.sh         # Setup automatizado
```

## 📚 Documentação Completa

- **[DOCKER_SETUP.md](./DOCKER_SETUP.md)** - Detalhes do Docker/PostgreSQL
- **[QUICK_START.md](./QUICK_START.md)** - Guia completo de uso
- **[SOLANA_INTEGRATION.md](./SOLANA_INTEGRATION.md)** - Integração Solana
- **[INTEGRATION_SUMMARY.md](./INTEGRATION_SUMMARY.md)** - Resumo técnico

## 🆘 Problemas Comuns

### PostgreSQL não inicia

```bash
# Ver logs
docker-compose logs postgres

# Verificar se porta 5432 está livre
lsof -i :5432

# Se ocupada, mudar porta no docker-compose.yml
```

### Backend não conecta

```bash
# Verificar .env
cat app/backend/.env | grep DB_

# Deve ter:
USE_LOCAL_DB=false
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=carbonpay
DB_PASSWORD=carbonpay
DB_DATABASE=carbonpay
```

### Tabelas não foram criadas

```bash
# Ver logs do backend
cd app/backend && npm run dev

# Procurar por:
# "query: CREATE TABLE..."
```

## ✅ Checklist

- [ ] Docker está instalado e rodando
- [ ] PostgreSQL iniciado (`docker-compose up -d postgres`)
- [ ] Container rodando (`docker-compose ps`)
- [ ] `.env` configurado (`USE_LOCAL_DB=false`)
- [ ] Backend conectou com sucesso
- [ ] Tabelas criadas automaticamente
- [ ] API respondendo (`curl http://localhost:3000/health`)

## 🎯 Próximos Passos

1. **Configurar Solana**: Execute `./scripts/setup-solana.sh`
2. **Criar Primeiro Projeto**: Use a API admin
3. **Testar Compra**: Simule uma compra de créditos
4. **Testar Offset**: Faça um retirement

---

**Tudo configurado!** 🎉

Agora você tem:
- ✅ PostgreSQL rodando no Docker
- ✅ Backend conectado e pronto
- ✅ Integração Solana implementada
- ✅ Arquitetura Web2.5 funcionando

**Para dúvidas**, consulte a documentação completa ou abra uma issue.
