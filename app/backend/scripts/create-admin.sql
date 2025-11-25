-- ============================================
-- Script para criar um usuário ADMIN
-- Execute este script no DBeaver
-- ============================================
-- 
-- IMPORTANTE: 
-- 1. Substitua 'admin@example.com' pelo email desejado
-- 2. Substitua 'senha123' pela senha desejada
-- 3. A senha será hasheada usando bcrypt
-- 4. Você precisará gerar o hash da senha primeiro
--
-- Para gerar o hash da senha, use:
-- npm run hash-password <senha>
-- Ou use o script hash-password.ts
-- ============================================

-- ============================================
-- OPÇÃO 1: Criar admin com senha já hasheada
-- ============================================
-- Substitua os valores abaixo:

INSERT INTO users (
    id,
    email,
    "passwordHash",
    role,
    draft,
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),  -- Gera um UUID único
    'admin@example.com',  -- ⚠️ ALTERE O EMAIL AQUI
    '$2a$10$YourHashedPasswordHere',  -- ⚠️ ALTERE O HASH DA SENHA AQUI
    'admin',  -- Role como admin
    false,  -- Não é draft (registro completo)
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    role = 'admin',
    draft = false,
    "updatedAt" = NOW();

-- ============================================
-- OPÇÃO 2: Criar admin temporário (você precisará fazer login e trocar a senha)
-- ============================================
-- Esta opção cria um admin com senha padrão "admin123"
-- Hash da senha "admin123": $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy

INSERT INTO users (
    id,
    email,
    "passwordHash",
    role,
    draft,
    "createdAt",
    "updatedAt"
) VALUES (
    gen_random_uuid(),
    'admin@example.com',  -- ⚠️ ALTERE O EMAIL AQUI
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',  -- Senha: admin123
    'admin',
    false,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE
SET 
    role = 'admin',
    draft = false,
    "updatedAt" = NOW();

-- ============================================
-- Verificar se o admin foi criado
-- ============================================

SELECT 
    id,
    email,
    role,
    draft,
    "createdAt"
FROM users
WHERE email = 'admin@example.com';  -- ⚠️ ALTERE O EMAIL AQUI

-- ============================================
-- Se o usuário já existe, apenas atualizar para admin
-- ============================================

UPDATE users 
SET 
    role = 'admin',
    draft = false,
    "updatedAt" = NOW()
WHERE email = 'admin@example.com';  -- ⚠️ ALTERE O EMAIL AQUI

-- ============================================
-- Criar múltiplos admins de uma vez
-- ============================================

INSERT INTO users (id, email, "passwordHash", role, draft, "createdAt", "updatedAt")
VALUES 
    (gen_random_uuid(), 'admin1@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', false, NOW(), NOW()),
    (gen_random_uuid(), 'admin2@example.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin', false, NOW(), NOW())
ON CONFLICT (email) DO UPDATE
SET 
    role = 'admin',
    draft = false,
    "updatedAt" = NOW();

-- ============================================
-- NOTAS IMPORTANTES:
-- ============================================
-- 1. O hash da senha é gerado usando bcrypt com salt rounds 10
-- 2. A senha padrão "admin123" tem o hash: $2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy
-- 3. Para gerar hash de outra senha, use o script hash-password.ts
-- 4. Após criar o admin, faça login e troque a senha pela interface
-- 5. O email deve ser único (constraint UNIQUE na tabela)

