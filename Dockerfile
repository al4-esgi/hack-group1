# Utiliser Node v24 comme spécifié dans package.json
FROM node:24-slim AS base

# Installer pnpm et git
RUN apt-get update && apt-get install -y git && rm -rf /var/lib/apt/lists/*
RUN npm install -g pnpm

# --- Étape de dépendances ---
FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
# On installe toutes les dépendances (y compris dev) pour le build
RUN pnpm install --frozen-lockfile

# --- Étape de build ---
FROM base AS builder
# Installer docker CLI pour pouvoir restart le container
RUN apt-get update && apt-get install -y curl && \
    curl -fsSL https://get.docker.com -o get-docker.sh && \
    sh get-docker.sh && \
    rm get-docker.sh && \
    rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm run build
# On ne garde que les dépendances de prod pour l'image finale
RUN pnpm install --prod --frozen-lockfile

# --- Image de production ---
FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Port par défaut
EXPOSE 3000

CMD ["node", "dist/main"]
