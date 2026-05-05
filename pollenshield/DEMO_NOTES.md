# PollenShield Demo Notes

## Elevator Pitch

PollenShield is a hyperlocal allergy risk prediction and safer route recommendation platform. It combines user allergy profiles, environmental pollen indicators, symptom reports, deterministic risk scoring, route comparison, and notification delivery in a microservice-based architecture.

## 2-Minute Project Explanation

PollenShield helps allergy-sensitive users understand local allergy exposure and choose safer walking routes. A user creates an allergy profile, environmental pollen/weather observations are reported by location, and users can submit symptom reports. The Allergy Risk Service calculates a deterministic risk score from pollen index, humidity, wind speed, and symptom intensity, then stores that score in Redis. The Route Recommendation Service compares route alternatives by calling the Risk Service, and the Notification Service stores high-risk alerts when the Risk Service publishes events through RabbitMQ.

Architecturally, the system uses an API Gateway as the only client entry point. Each backend service has a single responsibility and owns its own persistence choice. PostgreSQL is used for structured profile and symptom records, MongoDB is used for environmental and notification documents, Redis is used for risk-score caching, and RabbitMQ is used for asynchronous event communication.

## Microservices

- API Gateway: single public entry point for frontend, Postman, and curl clients.
- User Profile Service: stores users, allergy types, sensitivity level, and notification preference in PostgreSQL.
- Environmental Data Service: stores pollen/weather observations in MongoDB and publishes environmental update events.
- Symptom Report Service: stores allergy symptom reports in PostgreSQL and publishes symptom report events.
- Allergy Risk Service: calculates deterministic allergy risk, caches scores in Redis, consumes environmental/symptom events, and publishes risk events.
- Route Recommendation Service: creates mock route alternatives and calls the risk service to choose the lowest exposure route.
- Notification Service: consumes high-risk events and stores notifications in MongoDB.
- Frontend: React + TypeScript demo console that calls only the API Gateway.

## End-to-End Demo Steps

1. Start the stack with `docker compose up --build`.
2. Open the frontend at `http://localhost:5173`.
3. Register a demo user.
4. Fetch the allergy profile summary.
5. Submit environmental data for `ankara-bahcelievler`.
6. Submit a symptom report for the registered user.
7. Recalculate risk for the same location.
8. Fetch the cached risk and forecast.
9. Request a route recommendation.
10. Fetch notifications and mark one as read if available.

## 5-Minute Demo Script

1. Show `docker compose up --build` and explain that the full distributed system starts with one command.
2. Open `http://localhost:5173` and show the Project Overview cards.
3. Open System Status and check the gateway health/routing table.
4. Open Run Demo Flow and click the button. Explain each step as it turns from Pending to Success.
5. Open Allergy Risk Calculation and point to the numeric score, level, and 0-100 visual bar.
6. Open Route Recommendation and show the recommended route versus alternatives.
7. Open Notifications and show the high-risk alert card and read/unread state.
8. Briefly open `ARCHITECTURE.md` or the README links if the instructor asks for diagrams/endpoints.

## What To Say During Demo

- "The frontend never talks directly to individual services. It only calls the API Gateway."
- "User and symptom data are persisted in PostgreSQL because they are relational records."
- "Environmental data and notifications use MongoDB because they are document-like event records."
- "Risk scores are cached in Redis using keys like `risk:ankara-bahcelievler`."
- "RabbitMQ decouples data-producing services from risk and notification consumers."
- "The route service demonstrates synchronous REST communication by calling the risk service."
- "The system is independently deployable by service and runnable together with Docker Compose."

## Example Risk Calculation

For the demo values:

- pollenIndex = 72, so pollen contribution is `72 * 0.5 = 36`
- humidity = 38, so humidity risk is `+5`
- windSpeed = 12, so wind risk is `+15`
- averageSymptomIntensity = 6, so symptom risk is `6 * 3 = 18`

Final score:

```text
36 + 5 + 15 + 18 = 74
```

Risk level:

```text
74 = High
```

## Microservice Architecture Requirements

- At least four services: PollenShield has seven backend microservices plus a frontend and infrastructure services.
- Single responsibility: each service owns one business capability.
- REST communication: frontend to gateway, gateway to services, route service to risk service.
- Event-based communication: environmental and symptom events feed risk scoring; high-risk events feed notifications.
- Independent data stores: PostgreSQL, MongoDB, and Redis are used where appropriate.
- Docker runnable: `docker compose up --build` starts the complete stack.
- Not generic CRUD: the project implements allergy risk scoring, hyperlocal reporting, route recommendation, and notifications.

## Requirement Checklist

| Requirement | How PollenShield Satisfies It |
| --- | --- |
| Original software solution | Hyperlocal allergy risk and safer walking routes |
| At least 4 microservices | 7 backend microservices |
| Single responsibility per service | Each service owns one bounded capability |
| REST communication | Gateway routes REST APIs; Route Service calls Risk Service |
| Async event communication | RabbitMQ events connect reports, risk, and notifications |
| Docker runnable | Docker Compose starts services and infrastructure |
| Clear endpoint structure | See `API_ENDPOINTS.md` and Postman collection |

## Endpoint Checklist

- User Profile: register, login, get profile, update preferences
- Environmental Data: create report, get by location, get latest
- Symptom Report: create report, get by user, get by region
- Allergy Risk: recalculate, get risk, get forecast
- Route Recommendation: recommend route, get route risk
- Notification: get notifications, mark as read
- Debug/Health: gateway health, service health, debug routes/config

## Docker Checklist

- `docker compose up --build` starts the complete stack.
- Frontend runs on `http://localhost:5173`.
- API Gateway runs on `http://localhost:3000`.
- RabbitMQ UI runs on `http://localhost:15672`.
- Health script: `./scripts/health-check.sh`.
- Demo seed script: `./scripts/demo-seed.sh`.

## Event Communication Explanation

Environmental and symptom services do not directly call the notification service. Instead, they publish events to RabbitMQ. The Allergy Risk Service consumes those events and can update cached risk scores. When a risk score is High or Critical, the Risk Service publishes `HighRiskAreaDetected`. The Notification Service consumes that event and stores an alert. This keeps producers and consumers decoupled.

## Possible Instructor Questions

### Why is this a microservice architecture?

The system is split into independent services with separate responsibilities, ports, Docker images, and data ownership. They communicate through REST and RabbitMQ rather than being one monolithic backend.

### Why did you use RabbitMQ?

RabbitMQ supports asynchronous event-based communication. Environmental and symptom reports can trigger risk/notification workflows without tightly coupling those services.

### Which services are independent?

User Profile, Environmental Data, Symptom Report, Allergy Risk, Route Recommendation, Notification, and API Gateway are separate services. They can be built and run as separate containers.

### What happens if Notification Service fails?

Core reporting and risk calculation can still work. High-risk notification processing is isolated, and RabbitMQ can preserve events depending on queue durability and consumer availability.

### How does Route Recommendation Service use Risk Service?

It generates mock route alternatives, calls `GET /api/risk/location/:locationId` for segment locations, sums risk scores, and returns the route with the lowest total risk.

### Why use Redis?

Risk scores are read frequently by route and client flows. Redis provides fast key-value caching with keys like `risk:ankara-bahcelievler`.

### Why use both PostgreSQL and MongoDB?

PostgreSQL fits structured relational records like users and symptom reports. MongoDB fits flexible document-style records like environmental observations and notifications.

### How does the system satisfy originality?

It is not a generic CRUD system. It combines environmental data, symptom reports, deterministic risk scoring, route recommendation, event-driven notifications, and a hyperlocal allergy use case.
