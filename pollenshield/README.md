# PollenShield

PollenShield is a hyperlocal allergy risk prediction and safe route recommendation platform for the CENG-442 Microservice Architecture course.

Team:

- Salih Kırlıoğlu - 21118080019
- Başak Su Gedik - 21118080072

The system helps allergy-sensitive users manage allergy profiles, report symptoms, collect local environmental data, calculate allergy risk, receive high-risk notifications, and request safer walking routes.

## Project Summary

PollenShield is an original microservice-based software solution. It is not a generic CRUD app: the system models a hyperlocal allergy workflow with environmental reports, symptom reports, deterministic allergy risk scoring, safer route recommendation, and event-driven notifications.

## Architecture Overview

- Clients use the React frontend, Postman, or curl.
- All client traffic goes through the API Gateway.
- Backend services are independent containers with single responsibilities.
- REST is used for synchronous request/response communication.
- RabbitMQ is used for asynchronous event communication.
- PostgreSQL, MongoDB, and Redis are used for service-specific storage needs.
- Docker Compose runs the complete stack.

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md): service decomposition, data stores, REST/event communication, Mermaid diagrams.
- [API_ENDPOINTS.md](./API_ENDPOINTS.md): endpoint list with sample request and response bodies.
- [DEMO_NOTES.md](./DEMO_NOTES.md): presentation script, requirement checklist, instructor Q&A.

## Implemented Features

- Real PostgreSQL connection and startup table creation for User Profile Service.
- Real PostgreSQL connection and startup table creation for Symptom Report Service.
- Real MongoDB connection and Mongoose model for Environmental Data Service.
- Real MongoDB connection and Mongoose model for Notification Service.
- Redis cache helper and deterministic risk score calculation in Allergy Risk Prediction Service.
- RabbitMQ durable queue publishers and consumers for event-based communication.
- API Gateway routing for all service endpoint groups.
- Basic working endpoint logic with validation and error responses.

## Frontend Demo

- React + TypeScript + Vite frontend under `frontend/`.
- Single-page demo console with sidebar navigation and guided demo flow.
- Browser requests go only through the API Gateway at `http://localhost:3000`.
- Frontend runs at `http://localhost:5173`.

## Services

| Service | Responsibility | Storage | Port |
| --- | --- | --- | --- |
| Frontend | React demo UI for the presentation flow | None | 5173 |
| API Gateway | Single entry point and request routing | None | 3000 |
| User Profile Service | Users, allergy types, sensitivity, notification preferences | PostgreSQL | 3001 |
| Environmental Data Service | Temperature, humidity, wind, pollen observations | MongoDB | 3002 |
| Symptom Report Service | User symptom reports by location and region | PostgreSQL | 3003 |
| Allergy Risk Prediction Service | Risk scoring, Redis cache, risk events | Redis | 3004 |
| Route Recommendation Service | Mock route alternatives and safest route selection | None | 3005 |
| Notification Service | High-risk and requested notifications | MongoDB | 3006 |

Infrastructure:

- PostgreSQL: `5432`
- MongoDB: `27017`
- Redis: `6379`
- RabbitMQ: `5672`
- RabbitMQ Management UI: `15672`

## Run

```bash
cd pollenshield
docker compose up --build
```

Open the frontend:

```text
http://localhost:5173
```

The frontend uses the API Gateway:

```text
http://localhost:3000
```

## Full Demo Flow

The complete class demo flow is:

1. Register User
2. Login User
3. Get User Profile
4. Create Environmental Report
5. Create Symptom Report
6. Recalculate Risk
7. Get Risk By Location
8. Get Risk Forecast
9. Recommend Route
10. Get User Notifications
11. Mark Notification As Read

You can run the flow from the frontend, Postman, or curl scripts.

## Demo Scripts

Run health checks:

```bash
./scripts/health-check.sh
```

Run the seeded demo flow through the API Gateway:

```bash
./scripts/demo-seed.sh
```

The seed script uses:

- `salih.demo@example.com`
- `ankara-bahcelievler`
- `ankara`
- `home`
- `gazi-university`

If you want to target a different gateway URL:

