#!/bin/bash

# NeuroNav Development Setup Script
# Automated setup for macOS and Linux
# Usage: bash setup-dev.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
  echo -e "\n${BLUE}================================${NC}"
  echo -e "${BLUE}$1${NC}"
  echo -e "${BLUE}================================${NC}\n"
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

# Check if command exists
command_exists() {
  command -v "$1" >/dev/null 2>&1
}

# Main setup
print_header "NeuroNav Development Environment Setup"

# Check Node.js
print_header "Checking Prerequisites"

if command_exists node; then
  NODE_VERSION=$(node --version)
  print_success "Node.js found: $NODE_VERSION"
else
  print_error "Node.js not found. Please install Node.js v16 or later"
  exit 1
fi

if command_exists npm; then
  NPM_VERSION=$(npm --version)
  print_success "npm found: $NPM_VERSION"
else
  print_error "npm not found. Please install npm"
  exit 1
fi

if command_exists git; then
  GIT_VERSION=$(git --version)
  print_success "Git found: $GIT_VERSION"
else
  print_error "Git not found. Please install Git"
  exit 1
fi

# Check MongoDB
print_header "Database Setup"

if command_exists mongod; then
  MONGO_VERSION=$(mongod --version | head -n 1)
  print_success "MongoDB found: $MONGO_VERSION"
  MONGO_INSTALLED=true
else
  print_warning "MongoDB not found. You can install it or use MongoDB Atlas"
  print_warning "Continuing with local setup..."
  MONGO_INSTALLED=false
fi

# Create .env file
print_header "Environment Configuration"

if [ -f ".env" ]; then
  print_warning ".env file already exists. Skipping creation..."
else
  cp .env.example .env
  print_success ".env file created"
  print_warning "⚠️  Please update .env with your API keys:"
  echo "   - GEMINI_API_KEY"
  echo "   - GOOGLE_MAPS_API_KEY"
  echo "   - SPOTIFY_CLIENT_ID/SECRET"
  echo "   - TWILIO_ACCOUNT_SID/AUTH_TOKEN"
  echo "   - SMTP credentials"
fi

# Install dependencies
print_header "Installing Dependencies"

print_success "Installing root dependencies..."
npm install

print_success "Installing server dependencies..."
cd server
npm install
cd ..

print_success "Installing client dependencies..."
cd client
npm install
cd ..

print_header "Running Code Quality Checks"

print_success "Running ESLint..."
npm run lint --prefix server || print_warning "Lint errors found. Fix them before committing."

print_header "Database Setup"

if [ "$MONGO_INSTALLED" = true ]; then
  print_success "Starting MongoDB service..."
  
  if command_exists brew; then
    brew services start mongodb-community 2>/dev/null || print_warning "MongoDB may already be running"
  elif [ -x /usr/bin/systemctl ]; then
    sudo systemctl start mongod 2>/dev/null || print_warning "MongoDB may already be running"
  fi
  
  print_warning "Waiting for MongoDB to start..."
  sleep 2
  
  print_success "Running database seed..."
  node server/seed.js || print_warning "Seed script failed. Run 'node server/seed.js' manually"
fi

# Create git hooks
print_header "Setting Up Git Hooks"

if [ -d ".git" ]; then
  print_success "Git repository found. Setting up pre-commit hooks..."
  npm run prepare 2>/dev/null || print_warning "Git hooks setup skipped"
else
  print_warning "Git repository not initialized. Run 'git init' first"
fi

# Final instructions
print_header "Setup Complete! 🎉"

echo "Quick start commands:"
echo ""
echo -e "${BLUE}Development mode:${NC}"
echo "  npm run dev          # Start all services (backend + frontend)"
echo ""
echo -e "${BLUE}Individual services:${NC}"
echo "  npm run server:dev   # Start backend server only"
echo "  npm run client:dev   # Start React frontend only"
echo ""
echo -e "${BLUE}Testing:${NC}"
echo "  npm test             # Run all tests"
echo "  npm run test:server  # Run server tests"
echo "  npm run test:client  # Run client tests"
echo ""
echo -e "${BLUE}Code quality:${NC}"
echo "  npm run lint         # Run ESLint"
echo "  npm run format       # Format code with Prettier"
echo ""
echo -e "${BLUE}Database:${NC}"
echo "  npm run seed         # Seed database with sample data"
echo "  npm run migrate:up   # Run database migrations"
echo ""
echo -e "${BLUE}Docker:${NC}"
echo "  docker-compose up    # Start services in Docker"
echo ""
echo -e "${BLUE}API Documentation:${NC}"
echo "  Postman: Import docs/NeuroNav_API_Postman.json"
echo "  REST Client: Use docs/API_REQUESTS.http"
echo ""
echo "Next steps:"
echo "1. Update .env with your API keys"
echo "2. Start MongoDB (if not using MongoDB Atlas)"
echo "3. Run 'npm run dev' to start development"
echo "4. Open http://localhost:3000 in your browser"
echo ""
print_success "Happy coding! 🚀"
