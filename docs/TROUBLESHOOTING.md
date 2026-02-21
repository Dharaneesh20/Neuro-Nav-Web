# NeuroNav - Troubleshooting Guide

## Common Issues & Solutions

### Installation Issues

#### Problem: npm install fails
**Solution**:
```bash
# Clear cache
npm cache clean --force

# Try again
npm install

# Or use yarn
yarn install
```

#### Problem: Module not found error
**Solution**:
```bash
# Reinstall node_modules
rm -rf node_modules
npm install

# For specific module
npm install --save module-name
```

#### Problem: Different errors in server and client
**Solution**:
```bash
# Install in both places
cd server && npm install && cd ..
cd client && npm install && cd ..
```

---

### Server Issues

#### Problem: "Port 5000 already in use"
**Solution**:
```bash
# Find process using port
lsof -i :5000

# Kill process (replace with PID)
kill -9 <PID>

# Or use different port
PORT=3001 npm run dev
```

#### Problem: "MongoDB connection refused"
**Solution**:
```bash
# Check if MongoDB is running
ps aux | grep mongod

# Start MongoDB
brew services start mongodb-community  # macOS
sudo systemctl start mongod            # Linux
mongod                                 # Windows

# Check connection string in .env
MONGODB_URI=mongodb://localhost:27017/neuronav
```

#### Problem: "JWT token invalid"
**Solution**:
- Clear localStorage: `localStorage.clear()`
- Log out and log in again
- Check JWT_SECRET in .env matches
- Restart server

#### Problem: "API calls returning 500 errors"
**Solution**:
```bash
# Check server logs
npm run dev  # Look for error messages

# Verify .env variables
echo $GEMINI_API_KEY
echo $GOOGLE_MAPS_API_KEY

# Test endpoint health
curl http://localhost:5000/api/health
```

---

### Frontend Issues

#### Problem: "Cannot GET /"
**Solution**:
- Ensure frontend is running: `cd client && npm start`
- Check port 3000 is available
- Clear browser cache (Ctrl+Shift+Delete)
- Hard refresh browser (Ctrl+Shift+R)

#### Problem: "CORS errors in browser console"
**Solution**:
```bash
# Backend CORS config in .env
CORS_ORIGIN=http://localhost:3000

# Restart backend
# Test with curl
curl -H "Origin: http://localhost:3000" http://localhost:5000/api/health
```

#### Problem: "Map not displaying"
**Solution**:
- Verify GOOGLE_MAPS_API_KEY in .env
- Enable Maps API in Google Cloud Console
- Check browser location permissions
- Open browser console for errors

#### Problem: "Spotify not connecting"
**Solution**:
- Check SPOTIFY_CLIENT_ID and SECRET in .env
- Verify Spotify account is active
- Check browser pop-up permissions
- Refresh page and try again

---

### Database Issues

#### Problem: "MongoDB: E11000 duplicate key error"
**Solution**:
```bash
# Clear database
mongo  # Connect to MongoDB
use neuronav
db.dropDatabase()

# Or remove specific collection
db.users.deleteMany({})
```

#### Problem: "No such file or directory" in MongoDB
**Solution**:
```bash
# Create data directory
mkdir -p ~/data/db

# Start MongoDB with dbpath
mongod --dbpath ~/data/db
```

#### Problem: "Authentication failed"
**Solution**:
- Verify MONGODB_URI in .env
- Check username/password if using MongoDB Atlas
- Reset MongoDB admin password
- Test connection with mongosh

---

### API Issues

#### Problem: "Unauthorized 401 error"
**Solution**:
- Verify token exists in localStorage
- Check token expiration time
- Log out and log in again
- Send token in Authorization header: `Authorization: Bearer <token>`

#### Problem: "Bad request 400 error"
**Solution**:
- Verify request data format
- Check required fields
- Validate email format
- Test with Postman or cURL

#### Problem: "Not found 404 error"
**Solution**:
- Verify API endpoint is correct
- Check resource ID exists
- Ensure MongoDB document exists
- Check database connection

---

### Email & SMS Issues

#### Problem: "Email not sending"
**Solution**:
- Verify Gmail app password (not regular password)
- Enable "Less secure app access" if needed
- Check SMTP_USER and SMTP_PASS in .env
- Test with curl or mail client

#### Problem: "SMS not sending"
**Solution**:
- Verify Twilio Account SID and Auth Token
- Check TWILIO_PHONE_NUMBER format (+1234567890)
- Ensure recipient phone number is valid
- Check Twilio account balance

#### Problem: "Notification delays"
**Solution**:
- Check network connection
- Verify API key validity
- Reduce rate limiting settings
- Contact service provider

---

### Performance Issues

#### Problem: "App is slow"
**Solution**:
- Clear browser cache
- Disable browser extensions
- Close unnecessary tabs
- Check network speed
- Reduce database query size

#### Problem: "API responses are slow"
**Solution**:
```bash
# Check MongoDB indexing
db.users.getIndexes()

# Add indexes if missing
db.calmScores.createIndex({ userId: 1, timestamp: -1 })

# Check query performance
db.calmScores.find(...).explain("executionStats")
```

#### Problem: "High memory usage"
**Solution**:
- Restart services
- Check for memory leaks
- Reduce batch size
- Clear old logs

---

### Docker Issues

#### Problem: "Docker image build fails"
**Solution**:
```bash
# Check Dockerfile
docker build --no-cache -t neuronav .

# Check dependencies
cat Dockerfile  # Verify all steps

# Build from scratch
docker system prune -a
docker build -t neuronav .
```

#### Problem: "Container won't start"
**Solution**:
```bash
# Check logs
docker logs <container-id>

# Run interactively
docker run -it neuronav /bin/sh

# Check Docker daemon
docker ps
docker images
```

#### Problem: "docker-compose fails"
**Solution**:
```bash
# Check compose file
docker-compose config

# Build individually
docker-compose build

# Start with verbose output
docker-compose -f docker-compose.yml up --verbose

# Check service logs
docker-compose logs mongodb
docker-compose logs backend
```

---

### GitHub & Git Issues

#### Problem: "Git merge conflicts"
**Solution**:
```bash
# View conflicts
git diff

# Resolve manually, then
git add .
git commit -m "Resolve conflicts"
git push
```

#### Problem: "Cannot push to GitHub"
**Solution**:
```bash
# Check SSH key
ssh -T git@github.com

# Generate new key if needed
ssh-keygen -t ed25519

# Verify remote
git remote -v

# Reset if needed
git remote set-url origin git@github.com:username/neuronav.git
```

---

### Development Environment Issues

#### Problem: "Node version mismatch"
**Solution**:
```bash
# Check version
node --version  # Should be v16+

# Update Node
nvm install 18  # Using nvm
nvm use 18
```

#### Problem: "Cannot find command 'npm'"
**Solution**:
```bash
# Reinstall Node.js from nodejs.org
# Or use package manager
brew install node  # macOS
sudo apt install nodejs npm  # Linux
choco install nodejs  # Windows (with Chocolatey)
```

---

## Getting Help

If you still have issues:

1. **Check the logs** - Most issues appear in console/logs
2. **Search existing issues** - GitHub Issues may have the answer
3. **Read the docs** - Check [Documentation](../docs/)
4. **Ask in discussions** - GitHub Discussions for community help
5. **Contact support** - Email neuronav@example.com with:
   - Description of issue
   - Steps to reproduce
   - Error message/logs
   - System information (OS, Node version, etc.)

---

**Last Updated**: February 2026  
**Need more help?** Visit our GitHub: https://github.com/neuronav
