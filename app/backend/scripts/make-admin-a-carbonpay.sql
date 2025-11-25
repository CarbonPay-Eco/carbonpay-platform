-- ============================================
-- Script para tornar o usuário a@carbonpay.eco em ADMIN
-- Execute este script no DBeaver
-- ============================================

-- Atualizar o usuário para admin
UPDATE users 
SET 
    role = 'admin',
    "updatedAt" = NOW()
WHERE email = 'a@carbonpay.eco';

-- Verificar se foi atualizado
SELECT 
    id,
    email,
    role,
    draft,
    "createdAt",
    "updatedAt"
FROM users
WHERE email = 'a@carbonpay.eco';

-- ============================================
-- Alternativa: Atualizar pelo ID
-- ============================================

UPDATE users 
SET 
    role = 'admin',
    "updatedAt" = NOW()
WHERE id = 'c3917c2c-6237-4524-88b2-ebd402e4cd4e';

-- Verificar
SELECT 
    id,
    email,
    role,
    draft,
    "createdAt",
    "updatedAt"
FROM users
WHERE id = 'c3917c2c-6237-4524-88b2-ebd402e4cd4e';

