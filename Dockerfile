# Multi-stage Dockerfile for CBT Master Backend
FROM node:20-alpine AS builder

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app

# Install dependencies including Prisma CLI
COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

# Copy source code and config
COPY tsconfig.json ./
COPY src ./src
COPY gst_question_bank.json ./
COPY data ./data

# Generate Prisma client and compile TypeScript
RUN npx prisma generate
RUN npm run build

# Production Runner
FROM node:20-alpine AS runner

RUN apk add --no-cache openssl libc6-compat

WORKDIR /app
ENV NODE_ENV=production

# Install only production dependencies
COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci --omit=dev

# Copy compiled files and data from builder
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/gst_question_bank.json ./gst_question_bank.json
COPY --from=builder /app/data ./data

EXPOSE 5000

CMD ["node", "dist/app.js"]
