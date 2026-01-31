#!/bin/bash

# Setup Chatwoot para Castra+MG
# Este script configura o Chatwoot e a integração com Evolution API

set -e

echo "=========================================="
echo "   SETUP CHATWOOT - CASTRA+MG"
echo "=========================================="
echo ""

# Verificar se o docker está instalado
if ! command -v docker &> /dev/null; then
    echo "ERRO: Docker não está instalado"
    exit 1
fi

# Diretório do projeto
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

cd "$PROJECT_DIR"

# Gerar senhas se não existirem
if [ -z "$CHATWOOT_DB_PASSWORD" ]; then
    CHATWOOT_DB_PASSWORD=$(openssl rand -hex 32)
    echo "CHATWOOT_DB_PASSWORD=$CHATWOOT_DB_PASSWORD" >> .env.chatwoot
fi

if [ -z "$CHATWOOT_SECRET_KEY" ]; then
    CHATWOOT_SECRET_KEY=$(openssl rand -hex 64)
    echo "CHATWOOT_SECRET_KEY=$CHATWOOT_SECRET_KEY" >> .env.chatwoot
fi

echo "1. Iniciando containers do Chatwoot..."
docker compose -f docker-compose.chatwoot.yml up -d

echo ""
echo "2. Aguardando serviços iniciarem (60s)..."
sleep 60

echo ""
echo "3. Executando migrations do banco de dados..."
docker compose -f docker-compose.chatwoot.yml exec chatwoot-rails bundle exec rails db:chatwoot_prepare

echo ""
echo "4. Criando conta de administrador..."
echo ""
read -p "   Email do admin: " ADMIN_EMAIL
read -s -p "   Senha do admin: " ADMIN_PASSWORD
echo ""

docker compose -f docker-compose.chatwoot.yml exec chatwoot-rails bundle exec rails runner "
  user = User.new(
    email: '$ADMIN_EMAIL',
    password: '$ADMIN_PASSWORD',
    name: 'Administrador',
    role: 'administrator'
  )
  user.skip_confirmation!
  user.save!

  account = Account.create!(name: 'Castra+MG')
  AccountUser.create!(account: account, user: user, role: 'administrator')

  puts 'Usuário admin criado com sucesso!'
"

echo ""
echo "=========================================="
echo "   SETUP CONCLUÍDO!"
echo "=========================================="
echo ""
echo "Acesse o Chatwoot em: http://localhost:3001"
echo "Login: $ADMIN_EMAIL"
echo ""
echo "=========================================="
echo "   PRÓXIMOS PASSOS:"
echo "=========================================="
echo ""
echo "1. Acesse o Chatwoot e faça login"
echo ""
echo "2. Vá em Settings > Inboxes > Add Inbox"
echo ""
echo "3. Selecione 'API' como tipo de canal"
echo ""
echo "4. Anote o 'Inbox Identifier' e 'Webhook URL'"
echo ""
echo "5. Configure o Evolution API com o webhook:"
echo "   URL: http://SEU_IP:3001/webhooks/evolution"
echo ""
echo "6. No Castra+MG, adicione no .env:"
echo "   CHATWOOT_URL=http://localhost:3001"
echo "   CHATWOOT_INBOX_ID=<inbox_identifier>"
echo "   CHATWOOT_API_ACCESS_TOKEN=<token_do_profile>"
echo ""
echo "=========================================="
