# NeuroNav - Autism Support Companion Application

A comprehensive MERN stack application designed to help individuals with autism navigate unfamiliar environments, manage sensory overload, and communicate during high-anxiety situations.

## Features

- **User Authentication & Profile Management** - Secure login with sensory preference customization
- **Real-time Sensory Monitoring** - AI-powered environmental analysis using Gemini Flash 2.5
- **Panic/Meltdown Support** - Instant caregiver alerts with location sharing
- **Sensory-Friendly Route Planning** - Google Maps integration for quiet routes
- **Safe Havens Discovery** - Find nearby sensory-friendly spaces
- **Environmental Analysis Dashboard** - Real-time sensory overload detection
- **Calm Score Monitoring** - Continuous anxiety tracking with music therapy
- **Community-Sourced Spaces** - Reddit-like reporting for sensory trigger areas
- **History & Analytics** - Track sensory patterns and trip analytics
- **Data Export** - Download reports for therapists and caregivers

## Tech Stack

- **Frontend**: React 18, Bootstrap 5, Bootstrap Icons, Leaflet Maps
- **Backend**: Node.js, Express.js
- **Database**: MongoDB
- **APIs**: Gemini Flash 2.5, Google Maps, Spotify, Twilio
- **Hosting**: AWS EC2

## Project Structure

```
neuronav/
├── server/                 # Backend
│   ├── config/            # Configuration files
│   ├── models/            # MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Authentication & validation
│   ├── utils/             # Helper functions
│   └── index.js          # Main server file
├── client/                # Frontend
│   ├── public/           # Static files
│   ├── src/
│   │   ├── components/   # React components
│   │   ├── pages/        # Page components
│   │   ├── hooks/        # Custom hooks
│   │   ├── services/     # API services
│   │   ├── styles/       # CSS & styling
│   │   └── App.js        # Main app component
├── docs/                  # Documentation
└── .env.example          # Environment variables template
```

## Installation

### Prerequisites
- Node.js v16+ and npm
- MongoDB
- Git

### Backend Setup

```bash
cd server
npm install
cp .env.example .env
# Edit .env with your API keys
npm run dev
```

### Frontend Setup

```bash
cd client
npm install
npm start
```

## Environment Variables

See `.env.example` for all required environment variables:
- Gemini Flash 2.5 API Key
- Google Maps API Key
- Spotify API Credentials
- Twilio SMS API
- Email Configuration
- MongoDB URI
- AWS Configuration

## API Documentation

API endpoints are organized by feature:
- `/api/auth` - Authentication endpoints
- `/api/users` - User profile management
- `/api/calm-scores` - Sensory monitoring
- `/api/panic-events` - Panic button & alerts
- `/api/routes` - Route planning
- `/api/safe-havens` - Safe haven discovery
- `/api/community-reports` - Community features
- `/api/music-therapy` - Music recommendations
- `/api/history` - History & analytics
- `/api/export` - Data export

## Development

### Running Locally

```bash
npm run dev
```

This starts both backend (port 5000) and frontend (port 3000) concurrently.

### Running Tests

```bash
npm test
```

## Deployment

### AWS EC2 Deployment

See [Deployment Guide](docs/DEPLOYMENT.md) for detailed AWS EC2 setup instructions.

## Team

Built by **Team Dzio**:
- R S Dharaneesh
- Dev Prasath A
- Abinayaa A
- Dharshini R S

## License

MIT License

## Contributing

1. Create feature branch: `git checkout -b feature/feature-name`
2. Commit changes: `git commit -am 'Add feature'`
3. Push to branch: `git push origin feature/feature-name`
4. Submit Pull Request

## Support

For issues, questions, or suggestions, please open an issue on GitHub.