```bash
BASE_URL=http://localhost:3000 ./scripts/demo-seed.sh
```

RabbitMQ Management UI:

- URL: `http://localhost:15672`
- Username: `guest`
- Password: `guest`

## Health Checks

```bash
curl -v http://localhost:3000/health
curl http://localhost:3001/health
curl http://localhost:3002/health
curl http://localhost:3003/health
curl http://localhost:3004/health
curl http://localhost:3005/health
curl http://localhost:3006/health
```

## Request/Response Debugging

The API Gateway logs each proxied request with method, original URL, target service, and response status. Proxy requests have a `10s` timeout. If a service is unavailable or times out, the gateway returns JSON instead of hanging:

```json
{
  "error": "Service timeout",
  "service": "user-profile-service"
}
```

Useful debug endpoints:

```bash
curl -v http://localhost:3000/debug/config
curl -v http://localhost:3000/debug/routes
curl -v http://localhost:3001/debug/config
curl -v http://localhost:3002/debug/config
curl -v http://localhost:3003/debug/config
curl -v http://localhost:3004/debug/config
curl -v http://localhost:3005/debug/config
curl -v http://localhost:3006/debug/config
```

## Postman Testing

Postman files are located in:

- `postman/PollenShield.postman_collection.json`
- `postman/PollenShield.local.postman_environment.json`

Before using Postman, start the full stack:

```bash
docker compose up --build
```

Import steps:

1. Open Postman.
2. Click `Import`.
3. Import `postman/PollenShield.postman_collection.json`.
4. Import `postman/PollenShield.local.postman_environment.json`.
5. Select the `PollenShield Local` environment from the environment dropdown.

The environment uses:

```text
baseUrl = http://localhost:3000
```

Recommended request order:

1. `Health Checks / Gateway Health`
2. `User Profile Service / Register User`
3. `User Profile Service / Login User`
4. `User Profile Service / Get User Profile`
5. `Environmental Data Service / Create Environmental Report`
6. `Symptom Report Service / Create Symptom Report`
7. `Allergy Risk Service / Recalculate Risk`
8. `Allergy Risk Service / Get Risk By Location`
9. `Allergy Risk Service / Get Risk Forecast`
10. `Route Recommendation Service / Recommend Route`
11. `Notification Service / Get User Notifications`
12. `Notification Service / Mark Notification As Read`

For classroom demos, use the `Full Demo Flow` folder and run the requests from top to bottom. The collection automatically saves useful variables such as `userId`, `routeId`, and `notificationId` when responses include them.

Presentation notes are available in `DEMO_NOTES.md`.

## Troubleshooting

### Docker Not Running

Start Docker Desktop before running:

```bash
docker compose up --build
```

### Port Already In Use

If a port is occupied, stop the old process or container:

```bash
docker compose down
```

Common ports:

- Frontend: `5173`
- API Gateway: `3000`
- PostgreSQL: `5432`
- MongoDB: `27017`
- Redis: `6379`
- RabbitMQ: `5672`
- RabbitMQ UI: `15672`

### RabbitMQ Not Ready Yet

Wait a few seconds and retry the request. The services include startup retries and publish timeouts, but RabbitMQ can still need a moment after container creation.

### Database Connection Issues

Check container logs:

```bash
docker compose logs user-profile-service
docker compose logs symptom-report-service
docker compose logs environmental-data-service
docker compose logs notification-service
```

Then run:

```bash
./scripts/health-check.sh
```

### API Gateway Proxy Issues

Use debug endpoints:

```bash
curl -v http://localhost:3000/debug/routes
curl -v http://localhost:3000/debug/config
```

The gateway logs each proxied request with method, original URL, target service, and response status.

## Main Endpoint Flow

Use the API Gateway on port `3000` for client requests.

The same flow can also be demonstrated in the browser at `http://localhost:5173`.

Frontend demo order:

1. Register user.
2. Open Allergy Profile Summary and fetch the profile.
3. Add an environmental report for `ankara-bahcelievler`.
4. Add a symptom report for the registered user.
5. Recalculate allergy risk.
6. View the risk score.
7. Request a safer route recommendation.
8. View notifications for `broadcast` or the registered user.

