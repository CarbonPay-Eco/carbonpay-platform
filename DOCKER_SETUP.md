# 🐳 Docker Setup - CarbonPay Backend

## PostgreSQL com Docker

Este guia mostra como rodar o PostgreSQL usando Docker para o backend do CarbonPay.

## 🚀 Quick Start

### 1. Iniciar PostgreSQL

```bash
# Na raiz do projeto
docker-compose up -d postgres
```

Isso irá:
- ✅ Baixar a imagem do PostgreSQL 15
- ✅ Criar um container `carbonpay-postgres`
- ✅ Criar o banco de dados `carbonpay`
- ✅ Expor a porta `5432`
- ✅ Persistir dados em um volume Docker

### 2. Verificar se está rodando

```bash
docker-compose ps
```

Você deve ver:
```
NAME                  IMAGE                  STATUS
carbonpay-postgres    postgres:15-alpine     Up
```

### 3. Iniciar o Backend

```bash
cd app/backend
npm run dev
```

O backend irá conectar automaticamente ao PostgreSQL!

## 🎯 Comandos Úteis

### Gerenciar PostgreSQL

```bash
# Iniciar
docker-compose up -d postgres

# Parar
docker-compose stop postgres

# Reiniciar
docker-compose restart postgres

# Ver logs
docker-compose logs -f postgres

# Parar e remover (mantém dados)
docker-compose down

# Parar e remover TUDO (apaga dados!)
docker-compose down -v
```

### Acessar o PostgreSQL

#### Opção 1: Via Docker CLI

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U carbonpay -d carbonpay

# Comandos úteis no psql:
\dt              # Listar tabelas
\d user          # Descrever tabela user
SELECT * FROM "user";  # Consultar dados
\q               # Sair
```

#### Opção 2: Via pgAdmin (Interface Gráfica)

```bash
# Iniciar pgAdmin
docker-compose --profile tools up -d pgadmin

# Acessar: http://localhost:5050
# Email: admin@carbonpay.com
# Senha: admin
```

Adicionar servidor no pgAdmin:
- **Host**: postgres
- **Port**: 5432
- **Database**: carbonpay
- **Username**: carbonpay
- **Password**: carbonpay

#### Opção 3: Ferramentas Externas

Use qualquer cliente PostgreSQL:
- **DBeaver** (Recomendado, gratuito)
- **DataGrip** (JetBrains, pago)
- **TablePlus** (macOS/Windows)
- **pgAdmin** (Desktop app)

Configuração de conexão:
```
Host: localhost
Port: 5432
Database: carbonpay
Username: carbonpay
Password: carbonpay
```

## 📊 Estrutura do Banco de Dados

Após iniciar o backend, as seguintes tabelas serão criadas automaticamente:

```sql
-- Usuários e Autenticação
user              - Usuários da plataforma
user_wallet       - Carteiras Solana dos usuários

-- Organizações
wallet            - Carteiras organizacionais
organization      - Dados das organizações

-- Projetos e Créditos
tokenized_project - Projetos de créditos de carbono
purchase          - Compras de créditos
retirement        - Offsets (retirements) de créditos

-- Auditoria
audit_log         - Log de auditoria de ações
```

## 🔧 Configuração Avançada

### Alterar Porta do PostgreSQL

Se a porta 5432 já estiver em uso:

```yaml
# No docker-compose.yml
services:
  postgres:
    ports:
      - "5433:5432"  # Mude 5433 para a porta desejada
```

E no `.env`:
```bash
DB_PORT=5433
POSTGRES_PORT=5433
```

### Usar Senha Diferente

```yaml
# No docker-compose.yml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: sua_senha_super_segura
```

E no `.env`:
```bash
POSTGRES_PASSWORD=sua_senha_super_segura
DB_PASSWORD=sua_senha_super_segura
```

### Backup e Restauração

#### Backup

```bash
# Criar backup
docker-compose exec postgres pg_dump -U carbonpay carbonpay > backup.sql

# Ou com timestamp
docker-compose exec postgres pg_dump -U carbonpay carbonpay > backup_$(date +%Y%m%d_%H%M%S).sql
```

#### Restaurar

```bash
# Restaurar backup
cat backup.sql | docker-compose exec -T postgres psql -U carbonpay -d carbonpay

# Ou resetar e restaurar
docker-compose exec postgres psql -U carbonpay -d postgres -c "DROP DATABASE carbonpay;"
docker-compose exec postgres psql -U carbonpay -d postgres -c "CREATE DATABASE carbonpay;"
cat backup.sql | docker-compose exec -T postgres psql -U carbonpay -d carbonpay
```

## 🗑️ Resetar Banco de Dados

### Manter Container, Resetar Dados

```bash
# Conectar ao PostgreSQL
docker-compose exec postgres psql -U carbonpay -d postgres

