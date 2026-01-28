#!/bin/bash

# ===========================================
# Script de Deploy - Castra+
# VPS Hostinger: 72.60.246.158
# ===========================================

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  Deploy Castra+ - VPS Hostinger        ${NC}"
echo -e "${GREEN}=========================================${NC}"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Por favor, execute como root (sudo)${NC}"
  exit 1
fi

# Configurações
APP_DIR="/opt/castramais"
DOMAIN="${1:-castramais.nexuso2.com}"

# Gerar senhas seguras (64 caracteres hexadecimais)
DB_PASSWORD=$(openssl rand -hex 32)
NEXTAUTH_SECRET=$(openssl rand -hex 32)
ADMIN_PASSWORD=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)

echo -e "${YELLOW}Criando diretório da aplicação...${NC}"
mkdir -p $APP_DIR
cd $APP_DIR

echo -e "${YELLOW}Criando arquivo .env com credenciais seguras...${NC}"
cat > .env << EOF
# ============================================
# CREDENCIAIS CASTRA+ - MANTENHA EM SEGURANÇA
# Gerado em: $(date)
# ============================================

# Banco de Dados PostgreSQL
DB_PASSWORD=${DB_PASSWORD}

# NextAuth
NEXTAUTH_SECRET=${NEXTAUTH_SECRET}
NEXTAUTH_URL=https://${DOMAIN}

# Admin inicial (troque após primeiro login!)
ADMIN_EMAIL=admin@castramais.com.br
ADMIN_PASSWORD=${ADMIN_PASSWORD}
EOF

chmod 600 .env

echo -e "${YELLOW}Instalando Docker e Docker Compose (se necessário)...${NC}"
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
fi

if ! command -v docker-compose &> /dev/null; then
    curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
fi

echo -e "${YELLOW}Copiando arquivos do projeto...${NC}"
# Os arquivos devem ser copiados para $APP_DIR antes de executar

echo -e "${YELLOW}Iniciando containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

echo -e "${YELLOW}Aguardando banco de dados iniciar...${NC}"
sleep 10

echo -e "${YELLOW}Criando usuário admin...${NC}"
docker exec castramais-db psql -U castramais -d castramais -c "
INSERT INTO users (id, email, password, nome, \"createdAt\")
VALUES (
  uuid_generate_v4(),
  'admin@castramais.com.br',
  '\$2a\$10\$$(openssl rand -hex 22)',
  'Administrador',
  NOW()
) ON CONFLICT (email) DO NOTHING;"

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  DEPLOY CONCLUÍDO COM SUCESSO!         ${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo -e "${YELLOW}CREDENCIAIS (salve em local seguro):${NC}"
echo ""
echo -e "URL: https://${DOMAIN}"
echo -e "Admin Email: admin@castramais.com.br"
echo -e "Admin Senha: ${ADMIN_PASSWORD}"
echo ""
echo -e "${RED}IMPORTANTE: Troque a senha após o primeiro login!${NC}"
echo ""
echo -e "Arquivo .env salvo em: ${APP_DIR}/.env"
echo ""
