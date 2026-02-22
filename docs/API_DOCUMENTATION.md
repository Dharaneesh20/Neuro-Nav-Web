# NeuroNav API Documentation

## Base URL
- Development: `http://localhost:5000/api`
- Production: `https://neuronav.example.com/api`

## Authentication
All endpoints (except `/auth/signup` and `/auth/login`) require a JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

---

## Authentication Endpoints

### POST `/auth/signup`
Register a new user account.

**Request:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "phone": "+1234567890",
  "autismLevel": "moderate"
}
```

**Response:** `201 Created`
```json
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49c1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### POST `/auth/login`
Login to existing account.

**Request:**
```json
{
  "email": "john@example.com",
  "password": "securepassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "60d5ec49c1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```

### GET `/auth/verify`
Verify current JWT token and get user info.

**Response:** `200 OK`
```json
{
  "user": {
    "_id": "60d5ec49c1234567890abcde",
    "name": "John Doe",
    "email": "john@example.com",
    "sensoryPreferences": {...},
    "caregiverContacts": [...]
  }
}
```

---

## User Management Endpoints

### GET `/users/profile`
Get current user's profile.

**Response:** `200 OK`
```json
{
  "_id": "60d5ec49c1234567890abcde",
  "name": "John Doe",
  "email": "john@example.com",
  "autismLevel": "moderate",
  "sensoryPreferences": {
    "noiseAvoidance": 75,
    "lightSensitivity": 60,
    "crowdAvoidance": 80,
    "temperatureSensitivity": 50,
    "odorSensitivity": 65
  },
  "triggers": ["loud-crowds", "bright-lights", "strong-odors"],
  "caregiverContacts": [...]
}
```

### PUT `/users/profile`
Update user profile.

**Request:**
```json
{
  "name": "John Doe",
  "phone": "+1234567890",
  "autismLevel": "moderate",
  "sensoryPreferences": {
    "noiseAvoidance": 75,
    "lightSensitivity": 60,
    "crowdAvoidance": 80,
    "temperatureSensitivity": 50,
    "odorSensitivity": 65
  },
  "triggers": ["loud-crowds", "bright-lights", "strong-odors"]
}
```

**Response:** `200 OK`
```json
{
  "message": "Profile updated successfully",
  "user": {...}
}
```

### POST `/users/caregivers`
Add a caregiver contact.

**Request:**
```json
{
  "name": "Jane Doe",
  "phone": "+1234567891",
  "email": "jane@example.com",
  "relationship": "Parent"
}
```

**Response:** `200 OK`
```json
{
  "message": "Caregiver contact added",
  "user": {...}
}
```

### GET `/users/caregivers`
Get all caregiver contacts.

**Response:** `200 OK`
```json
[
  {
    "_id": "60d5ec49c1234567890abcd1",
    "name": "Jane Doe",
    "phone": "+1234567891",
    "email": "jane@example.com",
    "relationship": "Parent"
  }
]
```

---

## Sensory Monitoring Endpoints

### POST `/calm-scores`
Record a new calm score based on environmental data.

**Request:**
```json
{
  "noiseLevel": 85,
  "lightIntensity": 70,
  "crowdingLevel": 8,
  "temperature": 22,
  "odorLevel": 5,
  "environmentDescription": "Busy shopping mall",
  "coordinates": [-74.0060, 40.7128]
}
```

**Response:** `201 Created`
```json
{
  "message": "Calm score recorded",
  "calmScore": {
    "_id": "60d5ec49c1234567890abcd2",
    "userId": "60d5ec49c1234567890abcde",
    "calmScore": 35,
    "noiseLevel": 85,
    "stressors": ["high-noise", "crowding", "bright-lights"],
    "recommendations": ["find-quiet-area", "use-headphones", "take-break"]
  },
  "analysis": {
    "calmScore": 35,
    "stressors": ["high-noise", "crowding", "bright-lights"],
    "recommendations": ["find-quiet-area", "use-headphones", "take-break"]
  }
}
```

### GET `/calm-scores`
Get user's calm score history.

**Query Parameters:**
- `limit` (default: 10)
- `skip` (default: 0)

