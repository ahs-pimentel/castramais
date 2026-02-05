-- Script de otimização de performance: Índices do banco de dados
-- Execute este script no PostgreSQL para melhorar a performance das queries
-- Data: 2026-02-03

-- Índice para JOIN entre animais e tutores (CRÍTICO)
-- Usado em praticamente todas as queries de listagem
CREATE INDEX IF NOT EXISTS idx_animais_tutor_id ON animais("tutorId");

-- Índice para filtro de status (muito usado na listagem)
CREATE INDEX IF NOT EXISTS idx_animais_status ON animais(status);

-- Índice para ordenação por data de criação (usado em ORDER BY)
CREATE INDEX IF NOT EXISTS idx_animais_created_at ON animais("createdAt" DESC);

-- Índice para busca por registro SinPatinhas
CREATE INDEX IF NOT EXISTS idx_animais_registro ON animais("registroSinpatinhas");

-- Índice para busca de tutores por email (verificação de duplicados)
CREATE INDEX IF NOT EXISTS idx_tutores_email ON tutores(email);

-- Índice para busca de tutores por telefone (usado em buscas)
CREATE INDEX IF NOT EXISTS idx_tutores_telefone ON tutores(telefone);

-- Índice para ordenação de tutores por data
CREATE INDEX IF NOT EXISTS idx_tutores_created_at ON tutores("createdAt" DESC);

-- Índice para busca de usuários por email (autenticação)
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- Verificar índices criados
SELECT
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
