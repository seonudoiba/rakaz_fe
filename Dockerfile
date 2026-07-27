# Build stage
FROM node:20-alpine AS builder

WORKDIR /usr/src/app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Skip TypeScript build - just copy the source directly
# The frontend will be served as-is

# Production stage with Nginx
FROM nginx:alpine

# Copy the entire src directory to nginx
COPY --from=builder /usr/src/app/src /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Expose port
EXPOSE 80

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]