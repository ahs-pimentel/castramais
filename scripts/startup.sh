#!/bin/sh

# Aguardar o banco ficar pronto
echo "Aguardando banco de dados..."
sleep 5

# Rodar seed para criar admin se não existir
echo "Executando seed..."
npm run seed || echo "Seed falhou, continuando..."

# Iniciar aplicação
echo "Iniciando aplicação..."
npm run dev