**Response:** `200 OK`
```json
[
  {
    "_id": "60d5ec49c1234567890abcd2",
    "calmScore": 35,
    "noiseLevel": 85,
    "timestamp": "2024-02-21T10:30:00Z"
  }
]
```

### GET `/calm-scores/stats`
Get calm score statistics.

**Query Parameters:**
- `days` (default: 7)

**Response:** `200 OK`
```json
{
  "count": 14,
  "average": 58,
  "max": 95,
  "min": 15,
  "data": [...]
}
```

---

## Panic/Meltdown Endpoints

### POST `/panic-events/trigger`
Trigger panic/meltdown button - notifies caregivers.

**Request:**
```json
{
  "severity": "panic",
  "coordinates": [-74.0060, 40.7128],
  "address": "123 Main St, New York, NY",
  "triggers": ["loud-crowd", "bright-lights"]
}
```

**Response:** `201 Created`
```json
{
  "message": "Panic event recorded and caregivers notified",
  "panicEvent": {...},
  "notifications": [
    {
      "emailSent": true,
      "smsSent": false
    }
  ]
}
```

### GET `/panic-events`
Get user's panic events history.

**Response:** `200 OK`
```json
[...]
```

### GET `/panic-events/stats/summary`
Get panic event statistics.

**Response:** `200 OK`
```json
{
  "totalEvents": 5,
  "panicCount": 3,
  "meltdownCount": 2,
  "averageDuration": 420,
  "mostCommonTriggers": [
    {"trigger": "crowds", "count": 4},
    {"trigger": "loud-noise", "count": 3}
  ]
}
```

---

## Route Planning Endpoints

### POST `/routes`
Create sensory-friendly route plan.

**Request:**
```json
{
  "origin": {
    "address": "Home",
    "coordinates": [-74.0060, 40.7128]
  },
  "destination": {
    "address": "Work",
    "coordinates": [-74.0070, 40.7135]
  },
  "routes": [
    {
      "title": "Quiet Route",
      "distance": 5000,
      "duration": 600,
      "estimatedSensoryLoad": 40,
      "avoidedTriggers": ["busy-roads", "heavy-traffic"]
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "message": "Route plan created",
  "route": {...}
}
```

### GET `/routes`
Get user's route plans.

**Query Parameters:**
- `limit` (default: 20)
- `skip` (default: 0)
- `completed` (true/false)

**Response:** `200 OK`
```json
[...]
```

### PUT `/routes/:id/complete`
Mark route as completed and record feedback.

**Request:**
```json
{
  "actualSensoryLoad": 45,
  "feedback": "Route was helpful but encountered unexpected crowds"
}
```

**Response:** `200 OK`
```json
{
  "message": "Route completed",
  "route": {...}
}
```

---

## Safe Havens Endpoints

### POST `/safe-havens`
Add a new safe haven (community addition).

**Request:**
```json
{
  "name": "Central Library",
  "description": "Quiet reading space",
  "type": "library",
  "location": {
    "coordinates": [-74.0070, 40.7135],
    "address": "123 Main St",
    "city": "New York",
    "country": "USA"
  },
  "sensoryFeatures": {
    "quietZone": true,
    "lowLighting": true,
    "isolatedArea": true
  }
}
```

**Response:** `201 Created`
```json
{
  "message": "Safe haven added",
  "safeHaven": {...}
}
```

### GET `/safe-havens/nearby`
Get nearby safe havens.

**Query Parameters:**
- `longitude` (required)
- `latitude` (required)
- `distance` (default: 5000, in meters)

**Response:** `200 OK`
```json
[...]
```

### GET `/safe-havens`
Get all safe havens with filters.

**Query Parameters:**
- `type` (quiet-zone, library, park, cafe, etc.)
- `city`
- `limit` (default: 50)
- `skip` (default: 0)

**Response:** `200 OK`
```json
[...]
```

### POST `/safe-havens/:id/review`
Add review to safe haven.

**Request:**
```json
{
  "rating": 5,
  "comment": "Very quiet and peaceful environment"
}
```

**Response:** `200 OK`
```json
{
  "message": "Review added",
  "safeHaven": {...}
}
```

---

