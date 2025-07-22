# Build stage
FROM node:22-alpine AS build

WORKDIR /app

COPY package*.json ./
COPY pnpm-lock.yaml ./

RUN npm install -g pnpm
RUN pnpm install

COPY . .

# Ensure production env variables are used at build time
COPY .env.production .env

RUN pnpm run build || (echo "Build failed. Showing errors:" && cat /app/tsconfig.tsbuildinfo 2>/dev/null || true && exit 1)

# Production stage
FROM nginx:alpine

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]