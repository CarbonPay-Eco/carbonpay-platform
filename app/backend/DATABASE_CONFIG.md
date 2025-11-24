# Configuração de Banco de Dados - CarbonPay Backend

## 🗄️ Banco de Dados Local (SQLite) - PADRÃO

Por padrão, o backend está configurado para usar **SQLite**, um banco de dados local em arquivo que não requer instalação ou configuração adicional.

### Vantagens do SQLite para Desenvolvimento

- ✅ **Zero configuração**: Não precisa instalar PostgreSQL ou Docker
- ✅ **Portabilidade**: Banco de dados em um único arquivo
- ✅ **Simplicidade**: Perfeito para desenvolvimento local
- ✅ **Compatibilidade**: TypeORM suporta totalmente

### Configuração Atual

No arquivo [.env](app/backend/.env):

```bash
USE_LOCAL_DB=true
NODE_ENV=development
```

### Localização do Banco de Dados

O arquivo SQLite é criado em:
```
app/backend/carbonpay.sqlite
```

### Como Visualizar os Dados

#### Opção 1: SQLite Browser (Recomendado)

1. Baixe o [DB Browser for SQLite](https://sqlitebrowser.org/)
2. Abra o arquivo `app/backend/carbonpay.sqlite`
3. Navegue pelas tabelas e dados

#### Opção 2: CLI do SQLite

```bash
cd app/backend
sqlite3 carbonpay.sqlite

# Comandos úteis:
.tables              # Listar tabelas
.schema user         # Ver estrutura da tabela user
SELECT * FROM user;  # Consultar dados
.quit                # Sair
```

#### Opção 3: VSCode Extension

Instale a extensão "SQLite Viewer" no VSCode e clique no arquivo `.sqlite`.

## 🐘 PostgreSQL (Remoto/Docker) - OPCIONAL

Se você preferir usar PostgreSQL (para produção ou ambiente similar):

### 1. Configurar no .env

```bash
USE_LOCAL_DB=false
NODE_ENV=development

# PostgreSQL Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=sua_senha
DB_DATABASE=carbonpay
```

### 2. Iniciar PostgreSQL

#### Opção A: Docker (Recomendado)

```bash
docker run --name carbonpay-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=carbonpay \
  -p 5432:5432 \
  -d postgres:15
```

#### Opção B: Instalação Local

**macOS:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb carbonpay
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb carbonpay
```

**Windows:**
Baixe o instalador em: https://www.postgresql.org/download/windows/

## 🔄 Trocar entre SQLite e PostgreSQL

### Usar SQLite (Local)

```bash
# No arquivo .env
USE_LOCAL_DB=true
```

Reinicie o servidor:
```bash
npm run dev
```

### Usar PostgreSQL

```bash
# No arquivo .env
USE_LOCAL_DB=false
```

Certifique-se de que o PostgreSQL está rodando e reinicie o servidor.

## 📊 Estrutura do Banco de Dados

O TypeORM cria automaticamente as seguintes tabelas:

```
user                    - Usuários da plataforma
user_wallet            - Carteiras Solana dos usuários
wallet                 - Carteiras organizacionais
organization           - Dados das organizações
tokenized_project      - Projetos de créditos de carbono
purchase               - Compras de créditos
retirement             - Offsets (retirements) de créditos
audit_log              - Log de auditoria
```

### Diagrama de Relacionamentos

```
User 1:1 UserWallet
Organization 1:1 Wallet
Wallet 1:N Retirement
Wallet 1:N AuditLog
TokenizedProject 1:N Purchase
TokenizedProject 1:N Retirement
User 1:N Purchase
```

## 🔧 Comandos Úteis

### Resetar Banco de Dados

#### SQLite
```bash
cd app/backend
rm carbonpay.sqlite
npm run dev  # Recria automaticamente
```

#### PostgreSQL
```bash
# Via Docker
docker exec -it carbonpay-postgres psql -U postgres -c "DROP DATABASE carbonpay; CREATE DATABASE carbonpay;"

# Via CLI
dropdb carbonpay && createdb carbonpay
```

### Backup do Banco de Dados

#### SQLite
```bash
cd app/backend
cp carbonpay.sqlite carbonpay.sqlite.backup
```

#### PostgreSQL
```bash
pg_dump carbonpay > backup.sql
# Restaurar:
psql carbonpay < backup.sql
```

## 🚀 Migrações (Produção)

Para produção, desabilite `synchronize` e use migrações:

### 1. Configurar no data-source.ts

```typescript
synchronize: false,  // NUNCA true em produção!
migrations: ['src/database/migrations/*.ts'],
```

### 2. Criar Migração

```bash
npm run typeorm migration:generate -- -n InitialSchema
```

### 3. Executar Migrações

```bash
npm run typeorm migration:run
```

## ⚠️ Importante

### Desenvolvimento

- ✅ `synchronize: true` - TypeORM cria/atualiza tabelas automaticamente
- ✅ SQLite é perfeito para desenvolvimento
- ✅ Dados são persistidos localmente

### Produção

- ⚠️ `synchronize: false` - SEMPRE desabilitar
- ⚠️ Usar migrações para mudanças de schema
- ⚠️ Usar PostgreSQL (nunca SQLite)
- ⚠️ Fazer backup regular

## 🔍 Troubleshooting

### Erro: "Cannot find module 'sqlite3'"

```bash
cd app/backend
npm install --save-dev sqlite3
```

### Erro: "ENOENT: no such file or directory"

O TypeORM criará o arquivo automaticamente na primeira execução.

### Erro: "database is locked"

Feche qualquer ferramenta que esteja acessando o arquivo SQLite e reinicie o servidor.

### Tabelas não são criadas

Verifique se `synchronize: true` está configurado para desenvolvimento no `data-source.ts`.

## 📝 Logs

Com `logging: true`, você verá todas as queries SQL no console:

```sql
query: SELECT "user"."id" AS "user_id", "user"."email" AS "user_email" FROM "user" "user"
```

Desabilite em produção para melhor performance.

## 🎯 Resumo

| Aspecto | SQLite (Desenvolvimento) | PostgreSQL (Produção) |
|---------|-------------------------|----------------------|
| Instalação | ✅ Nenhuma | ❌ Necessária |
| Configuração | ✅ Zero | ⚙️ Requer setup |
| Performance | 🟡 Adequada | 🟢 Excelente |
| Escalabilidade | ❌ Limitada | ✅ Excelente |
| Concurrent Access | ❌ Limitado | ✅ Completo |
| Recomendado para | 💻 Dev Local | 🚀 Produção |

---

**Recomendação**: Use SQLite para desenvolvimento local (já configurado!) e PostgreSQL para produção.
