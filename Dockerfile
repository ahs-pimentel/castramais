FROM node:20-alpine

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Tornar script executável
RUN chmod +x scripts/startup.sh

# Expor porta
EXPOSE 3000

# Comando para desenvolvimento com seed automático
CMD ["sh", "scripts/startup.sh"]
