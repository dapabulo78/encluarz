FROM node:20-alpine

# Install Lua 5.1 dan Lua 5.4 untuk Prometheus & Hercules
RUN apk add --no-cache lua5.1 lua5.4 lua5.1-dev

WORKDIR /app

# Copy semua project files
COPY . .

# Install backend dependencies (termasuk lzma-purejs)
RUN cd backend && npm install --production

# Port yang dipakai (harus match fly.toml internal_port)
EXPOSE 8080

# Start server
CMD ["node", "backend/server.js"]
