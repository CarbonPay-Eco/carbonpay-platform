-- ============================================
-- Script para visualizar todos os usuários
-- Execute este script no DBeaver
-- ============================================

-- Ver todos os usuários com informações básicas
SELECT 
    id,
    email,
    role,
    draft,
    "createdAt",
    "updatedAt"
FROM users
ORDER BY "createdAt" DESC;

-- ============================================
-- Versão mais detalhada (com contagem de registros)
-- ============================================

-- Ver todos os usuários com informações completas
SELECT 
    id,
    email,
    role,
    draft,
    "createdAt",
    "updatedAt",
    CASE 
        WHEN role = 'admin' THEN '✅ Admin'
        WHEN draft = true THEN '📝 Draft'
        ELSE '👤 User'
    END as status
FROM users
ORDER BY "createdAt" DESC;

-- ============================================
-- Estatísticas dos usuários
-- ============================================

-- Contar usuários por role
SELECT 
    role,
    COUNT(*) as total,
    COUNT(CASE WHEN draft = true THEN 1 END) as drafts,
    COUNT(CASE WHEN draft = false THEN 1 END) as completed
FROM users
GROUP BY role
ORDER BY total DESC;

-- ============================================
-- Ver apenas admins
-- ============================================

SELECT 
    id,
    email,
    role,
    draft,
    "createdAt"
FROM users
WHERE role = 'admin'
ORDER BY "createdAt" DESC;

-- ============================================
-- Ver apenas usuários (não admins)
-- ============================================

SELECT 
    id,
    email,
    role,
    draft,
    "createdAt"
FROM users
WHERE role != 'admin' OR role IS NULL
ORDER BY "createdAt" DESC;

-- ============================================
-- Ver usuários draft (registro incompleto)
-- ============================================

SELECT 
    id,
    email,
    role,
    draft,
    "createdAt"
FROM users
WHERE draft = true
ORDER BY "createdAt" DESC;

-- ============================================
-- Ver usuários completos (não draft)
-- ============================================

SELECT 
    id,
    email,
    role,
    draft,
    "createdAt",
    "updatedAt"
FROM users
WHERE draft = false
ORDER BY "createdAt" DESC;

-- ============================================
-- Buscar usuário específico por email
-- ============================================
-- Substitua 'email@example.com' pelo email desejado

SELECT 
    id,
    email,
    role,
    draft,
    "createdAt",
    "updatedAt"
FROM users
WHERE email = 'email@example.com';

-- ============================================
-- Ver total de usuários
-- ============================================

SELECT 
    COUNT(*) as total_users,
    COUNT(CASE WHEN role = 'admin' THEN 1 END) as total_admins,
    COUNT(CASE WHEN draft = true THEN 1 END) as total_drafts,
    COUNT(CASE WHEN draft = false THEN 1 END) as total_completed
FROM users;

