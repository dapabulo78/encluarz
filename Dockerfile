FROM node:20-alpine

# Install Lua 5.1 dan Lua 5.4 untuk Prometheus & Hercules
RUN apk add --no-cache lua5.1 lua5.4 lua5.1-dev git

WORKDIR /app

# Copy semua project files
COPY . .

# Clone matchaobfusc ke dalam folder Matcha
RUN git clone https://github.com/XonistReal/matchaobfusc Matcha/matchaobfusc

# Install backend dependencies (termasuk lzma-purejs)
RUN cd backend && npm install --production

# Port yang dipakai (harus match fly.toml internal_port)
EXPOSE 8080

# Start server
CMD ["node", "backend/server.js"]