## Community Reports Endpoints

### POST `/community-reports`
Create community report about sensory trigger area.

**Request:**
```json
{
  "title": "Loud construction near Main St",
  "description": "Heavy machinery noise from 9 AM to 5 PM daily",
  "reportType": "sound-area",
  "location": {
    "coordinates": [-74.0060, 40.7128],
    "address": "Main St, New York"
  },
  "severity": "high",
  "triggers": ["loud-noise", "vibrations"]
}
```

**Response:** `201 Created`
```json
{
  "message": "Report created successfully",
  "report": {...}
}
```

### GET `/community-reports`
Get community reports with filters.

**Query Parameters:**
- `reportType`
- `status` (pending, verified, resolved)
- `limit` (default: 20)
- `skip` (default: 0)

**Response:** `200 OK`
```json
[...]
```

### POST `/community-reports/:id/vote`
Vote on community report (upvote/downvote).

**Request:**
```json
{
  "voteType": "upvote"
}
```

**Response:** `200 OK`
```json
{
  "message": "upvote recorded",
  "upvotes": 42,
  "downvotes": 3
}
```

### POST `/community-reports/:id/comment`
Add comment to report.

**Request:**
```json
{
  "text": "I also experience this issue at similar times"
}
```

**Response:** `200 OK`
```json
{
  "message": "Comment added",
  "report": {...}
}
```

---

## Music Therapy Endpoints

### POST `/music-therapy`
Record music therapy session.

**Request:**
```json
{
  "spotifyTrackId": "spotify:track:123",
  "trackName": "Calm Piano",
  "artistName": "Relaxation Music",
  "calmScoreBefore": 35,
  "calmScoreAfter": 70,
  "duration": 1800,
  "effectiveness": 5,
  "mood": "anxious"
}
```

**Response:** `201 Created`
```json
{
  "message": "Music therapy session recorded",
  "session": {...}
}
```

### GET `/music-therapy`
Get music therapy history.

**Response:** `200 OK`
```json
[...]
```

### GET `/music-therapy/stats/summary`
Get music therapy statistics.

**Response:** `200 OK`
```json
{
  "totalSessions": 25,
  "averageEffectiveness": 4.5,
  "averageCalmImprovement": 35,
  "topTracks": [...],
  "topMoods": [...]
}
```

---

## History & Analytics Endpoints

### GET `/history`
Get activity history.

**Query Parameters:**
- `type` (calm-score, panic-event, route-completed, etc.)
- `days` (default: 90)
- `limit` (default: 50)
- `skip` (default: 0)

**Response:** `200 OK`
```json
[...]
```

### GET `/history/analytics/summary`
Get activity analytics summary.

**Query Parameters:**
- `days` (default: 30)

**Response:** `200 OK`
```json
{
  "totalActivities": 145,
  "typeBreakdown": {
    "calm-score": 50,
    "panic-event": 5,
    "route-completed": 20
  },
  "averageCalmScore": 62,
  "period": "Last 30 days"
}
```

---

## Data Export Endpoints

### GET `/export/pdf`
Export sensory data as PDF.

**Query Parameters:**
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)

**Response:** PDF file download

### GET `/export/excel`
Export sensory data as Excel.

**Query Parameters:**
- `startDate` (optional, ISO format)
- `endDate` (optional, ISO format)

**Response:** Excel file download

---

## Error Responses

### 400 Bad Request
```json
{
  "error": "Invalid input data"
}
```

### 401 Unauthorized
```json
{
  "error": "No token provided"
}
```

### 404 Not Found
```json
{
  "error": "Resource not found"
}
```

### 500 Internal Server Error
```json
{
  "error": "Internal server error"
}
```

---

## Pagination

All list endpoints support pagination:
- `limit`: Number of items to return (default: 20)
- `skip`: Number of items to skip (default: 0)

Example: `GET /calm-scores?limit=50&skip=100`

---

## Dates and Timestamps

All timestamps are returned in ISO 8601 format (UTC):
```
2024-02-21T10:30:00Z
```

When providing dates in requests, use ISO 8601 format.

---

For more information, visit the [NeuroNav GitHub Repository](https://github.com/neuronav).
