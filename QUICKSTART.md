# NeuroNav - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Option 1: Local Development

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/neuronav.git
cd neuronav

# 2. Run setup script
bash setup.sh

# 3. Configure environment
# Edit .env with your API keys

# 4. Start development
npm run dev
```

**Access**:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/health

### Option 2: Docker

```bash
# Build and start with Docker Compose
docker-compose up

# Or use the shortcut
docker-compose up --build
```

**Access**:
- Frontend: http://localhost:80
- Backend API: http://localhost:5000

## 📝 First Steps After Setup

1. **Create an account**
   - Visit http://localhost:3000
   - Click "Sign Up"
   - Fill in your details

2. **Configure sensory preferences**
   - Go to Profile
   - Set noise, light, and crowd sensitivities
   - Add caregiver contacts

3. **Test calm score**
   - Enter environmental data
   - See your calm score calculated by Gemini AI

4. **Review the API**
   - Check API docs: http://localhost:5000/api
   - Browse our [API Documentation](../docs/API_DOCUMENTATION.md)

## 🔧 Common Commands

```bash
# Start development
npm run dev

# Run tests
npm test

# Run backend only
cd server && npm run dev

# Run frontend only
cd client && npm start

# Build for production
npm run build

# Format code
npm run format

# Lint code
npm run lint

# Docker commands
docker-compose up              # Start services
docker-compose down            # Stop services
docker-compose logs backend    # View backend logs
docker-compose exec backend sh # Access backend shell
```

## 📚 Documentation

- [Setup Guide](./docs/SETUP_GUIDE.md) - Detailed installation
- [API Documentation](./docs/API_DOCUMENTATION.md) - All endpoints
- [Testing Guide](./docs/TESTING_GUIDE.md) - Running tests
- [Deployment Guide](./docs/DEPLOYMENT.md) - Production deployment
- [Contributing](./CONTRIBUTING.md) - How to contribute

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Kill process using port 5000
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Kill process using port 3000
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9
```

### MongoDB Connection Failed
```bash
# Check if MongoDB is running
brew services list  # macOS
sudo systemctl status mongod  # Linux

# Restart MongoDB
brew services restart mongodb-community  # macOS
sudo systemctl restart mongod  # Linux
```

### Node Modules Issues
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm install --prefix server
npm install --prefix client
```

## 🔐 Security

Never commit `.env` file with real API keys!

For production:
- Use environment variables
- Enable 2FA
- Use strong passwords
- Rotate API keys regularly
- Keep dependencies updated

## 📞 Support

Need help?
- Check [FAQ](./docs/FAQ.md)
- Review [troubleshooting](./docs/TROUBLESHOOTING.md)
- Open a GitHub issue
- Contact: neuronav@example.com

## 🎉 You're All Set!

Start by exploring the dashboard and testing features. Refer to the documentation when needed.

Happy coding! 🚀

---

**Built by Team Dzio** ❤️