### 1. Register User

```bash
curl -v -X POST http://localhost:3000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Salih",
    "email": "salih@example.com",
    "password": "123456",
    "allergyTypes": ["tree_pollen", "grass_pollen"],
    "sensitivityLevel": "High",
    "notificationEnabled": true
  }'
```

### 2. Login

```bash
curl -v -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "salih@example.com",
    "password": "123456"
  }'
```

### 3. Add Environmental Report

```bash
curl -v -X POST http://localhost:3000/api/environment/report \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "ankara-bahcelievler",
    "temperature": 24,
    "humidity": 38,
    "windSpeed": 12,
    "pollenIndex": 72
  }'
```

This stores the report in MongoDB and publishes `EnvironmentalDataUpdated`.

### 4. Add Symptom Report

Replace `user-id-from-register-response` with a real returned user id.

```bash
curl -v -X POST http://localhost:3000/api/symptoms \
  -H "Content-Type: application/json" \
  -d '{
    "userId": "user-id-from-register-response",
    "locationId": "ankara-bahcelievler",
    "regionId": "ankara",
    "symptoms": ["sneezing", "itchy_eyes"],
    "intensity": 7
  }'
```

This stores the report in PostgreSQL and publishes `SymptomReportCreated`.

### 5. Recalculate Risk

```bash
curl -v -X POST http://localhost:3000/api/risk/recalculate \
  -H "Content-Type: application/json" \
  -d '{
    "locationId": "ankara-bahcelievler",
    "pollenIndex": 72,
    "humidity": 38,
    "windSpeed": 12,
    "averageSymptomIntensity": 6
  }'
```

This calculates the deterministic allergy risk score, stores it in Redis as `risk:ankara-bahcelievler`, publishes `RiskScoreUpdated`, and publishes `HighRiskAreaDetected` when the score is High or Critical.

### 6. Get Risk

```bash
curl -v http://localhost:3000/api/risk/location/ankara-bahcelievler
```

### 7. Get Forecast

```bash
curl -v http://localhost:3000/api/risk/forecast/ankara-bahcelievler
```

### 8. Request Route Recommendation

```bash
curl -v -X POST http://localhost:3000/api/routes/recommend \
  -H "Content-Type: application/json" \
  -d '{
    "startLocation": "home",
    "destinationLocation": "gazi-university",
    "candidateLocationIds": [
      "ankara-bahcelievler",
      "ankara-emek",
      "ankara-bestepe"
    ]
  }'
```

### 9. Get Notifications

```bash
curl -v http://localhost:3000/api/notifications/user/broadcast
```

To mark a notification as read:

```bash
curl -v -X PUT http://localhost:3000/api/notifications/notification-id/read
```

## Events

| Event | Published By | Consumed By |
| --- | --- | --- |
| `EnvironmentalDataUpdated` | Environmental Data Service | Allergy Risk Prediction Service |
| `SymptomReportCreated` | Symptom Report Service | Allergy Risk Prediction Service |
| `RiskScoreUpdated` | Allergy Risk Prediction Service | Planned downstream services |
| `HighRiskAreaDetected` | Allergy Risk Prediction Service | Notification Service |
| `NotificationRequested` | Planned producers | Notification Service |

Every RabbitMQ event payload has this structure:

```json
{
  "eventName": "EnvironmentalDataUpdated",
  "timestamp": "2026-05-05T12:00:00.000Z",
  "data": {}
}
```

## Risk Formula

```text
baseScore =
  pollenIndex * 0.5
  + humidityRisk
  + windRisk
  + symptomRisk
```

Humidity risk:

- humidity `< 30`: `+15`
- humidity `30-60`: `+5`
- humidity `> 60`: `+10`

Wind risk:

- wind speed `< 5`: `+5`
- wind speed `5-20`: `+15`
- wind speed `> 20`: `+10`

Symptom risk:

- average symptom intensity `* 3`
- otherwise `0`

Final score is clamped between `0` and `100`.

Risk levels:

- `0-25`: Low
- `26-50`: Medium
- `51-75`: High
- `76-100`: Critical
