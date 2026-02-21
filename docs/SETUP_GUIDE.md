# Setup & Installation Guide

## System Requirements

- Node.js v16+ 
- npm v8+
- MongoDB v5.0+
- Git
- 2GB+ RAM
- 500MB+ Disk space

## Project Setup

### 1. Clone Repository

```bash
git clone https://github.com/yourusername/neuronav.git
cd neuronav
```

### 2. Install Root Dependencies

```bash
npm install
```

### 3. Install Backend Dependencies

```bash
cd server
npm install
cd ..
```

### 4. Install Frontend Dependencies

```bash
cd client
npm install
cd ..
```

### 5. Configure Environment Variables

#### Backend (.env)

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Edit `.env`:

```bash
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/neuronav
MONGODB_TEST_URI=mongodb://localhost:27017/neuronav-test

# Server Configuration
PORT=5000
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here-min-32-chars
JWT_EXPIRE=7d

# Gemini Flash 2.5 API
GEMINI_API_KEY=your-gemini-api-key-from-google-ai

# Google Maps API
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Spotify API
SPOTIFY_CLIENT_ID=your-spotify-client-id
SPOTIFY_CLIENT_SECRET=your-spotify-client-secret

# Email Configuration (Gmail)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-gmail-app-password

# SMS Configuration (Twilio)
TWILIO_ACCOUNT_SID=your-twilio-account-sid
TWILIO_AUTH_TOKEN=your-twilio-auth-token
TWILIO_PHONE_NUMBER=+1234567890

# Client Configuration
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your-google-maps-api-key
REACT_APP_SPOTIFY_CLIENT_ID=your-spotify-client-id

# AWS Configuration (optional for local dev)
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-aws-key
AWS_SECRET_ACCESS_KEY=your-aws-secret

# Sensory Thresholds
SENSORY_HIGH_THRESHOLD=70
SENSORY_MEDIUM_THRESHOLD=40
```

#### Frontend (.env or .env.local)

```bash
REACT_APP_API_URL=http://localhost:5000
REACT_APP_GOOGLE_MAPS_API_KEY=your-key
REACT_APP_SPOTIFY_CLIENT_ID=your-id
```

### 6. Set Up MongoDB

#### Option A: Local MongoDB

```bash
# macOS with Homebrew
brew install mongodb-community
brew services start mongodb-community

# Linux (Ubuntu)
sudo apt-get install -y mongodb
sudo systemctl start mongod

# Windows
# Download from https://www.mongodb.com/try/download/community
# Or use: choco install mongodb-community
```

Verify MongoDB is running:
```bash
mongosh  # or mongo
```

#### Option B: MongoDB Atlas (Cloud)

1. Create account at https://www.mongodb.com/cloud/atlas
2. Create a cluster
3. Add a database user
4. Get connection string
5. Update `MONGODB_URI` in `.env`

### 7. Get API Keys

#### Gemini Flash 2.5
1. Visit https://ai.google.dev/
2. Sign in with Google account
3. Create API key
4. Copy to `GEMINI_API_KEY`

#### Google Maps
1. Go to https://cloud.google.com/maps
2. Create a project
3. Enable Maps, Places, and Geocoding APIs
4. Create an API key
5. Copy to `GOOGLE_MAPS_API_KEY`

#### Spotify
1. Visit https://developer.spotify.com/
2. Create an app
3. Get Client ID and Secret
4. Copy to `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`

#### Twilio
1. Create account at https://www.twilio.com/
2. Verify phone number
3. Get Account SID and Auth Token
4. Copy to environment variables

#### Gmail
1. Enable 2-factor authentication on Gmail
2. Generate App Password
3. Use App Password as `SMTP_PASS`

## Running the Application

### Development Mode

Run both backend and frontend concurrently:

```bash
npm run dev
```

Or run separately:

```bash
# Terminal 1 - Backend
cd server && npm run dev

# Terminal 2 - Frontend
cd client && npm start
```

- **Backend**: http://localhost:5000
- **Frontend**: http://localhost:3000

### Production Mode

```bash
# Build frontend
cd client
npm run build
cd ..

# Start backend
cd server
npm start
```

## Troubleshooting

### MongoDB Connection Issues

```bash
# Check if MongoDB is running
ps aux | grep mongod

# On macOS
brew services list

# On Linux
sudo systemctl status mongod

# Try connecting directly
mongosh
```

### Port Already in Use

```bash
# Check what's using port 5000
lsof -i :5000

# Or on Windows
netstat -ano | findstr :5000

# Kill process (get PID from above)
kill -9 PID
```

### Module Not Found Errors

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Do for both server and client
cd server && npm install && cd ..
cd client && npm install && cd ..
```

### API Key Issues

- Ensure all API keys are in `.env` file
- Restart backend after changing `.env`
- Check API key permissions in respective services
- Verify API keys haven't expired

### Frontend Not Connecting to Backend

- Ensure backend is running on port 5000
- Check `REACT_APP_API_URL` in `.env`
- Clear browser cache and restart dev server
- Check browser console for CORS errors

## Next Steps

1. **Read the documentation**: Check [docs/](../docs/) folder
2. **Run tests**: `npm test`
3. **Start development**: `npm run dev`
4. **Check API**: Visit http://localhost:5000/api/health

## Getting Help

- Check [API Documentation](./API_DOCUMENTATION.md)
- Review [Testing Guide](./TESTING_GUIDE.md)
- Check [Deployment Guide](./DEPLOYMENT.md)
- Open an issue on GitHub
- Contact the team

---

**Happy developing! 🚀**