# Dropar e recriar banco
DROP DATABASE carbonpay;
CREATE DATABASE carbonpay;
\q

# Reiniciar backend para recriar tabelas
cd app/backend && npm run dev
```

### Resetar Tudo (Container e Dados)

```bash
# Parar e remover tudo
docker-compose down -v

# Iniciar novamente
docker-compose up -d postgres

# Backend recriará as tabelas
cd app/backend && npm run dev
```

## 🐛 Troubleshooting

### Erro: "Connection refused" ou "ECONNREFUSED"

**Causa**: PostgreSQL não está rodando ou porta incorreta

**Solução**:
```bash
# Verificar se container está rodando
docker-compose ps

# Iniciar se não estiver
docker-compose up -d postgres

# Ver logs para erros
docker-compose logs postgres
```

### Erro: "password authentication failed"

**Causa**: Senha incorreta no .env

**Solução**:
```bash
# Verificar .env
cat app/backend/.env | grep POSTGRES_PASSWORD

# Deve ser igual ao docker-compose.yml
# Se não for, corrija e reinicie o backend
```

### Erro: "database does not exist"

**Causa**: Banco de dados não foi criado

**Solução**:
```bash
# Recriar banco
docker-compose exec postgres psql -U carbonpay -d postgres -c "CREATE DATABASE carbonpay;"
```

### Container não inicia

```bash
# Ver logs detalhados
docker-compose logs postgres

# Verificar se porta está em uso
lsof -i :5432

# Se estiver, mude a porta no docker-compose.yml e .env
```

### Dados foram perdidos

**Causa**: Usou `docker-compose down -v` (remove volumes)

**Solução**:
- Use apenas `docker-compose down` (mantém dados)
- Sempre faça backup antes de remover volumes
- Os dados persistem no volume `postgres_data`

## 📈 Performance

### Ver Queries Lentas

```sql
-- Conectar ao PostgreSQL
docker-compose exec postgres psql -U carbonpay -d carbonpay

-- Habilitar log de queries lentas
ALTER SYSTEM SET log_min_duration_statement = 1000; -- 1 segundo
SELECT pg_reload_conf();

-- Ver queries ativas
SELECT pid, now() - pg_stat_activity.query_start AS duration, query
FROM pg_stat_activity
WHERE state = 'active';
```

### Índices

O TypeORM cria índices automaticamente para:
- Primary keys
- Foreign keys
- Campos únicos (email, publicKey, etc.)

## 🔐 Segurança

### Desenvolvimento

Configuração atual é adequada para desenvolvimento local.

### Produção

Para produção, altere:

```yaml
services:
  postgres:
    environment:
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD} # Usar variável de ambiente
    # Não exponha a porta publicamente:
    # ports:
    #   - "5432:5432"  # Comentar ou remover
```

E use senha forte:
```bash
# Gerar senha aleatória
openssl rand -base64 32
```

## 📦 Volumes e Dados

Os dados do PostgreSQL são armazenados em um volume Docker:

```bash
# Ver volumes
docker volume ls | grep carbonpay

# Inspecionar volume
docker volume inspect carbonpay-platform_postgres_data

# Localização real dos dados (varia por OS):
# Linux: /var/lib/docker/volumes/carbonpay-platform_postgres_data/_data
# macOS: ~/Library/Containers/com.docker.docker/Data/vms/0/
# Windows: \\wsl$\docker-desktop-data\data\docker\volumes\
```

## 🎯 Resumo dos Comandos Principais

```bash
# Iniciar PostgreSQL
docker-compose up -d postgres

# Ver logs
docker-compose logs -f postgres

# Conectar ao banco
docker-compose exec postgres psql -U carbonpay -d carbonpay

# Backup
docker-compose exec postgres pg_dump -U carbonpay carbonpay > backup.sql

# Parar (mantém dados)
docker-compose down

# Parar e apagar dados (cuidado!)
docker-compose down -v

# Ver tabelas criadas
docker-compose exec postgres psql -U carbonpay -d carbonpay -c "\dt"
```

## ✅ Checklist

- [ ] Docker está instalado e rodando
- [ ] `docker-compose up -d postgres` executado
- [ ] Container `carbonpay-postgres` está rodando
- [ ] `.env` configurado com `USE_LOCAL_DB=false`
- [ ] Backend conecta com sucesso
- [ ] Tabelas foram criadas automaticamente

---

**Pronto!** Agora você tem PostgreSQL rodando no Docker para desenvolvimento local com persistência de dados.
