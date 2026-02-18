-- Migration: Aumentar precisão do campo peso de DECIMAL(5,2) para DECIMAL(10,2)
-- Data: 2026-02-18
-- Objetivo: Resolver erro "numeric field overflow" ao salvar animais com peso válido

-- Alterar o tipo do campo peso na tabela animais
ALTER TABLE animais 
ALTER COLUMN peso TYPE DECIMAL(10,2) USING peso::DECIMAL(10,2);

-- Verificar a alteração
SELECT 
  column_name,
  data_type,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_name = 'animais' AND column_name = 'peso';
