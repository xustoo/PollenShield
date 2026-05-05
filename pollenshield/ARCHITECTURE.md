# PollenShield Architecture

## High-Level Description

PollenShield is a microservice-based allergy risk prediction and safer route recommendation platform. Clients use a React frontend or Postman to call the API Gateway. The gateway routes requests to independent backend services. Services use REST for synchronous interactions and RabbitMQ for asynchronous event communication.

## Microservice Decomposition

| Service | Responsibility | Port |
| --- | --- | --- |
| API Gateway | Single entry point, request routing, proxy logging, timeouts | 3000 |
| User Profile Service | User registration, login, allergy profile, preferences | 3001 |
| Environmental Data Service | Environmental report storage and environmental events | 3002 |
| Symptom Report Service | Symptom report storage and symptom events | 3003 |
| Allergy Risk Service | Deterministic risk calculation, Redis caching, risk events | 3004 |
| Route Recommendation Service | Mock route generation and safest route selection | 3005 |
| Notification Service | High-risk alert storage and notification read state | 3006 |
| Frontend | React demo console | 5173 |

## Database Per Service

| Service | Database | Reason |
| --- | --- | --- |
| User Profile Service | PostgreSQL | Structured user/profile records |
| Symptom Report Service | PostgreSQL | Structured user-location reports |
| Environmental Data Service | MongoDB | Flexible environmental observation documents |
| Notification Service | MongoDB | Alert/notification documents |
| Allergy Risk Service | Redis | Fast cache for calculated risk scores |
| Route Recommendation Service | None | Stateless route comparison |
| API Gateway | None | Routing only |

## REST Communication

| Source | Target | Purpose |
| --- | --- | --- |
| Frontend/Postman | API Gateway | All client requests |
| API Gateway | User Profile Service | `/api/users/*` |
| API Gateway | Environmental Data Service | `/api/environment/*` |
| API Gateway | Symptom Report Service | `/api/symptoms/*` |
| API Gateway | Allergy Risk Service | `/api/risk/*` |
| API Gateway | Route Recommendation Service | `/api/routes/*` |
| API Gateway | Notification Service | `/api/notifications/*` |
| Route Recommendation Service | Allergy Risk Service | Fetch segment risk scores |

## Event Communication

| Event | Producer | Consumer | Purpose |
| --- | --- | --- | --- |
| `EnvironmentalDataUpdated` | Environmental Data Service | Allergy Risk Service | Trigger risk updates from pollen/weather data |
| `SymptomReportCreated` | Symptom Report Service | Allergy Risk Service | Trigger risk updates from user symptoms |
| `RiskScoreUpdated` | Allergy Risk Service | Future consumers | Announce recalculated risk |
| `HighRiskAreaDetected` | Allergy Risk Service | Notification Service | Store alert notifications |
| `NotificationRequested` | Future producers | Notification Service | Generic notification request event |

## Main Demo Flow

1. Register demo user.
2. Login and fetch profile.
3. Submit environmental report.
4. Submit symptom report.
5. Recalculate risk.
6. Fetch cached risk and forecast.
7. Recommend safer route.
8. Fetch notifications and mark one as read.

## Architecture Diagram

```mermaid
flowchart LR
  F["Frontend React/Vite"] --> G["API Gateway"]
  P["Postman"] --> G
  G --> U["User Profile Service"]
  G --> E["Environmental Data Service"]
  G --> S["Symptom Report Service"]
  G --> R["Allergy Risk Service"]
  G --> RR["Route Recommendation Service"]
  G --> N["Notification Service"]
  U --> PG1[("PostgreSQL")]
  S --> PG2[("PostgreSQL")]
  E --> M1[("MongoDB")]
  N --> M2[("MongoDB")]
  R --> REDIS[("Redis")]
  RR --> R
  E -- "EnvironmentalDataUpdated" --> MQ["RabbitMQ"]
  S -- "SymptomReportCreated" --> MQ
  MQ --> R
  R -- "RiskScoreUpdated / HighRiskAreaDetected" --> MQ
  MQ --> N
```

## Demo Sequence Diagram

```mermaid
sequenceDiagram
  participant Client as Frontend/Postman
  participant Gateway as API Gateway
  participant User as User Profile Service
  participant Env as Environmental Data Service
  participant Symptom as Symptom Report Service
  participant Risk as Allergy Risk Service
  participant Route as Route Recommendation Service
  participant Notify as Notification Service
  participant MQ as RabbitMQ

  Client->>Gateway: POST /api/users/register
  Gateway->>User: register user
  User-->>Gateway: user profile
  Gateway-->>Client: user profile

  Client->>Gateway: POST /api/environment/report
  Gateway->>Env: save environmental report
  Env->>MQ: EnvironmentalDataUpdated
  Env-->>Gateway: saved report
  Gateway-->>Client: saved report

  Client->>Gateway: POST /api/symptoms
  Gateway->>Symptom: save symptom report
  Symptom->>MQ: SymptomReportCreated
  Symptom-->>Gateway: saved report
  Gateway-->>Client: saved report

  Client->>Gateway: POST /api/risk/recalculate
  Gateway->>Risk: calculate and cache risk
  Risk->>MQ: RiskScoreUpdated
  Risk->>MQ: HighRiskAreaDetected
  MQ->>Notify: high risk event
  Notify-->>MQ: notification stored
  Risk-->>Gateway: risk score
  Gateway-->>Client: risk score

  Client->>Gateway: POST /api/routes/recommend
  Gateway->>Route: recommend route
  Route->>Risk: GET segment risks
  Risk-->>Route: risk scores
  Route-->>Gateway: safest route
  Gateway-->>Client: safest route
```

