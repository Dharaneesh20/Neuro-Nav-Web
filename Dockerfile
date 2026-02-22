FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY server/package.json server/package-lock.json ./server/

# Install dependencies
RUN npm ci && \
    cd server && npm ci && \
    cd ..

# Copy app files
COPY . .

# Build frontend
WORKDIR /app/client
RUN npm ci && npm run build

# Work directory back to root
WORKDIR /app

# Expose port
EXPOSE 5000

# Start backend server
CMD ["npm", "run", "server:start"]
