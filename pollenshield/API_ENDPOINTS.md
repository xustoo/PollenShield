# PollenShield API Endpoints

All client requests should go through the API Gateway:

```text
http://localhost:3000
```

Successful responses generally use:

```json
{
  "success": true,
  "data": {}
}
```

Errors generally use:

```json
{
  "success": false,
  "error": "Readable error message"
}
```

## API Gateway

| Method | Path | Description |
| --- | --- | --- |
| GET | `/health` | Gateway health check |
| GET | `/debug/routes` | Gateway routing table |
| GET | `/debug/config` | Safe gateway config |

Sample response:

```json
{
  "service": "api-gateway",
  "status": "UP"
}
```

## User Profile Service

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/users/register` | Register or update a demo user |
| POST | `/api/users/login` | Simple email/password login |
| GET | `/api/users/:userId/profile` | Get profile without password |
| PUT | `/api/users/:userId/preferences` | Update allergy preferences |

Register body:

```json
{
  "name": "Salih Demo",
  "email": "salih.demo@example.com",
  "password": "123456",
  "allergyTypes": ["tree_pollen", "grass_pollen"],
  "sensitivityLevel": "High",
  "notificationEnabled": true
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "id": "user-id",
    "name": "Salih Demo",
    "email": "salih.demo@example.com",
    "allergyTypes": ["tree_pollen", "grass_pollen"],
    "sensitivityLevel": "High",
    "notificationEnabled": true
  }
}
```

Login body:

```json
{
  "email": "salih.demo@example.com",
  "password": "123456"
}
```

Preferences body:

```json
{
  "allergyTypes": ["tree_pollen", "grass_pollen", "dust"],
  "sensitivityLevel": "High",
  "notificationEnabled": true
}
```

## Environmental Data Service

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/environment/report` | Store environmental report and publish event |
| GET | `/api/environment/location/:locationId` | Get reports by location |
| GET | `/api/environment/latest` | Get latest reports |

Report body:

```json
{
  "locationId": "ankara-bahcelievler",
  "temperature": 24,
  "humidity": 38,
  "windSpeed": 12,
  "pollenIndex": 72
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "report": {
      "locationId": "ankara-bahcelievler",
      "temperature": 24,
      "humidity": 38,
      "windSpeed": 12,
      "pollenIndex": 72
    },
    "event": {
      "eventName": "EnvironmentalDataUpdated"
    }
  }
}
```

## Symptom Report Service

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/symptoms` | Store symptom report and publish event |
| GET | `/api/symptoms/user/:userId` | Get reports by user |
| GET | `/api/symptoms/region/:regionId` | Get reports by region |

Report body:

```json
{
  "userId": "user-id",
  "locationId": "ankara-bahcelievler",
  "regionId": "ankara",
  "symptoms": ["sneezing", "itchy_eyes"],
  "intensity": 7
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "report": {
      "userId": "user-id",
      "locationId": "ankara-bahcelievler",
      "regionId": "ankara",
      "symptoms": ["sneezing", "itchy_eyes"],
      "intensity": 7
    },
    "event": {
      "eventName": "SymptomReportCreated"
    }
  }
}
```

## Allergy Risk Service

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/risk/recalculate` | Calculate and cache risk |
| GET | `/api/risk/location/:locationId` | Get cached risk |
| GET | `/api/risk/forecast/:locationId` | Get simple forecast |

Recalculate body:

```json
{
  "locationId": "ankara-bahcelievler",
  "pollenIndex": 72,
  "humidity": 38,
  "windSpeed": 12,
  "averageSymptomIntensity": 6
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "locationId": "ankara-bahcelievler",
    "score": 74,
    "level": "High",
    "calculatedAt": "2026-05-05T12:00:00.000Z"
  }
}
```

## Route Recommendation Service

| Method | Path | Description |
| --- | --- | --- |
| POST | `/api/routes/recommend` | Recommend lowest-risk route, using Google Routes/Pollen API when enabled |
| GET | `/api/routes/:routeId/risk` | Mock route risk information |

Recommend body:

```json
{
  "startLocation": "Ankara Bahçelievler",
  "destinationLocation": "Gazi University",
  "travelMode": "WALK",
  "useGoogleRoutes": true,
  "candidateLocationIds": [
    "ankara-bahcelievler",
    "ankara-emek",
    "ankara-bestepe"
  ]
}
```

Sample response:

```json
{
  "success": true,
  "data": {
    "recommendedRoute": {
      "routeId": "google-route-1",
      "totalRiskScore": 42,
      "averageRiskScore": 42,
      "estimatedDurationMinutes": 22,
      "distanceMeters": 1800,
      "source": "google",
      "encodedPolyline": "encoded-route-polyline",
      "segments": [
        {
          "locationId": "geo:39.93:32.85",
          "riskScore": 40,
          "lat": 39.93,
          "lng": 32.85,
          "distanceMeters": 240
        }
      ]
    },
    "alternatives": []
  }
}
```

If `GOOGLE_MAPS_API_KEY` is not configured or Google lookup fails, the endpoint safely falls back to mock route alternatives scored with cached Allergy Risk Service data or a neutral score.

## Notification Service

| Method | Path | Description |
| --- | --- | --- |
| GET | `/api/notifications/user/:userId` | Get user and broadcast notifications |
| PUT | `/api/notifications/:notificationId/read` | Mark notification as read |

Sample response:

```json
{
  "success": true,
  "data": [
    {
      "id": "notification-id",
      "userId": "broadcast",
      "title": "High allergy risk detected",
      "message": "High allergy risk detected in ankara-bahcelievler. Risk level: High.",
      "read": false,
      "createdAt": "2026-05-05T12:00:00.000Z"
    }
  ]
}

```
