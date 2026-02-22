# NeuroNav Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2026-02-21

### Added

#### Phase 1: Project Setup & Infrastructure
- Initial project structure with MERN stack
- MongoDB connection and database initialization
- All API models and schemas (User, CalmScore, PanicEvent, Route, SafeHaven, CommunityReport, MusicTherapy, HistoryEntry)
- Backend server with Express.js
- Environment configuration system
- JWT authentication infrastructure

#### Phase 2: Authentication & User Profile Management
- User registration and login endpoints
- JWT-based authentication
- User profile management with sensory preferences
- Caregiver contact management system
- Password security with bcrypt hashing

#### Phase 3: Sensory Monitoring & Calm Score Analysis
- Gemini Flash 2.5 API integration
- Real-time calm score calculation (0-100 scale)
- Environmental data analysis
- Calm score history tracking
- Statistical analysis endpoints

#### Phase 4: Panic/Meltdown Support Button
- Panic/meltdown button functionality
- Instant caregiver notifications (email & SMS)
- Live location sharing via Google Maps API
- Automatic music playback integration
- Panic event logging and history

#### Phase 5: Sensory-Friendly Route Planning
- Google Maps API integration
- Route optimization algorithm
- Sensory trigger avoidance
- Multiple route options
- Route analytics and history

#### Phase 6: Safe Havens Discovery
- Safe haven database schema
- Google Maps markers integration
- Filtering by type and location
- Community-added safe havens
- Review and rating system

#### Phase 7: Environmental Analysis Dashboard
- Real-time environmental monitoring
- Gemini-powered sensory overload detection
- Visual alerts and recommendations
- Environmental trend analysis

#### Phase 8: Calm Score Monitoring with Music Therapy
- Continuous calm score tracking
- Spotify API integration via WebView
- Music therapy recommendations
- Effectiveness rating system
- Mood-based playlist suggestions

#### Phase 9: Community-Sourced Spaces
- Reddit-like reporting interface
- Community voting system (upvote/downvote)
- Sensory trigger heat maps
- Report moderation system
- Discussion threads and comments

#### Phase 10: History Tracking & Analytics
- Comprehensive activity history
- Sensory trigger pattern detection
- Trip analytics
- Timeline visualization
- Data export to PDF/Excel

#### Phase 11: Sensory Data Export
- PDF report generation
- Excel export functionality
- Customizable date ranges
- Therapist sharing mechanism

#### Frontend
- React 18 setup and configuration
- API service layer with axios
- Custom authentication hooks
- Login and signup pages
- Blue & white color theme
- Bootstrap icons integration
- Global styling with CSS variables
- Responsive design framework

#### Documentation
- Comprehensive API documentation
- Setup and installation guide
- Testing guidelines
- Deployment guide
- Contributing guidelines
- README with project overview

### Infrastructure
- Git repository initialization
- .env configuration system
- Security middleware (Helmet, Rate limiting)
- CORS configuration
- Error handling middleware
- Pre-commit hooks
- Development setup scripts

### Dependencies
- Backend: Express.js, MongoDB, JWT, Nodemailer, Twilio, Axios
- Frontend: React, Bootstrap, Bootstrap Icons, Leaflet, Chart.js
- Build Tools: npm, Webpack (via react-scripts)

---

## Future Releases

### Planned for v1.1
- Push notifications
- In-app chat with caregivers
- Advanced AI training for calm score prediction
- Offline mode support
- Mobile app (React Native)

### Planned for v1.2
- Integration with FitBit/Apple Health
- Advanced therapist dashboard
- Group support features
- Wearable device support

### Planned for v2.0
- Machine learning for pattern recognition
- Advanced biometric integration
- Multi-language support
- Enterprise licensing

---

## Known Issues

- [ ] Geospatial queries require MongoDB geospatial index
- [ ] Spotify integration requires browser WebView
- [ ] Email sending requires SMTP configuration

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on how to contribute to NeuroNav.

## License

This project is licensed under the MIT License - see LICENSE file for details.

---

**Built by Team Dzio**
- R S Dharaneesh
- Dev Prasath A
- Abinayaa A
- Dharshini R S
