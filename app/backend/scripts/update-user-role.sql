-- ============================================
-- Scripts SQL para gerenciar roles de usuários
-- Execute no DBeaver
-- ============================================

-- ============================================
-- Tornar um usuário ADMIN por email
-- ============================================
-- Substitua 'email@example.com' pelo email do usuário

UPDATE users 
SET role = 'admin', "updatedAt" = NOW()
WHERE email = 'email@example.com';

-- Verificar se foi atualizado
SELECT id, email, role, "updatedAt" 
FROM users 
WHERE email = 'email@example.com';

-- ============================================
-- Remover admin (tornar usuário comum)
-- ============================================

UPDATE users 
SET role = 'user', "updatedAt" = NOW()
WHERE email = 'email@example.com';

-- ============================================
-- Tornar múltiplos usuários admin (por lista de emails)
-- ============================================

UPDATE users 
SET role = 'admin', "updatedAt" = NOW()
WHERE email IN (
    'admin1@example.com',
    'admin2@example.com',
    'admin3@example.com'
);

-- ============================================
-- Tornar todos os usuários de um domínio como admin
-- ============================================
-- CUIDADO: Isso afeta todos os usuários do domínio!

UPDATE users 
SET role = 'admin', "updatedAt" = NOW()
WHERE email LIKE '%@example.com';

-- ============================================
-- Ver todos os admins antes de fazer mudanças
-- ============================================

SELECT id, email, role, "createdAt"
FROM users
WHERE role = 'admin'
ORDER BY "createdAt" DESC;

