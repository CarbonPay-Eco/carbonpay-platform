FROM node:18-alpine

WORKDIR /app

# Copiar arquivos de configuração
COPY package.json yarn.lock ./
COPY tsconfig.json ./

# Instalar dependências
RUN yarn install --frozen-lockfile

# Copiar código fonte
COPY src/ ./src/

# Garantir que o diretório dist existe
RUN mkdir -p dist

# Compilar TypeScript para JavaScript
RUN yarn build

# Remover dependências de desenvolvimento para produção
RUN yarn install --production --frozen-lockfile

# Definir variáveis de ambiente padrão (serão substituídas pelo env_file)
# NOTA: Esses valores são apenas padrões e serão substituídos pelas variáveis de ambiente
# fornecidas durante a execução do container
ENV NODE_ENV=${NODE_ENV:-development}
ENV PORT=${PORT:-3000}

# Expor porta da aplicação (usa a variável PORT ou o valor padrão 3000)
EXPOSE ${PORT:-3000}

# Iniciar a aplicação
CMD ["node", "dist/server.js"] 