# Container for Cloud Run (or any container host). Data is in memory, so run one instance.
FROM node:22-slim
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY src ./src
COPY public ./public
COPY data ./data
# Cloud Run sets PORT; the server reads it.
CMD ["node", "src/server.js"]
