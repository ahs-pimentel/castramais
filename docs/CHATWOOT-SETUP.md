# Integração Chatwoot + Evolution API

Este documento explica como configurar o Chatwoot para atendimento ao cliente via WhatsApp, integrado com o Evolution API.

## Arquitetura

```
Tutor (WhatsApp) <--> Evolution API <--> Chatwoot <--> Admin
```

## Pré-requisitos

- Docker e Docker Compose instalados
- Evolution API já configurado e funcionando
- Domínio ou IP público para o Chatwoot (opcional, para produção)

## Instalação

### 1. Configurar variáveis de ambiente

Crie o arquivo `.env.chatwoot` na raiz do projeto:

```env
# Banco de dados
CHATWOOT_DB_PASSWORD=sua_senha_segura_aqui

# Chave secreta (gere com: openssl rand -hex 64)
CHATWOOT_SECRET_KEY=sua_chave_secreta_aqui

# URL pública do Chatwoot
CHATWOOT_URL=http://localhost:3001
# ou em produção:
# CHATWOOT_URL=https://atendimento.seudominio.com.br
```

### 2. Iniciar o Chatwoot

```bash
# Subir os containers
docker compose -f docker-compose.chatwoot.yml up -d

# Verificar logs
docker compose -f docker-compose.chatwoot.yml logs -f

# Aguardar ~60 segundos para os serviços iniciarem
```

### 3. Executar migrations

```bash
docker compose -f docker-compose.chatwoot.yml exec chatwoot-rails bundle exec rails db:chatwoot_prepare
```

### 4. Criar usuário administrador

```bash
docker compose -f docker-compose.chatwoot.yml exec chatwoot-rails bundle exec rails console
```

No console Rails:
```ruby
# Criar usuário
user = User.new(
  email: 'admin@castramais.com.br',
  password: 'sua_senha_aqui',
  name: 'Administrador',
  role: 'administrator'
)
user.skip_confirmation!
user.save!

# Criar conta
account = Account.create!(name: 'Castra+MG')

# Vincular usuário à conta
AccountUser.create!(account: account, user: user, role: 'administrator')

exit
```

### 5. Configurar Inbox (Canal de Atendimento)

1. Acesse o Chatwoot: http://localhost:3001
2. Faça login com o usuário criado
3. Vá em **Settings > Inboxes > Add Inbox**
4. Selecione **API** como tipo de canal
5. Preencha:
   - Nome: `WhatsApp Castra+`
   - Webhook URL: deixe em branco por enquanto
6. Clique em **Create Inbox**
7. Anote o **Inbox ID** gerado

### 6. Gerar API Access Token

1. No Chatwoot, clique no seu avatar > **Profile Settings**
2. Vá na seção **Access Token**
3. Copie o token ou gere um novo

### 7. Configurar no Castra+MG

Adicione ao `.env` do Castra+:

```env
CHATWOOT_URL=http://localhost:3001
CHATWOOT_API_ACCESS_TOKEN=seu_token_aqui
CHATWOOT_ACCOUNT_ID=1
CHATWOOT_INBOX_ID=seu_inbox_id_aqui
```

### 8. Configurar Webhook no Evolution API

Configure o Evolution API para enviar eventos para o Chatwoot:

1. Acesse o painel do Evolution API
2. Vá em Configurações > Webhooks
3. Adicione o webhook:
   - URL: `http://SEU_IP:3001/webhooks/whatsapp`
   - Eventos: `messages.upsert`, `messages.update`

Ou via API:
```bash
curl -X POST "https://evo.odois.com.br/webhook/set/castramais" \
  -H "apikey: sua_api_key" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://SEU_IP:3001/webhooks/whatsapp",
    "webhook_by_events": false,
    "events": [
      "MESSAGES_UPSERT",
      "MESSAGES_UPDATE"
    ]
  }'
```

## Uso

### Recebendo mensagens

Quando um tutor enviar mensagem pelo WhatsApp:
1. Evolution API recebe a mensagem
2. Webhook envia para o Chatwoot
3. Mensagem aparece na inbox do Chatwoot
4. Admin pode responder pelo Chatwoot

### Enviando mensagens

Quando o admin responde no Chatwoot:
1. Chatwoot envia via webhook para Evolution API
2. Evolution API envia para o WhatsApp do tutor

### Vinculando tutores

O sistema automaticamente tenta identificar tutores pelo telefone.
Os atributos customizados do contato incluem:
- `tutor_id`: ID do tutor no sistema
- `animal_nome`: Nome do animal (se identificado)
- `status`: Status do cadastro

## Comandos úteis

```bash
# Ver logs
docker compose -f docker-compose.chatwoot.yml logs -f chatwoot-rails

# Reiniciar
docker compose -f docker-compose.chatwoot.yml restart

# Parar
docker compose -f docker-compose.chatwoot.yml down

# Remover tudo (incluindo dados)
docker compose -f docker-compose.chatwoot.yml down -v
```

## Troubleshooting

### Chatwoot não inicia
- Verifique se as portas 3001, 5433 e 6380 estão disponíveis
- Verifique os logs: `docker compose -f docker-compose.chatwoot.yml logs`

### Mensagens não chegam
- Verifique se o webhook do Evolution está configurado corretamente
- Verifique se o Chatwoot está acessível pelo IP do Evolution

### Erro de autenticação
- Verifique se o API Access Token está correto
- Verifique se o CHATWOOT_ACCOUNT_ID está correto

## Suporte

Para dúvidas sobre a integração, entre em contato com a equipe de desenvolvimento.
