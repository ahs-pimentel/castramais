#!/bin/sh

echo "Aguardando banco de dados..."
sleep 5

echo "Executando seed..."
node scripts/seed-prod.mjs || echo "Seed concluído"

echo "Iniciando aplicação..."
exec npm start
