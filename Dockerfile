# Stage 1: Build
FROM node:20-alpine AS builder

WORKDIR /app

# Install deps first (layer cache: only re-runs if package*.json changes)
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine AS runner

# Copy compiled output from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Custom Nginx config (SPA fallback + gzip)
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
