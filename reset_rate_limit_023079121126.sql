-- Resetar rate limits do CPF 02307912126
-- Execute este comando no seu banco de dados PostgreSQL

-- Deletar rate limits relacionados ao CPF
DELETE FROM rate_limits WHERE key LIKE '%02307912126%';

-- Verificar se foi removido (deve retornar vazio)
SELECT * FROM rate_limits WHERE key LIKE '%023079121%';

-- Se quiser resetar TODOS os rate limits (use com cuidado):
-- DELETE FROM rate_limits;
