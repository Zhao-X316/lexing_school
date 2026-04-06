# 乐星后端 API — 与 deploy/docker/docker-compose.yml 配合使用
FROM docker.1panel.live/library/node:20-alpine

WORKDIR /app

# 仅生产依赖（与 package.json 一致）
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --prod --frozen-lockfile

COPY . .

ENV NODE_ENV=production
EXPOSE 3001

CMD ["node", "src/server.js"]
