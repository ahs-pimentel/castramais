-- Script para adicionar índices de otimização para sistema de vagas
-- Execute este script no banco de dados PostgreSQL

-- Índice na cidade do tutor para filtros e contagem de vagas
CREATE INDEX IF NOT EXISTS idx_tutores_cidade ON tutores(cidade);

-- Índice composto para otimizar a contagem de vagas (status + tutor)
CREATE INDEX IF NOT EXISTS idx_animais_status_tutor ON animais(status, "tutorId");

-- Índice para busca por status lista_espera
CREATE INDEX IF NOT EXISTS idx_animais_lista_espera ON animais(status) WHERE status = 'lista_espera';

-- Verificar índices criados
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('animais', 'tutores')
  AND indexname LIKE 'idx_%'
ORDER BY tablename, indexname;
