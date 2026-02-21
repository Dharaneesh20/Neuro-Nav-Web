#!/bin/bash

# NeuroNav Development Setup Script

echo "🚀 Welcome to NeuroNav Setup"
echo "=============================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js v16+"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"
echo ""

# Check MongoDB
if ! command -v mongod &> /dev/null && ! command -v mongo &> /dev/null; then
    echo "⚠️  MongoDB not found. Please install MongoDB or use MongoDB Atlas"
    echo "   Visit: https://www.mongodb.com/try/download/community"
fi

echo "📦 Installing root dependencies..."
npm install

echo ""
echo "📦 Installing backend dependencies..."
cd server
npm install
cd ..

echo ""
echo "📦 Installing frontend dependencies..."
cd client
npm install
cd ..

echo ""
echo "📋 Checking for .env file..."
if [ ! -f .env ]; then
    echo "❌ .env file not found!"
    echo "Creating .env from .env.example..."
    cp .env.example .env
    echo "✅ Created .env file. Please edit it with your API keys:"
    echo "   - Gemini API Key"
    echo "   - Google Maps API Key"
    echo "   - Spotify Client ID & Secret"
    echo "   - Twilio Credentials"
    echo "   - Email Configuration"
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "🎯 Next steps:"
echo "1. Edit .env with your API keys"
echo "2. Ensure MongoDB is running"
echo "3. Run: npm run dev"
echo ""
echo "Happy coding! 🎉"
