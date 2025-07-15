# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies with legacy peer deps
RUN npm install --legacy-peer-deps

# Copy the rest of the application (this will be frontend/src, etc.)
COPY . .

# Build the application with error handling
RUN npm run build || (echo "Build failed. Showing errors:" && cat /app/tsconfig.tsbuildinfo 2>/dev/null || true && exit 1)

# Production stage
FROM nginx:alpine

# Copy built assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"] 