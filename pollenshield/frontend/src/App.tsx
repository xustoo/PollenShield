import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:3000";

type RequestState = {
  loading: boolean;
  error: string | null;
  data: unknown;
};

type UserProfile = {
  id: string;
  name: string;
  email: string;
  allergyTypes: string[];
  sensitivityLevel: string;
  notificationEnabled: boolean;
  createdAt?: string;
};

type RiskLevel = "Low" | "Medium" | "High" | "Critical";

type RiskScore = {
  locationId: string;
  score: number;
  level: RiskLevel;
  calculatedAt: string;
};

type RouteRecommendation = {
  routeId: string;
  startLocation: string;
  destinationLocation: string;
  totalRiskScore: number;
  averageRiskScore: number;
  estimatedDurationMinutes: number;
  distanceMeters: number;
  encodedPolyline?: string;
  source: "google" | "mock";
  segments: Array<{ locationId: string; riskScore: number; lat?: number; lng?: number; distanceMeters?: number }>;
};

type RouteResponse = {
  recommendedRoute: RouteRecommendation;
  alternatives: RouteRecommendation[];
};

type NotificationItem = {
  id: string;
  userId: string;
  title: string;
  message: string;
  read: boolean;
  createdAt: string;
  locationId?: string;
  riskLevel?: string;
};

type DemoStep = {
  key: string;
  title: string;
  status: "Pending" | "Running" | "Success" | "Failed";
  response?: unknown;
  error?: string;
};

const demoData = {
  name: "Salih Demo",
  email: "salih.demo@example.com",
  password: "123456",
  allergyTypes: ["tree_pollen", "grass_pollen"],
  sensitivityLevel: "High",
  notificationEnabled: true,
  locationId: "ankara-bahcelievler",
  regionId: "ankara",
  temperature: 24,
  humidity: 38,
  windSpeed: 12,
  pollenIndex: 72,
  symptoms: ["sneezing", "itchy_eyes"],
  intensity: 7,
  averageSymptomIntensity: 6,
  startLocation: "home",
  destinationLocation: "gazi-university",
  googleStartLocation: "Ankara Bahçelievler",
  googleDestinationLocation: "Gazi University",
  candidateLocationIds: ["ankara-bahcelievler", "ankara-emek", "ankara-bestepe"]
};

const emptyState: RequestState = {
  loading: false,
  error: null,
  data: null
};

const splitCommaText = (value: string): string[] =>
  value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const requestJson = async <T,>(path: string, options: RequestInit = {}): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const text = await response.text();
  const body = text
    ? (() => {
        try {
          return JSON.parse(text);
        } catch {
          return { message: text };
        }
      })()
    : null;

  if (!response.ok) {
    throw new Error(body?.error || body?.message || `Request failed with status ${response.status}`);
  }

  if (body && typeof body === "object" && "success" in body && "data" in body) {
    return body.data as T;
  }

  return body as T;
};

const JsonCard = ({ value }: { value: unknown }) => {
  if (!value) return null;
  return <pre className="json-card">{JSON.stringify(value, null, 2)}</pre>;
};

const ResultPanel = ({ state }: { state: RequestState }) => (
  <div className="result-panel">
    {state.loading && <div className="notice info">Loading...</div>}
    {state.error && <div className="notice error">{state.error}</div>}
    <JsonCard value={state.data} />
  </div>
);

const riskClass = (level?: string) => `risk-pill ${level ? level.toLowerCase() : "unknown"}`;

const riskExplanation = (level?: string) => {
  switch (level) {
    case "Low":
      return "Low exposure. Outdoor activity is generally comfortable for most allergy-sensitive users.";
    case "Medium":
      return "Moderate exposure. Sensitive users should monitor symptoms and consider precautions.";
    case "High":
      return "High exposure. Safer routes and allergy precautions are recommended.";
    case "Critical":
      return "Critical exposure. Strong warning: avoid unnecessary outdoor exposure if sensitive.";
    default:
      return "Run a risk calculation to see the allergy exposure level.";
  }
};

const statusClass = (status: DemoStep["status"]) => `step-status ${status.toLowerCase()}`;

function App() {
  const [activeSection, setActiveSection] = useState("overview");
  const [userId, setUserId] = useState(() => localStorage.getItem("pollenshieldUserId") || "");
  const [profile, setProfile] = useState<UserProfile | null>(() => {
    const saved = localStorage.getItem("pollenshieldUserProfile");
    return saved ? (JSON.parse(saved) as UserProfile) : null;
  });

  const [registerForm, setRegisterForm] = useState({
    name: demoData.name,
    email: demoData.email,
    password: demoData.password,
    allergyTypes: demoData.allergyTypes.join(", "),
    sensitivityLevel: demoData.sensitivityLevel,
    notificationEnabled: demoData.notificationEnabled
  });

  const [environmentForm, setEnvironmentForm] = useState({
    locationId: demoData.locationId,
    temperature: String(demoData.temperature),
    humidity: String(demoData.humidity),
    windSpeed: String(demoData.windSpeed),
    pollenIndex: String(demoData.pollenIndex)
  });

  const [symptomForm, setSymptomForm] = useState({
    userId,
    locationId: demoData.locationId,
    regionId: demoData.regionId,
    symptoms: demoData.symptoms.join(", "),
    intensity: String(demoData.intensity)
  });

  const [riskForm, setRiskForm] = useState({
    locationId: demoData.locationId,
    pollenIndex: String(demoData.pollenIndex),
    humidity: String(demoData.humidity),
    windSpeed: String(demoData.windSpeed),
    averageSymptomIntensity: String(demoData.averageSymptomIntensity)
  });

  const [routeForm, setRouteForm] = useState({
    startLocation: demoData.googleStartLocation,
    destinationLocation: demoData.googleDestinationLocation,
    travelMode: "WALK",
    useGoogleRoutes: true,
    candidateLocationIds: demoData.candidateLocationIds.join(", ")
  });

  const [notificationUserId, setNotificationUserId] = useState(userId || "broadcast");
  const [systemStatus, setSystemStatus] = useState<RequestState>(emptyState);
  const [registerState, setRegisterState] = useState<RequestState>(emptyState);
  const [profileState, setProfileState] = useState<RequestState>(emptyState);
  const [environmentState, setEnvironmentState] = useState<RequestState>(emptyState);
  const [symptomState, setSymptomState] = useState<RequestState>(emptyState);
  const [riskState, setRiskState] = useState<RequestState>(emptyState);
  const [routeState, setRouteState] = useState<RequestState>(emptyState);
  const [notificationState, setNotificationState] = useState<RequestState>(emptyState);
  const [demoRunning, setDemoRunning] = useState(false);
  const [demoSteps, setDemoSteps] = useState<DemoStep[]>([
    "Register demo user",
    "Create environmental report",
    "Create symptom report",
    "Recalculate risk",
    "Get risk by location",
    "Recommend route",
    "Get notifications"
  ].map((title, index) => ({ key: `step-${index + 1}`, title, status: "Pending" })));

  const currentRisk = riskState.data as RiskScore | null;
  const routeResult = routeState.data as RouteResponse | null;
  const notifications = Array.isArray(notificationState.data) ? (notificationState.data as NotificationItem[]) : [];

  const sections = useMemo(
    () => [
      ["overview", "Project Overview"],
      ["status", "System Status"],
      ["user", "User Registration"],
      ["environment", "Environmental Data"],
      ["symptoms", "Symptom Report"],
      ["risk", "Risk Calculation"],
      ["routes", "Route Recommendation"],
      ["notifications", "Notifications"],
      ["architecture", "Architecture Summary"]
    ],
    []
  );

  useEffect(() => {
    setSymptomForm((previous) => ({ ...previous, userId }));
    setNotificationUserId(userId || "broadcast");
  }, [userId]);

  const runRequest = async <T,>(
    setState: (state: RequestState) => void,
    action: () => Promise<T>,
    onSuccess?: (data: T) => void
  ) => {
    setState({ loading: true, error: null, data: null });
    try {
      const data = await action();
      setState({ loading: false, error: null, data });
      onSuccess?.(data);
    } catch (error) {
      setState({
        loading: false,
        error: error instanceof Error ? error.message : "Unexpected request error",
        data: null
      });
    }
  };

  const saveUser = (user: UserProfile) => {
    setUserId(user.id);
    setProfile(user);
    localStorage.setItem("pollenshieldUserId", user.id);
    localStorage.setItem("pollenshieldUserProfile", JSON.stringify(user));
  };

  const registerUser = (event: FormEvent) => {
    event.preventDefault();
    runRequest<UserProfile>(
      setRegisterState,
      () =>
        requestJson<UserProfile>("/api/users/register", {
          method: "POST",
          body: JSON.stringify({
            name: registerForm.name,
            email: registerForm.email,
            password: registerForm.password,
            allergyTypes: splitCommaText(registerForm.allergyTypes),
            sensitivityLevel: registerForm.sensitivityLevel,
            notificationEnabled: registerForm.notificationEnabled
          })
        }),
      saveUser
    );
  };

  const fetchProfile = () => {
    if (!userId) {
      setProfileState({ loading: false, error: "Register or enter a user id first.", data: null });
      return;
    }
    runRequest<UserProfile>(setProfileState, () => requestJson<UserProfile>(`/api/users/${userId}/profile`), saveUser);
  };

  const checkSystemStatus = () => {
    runRequest(setSystemStatus, async () => {
      const [health, routes] = await Promise.all([
        requestJson<{ service: string; status: string }>("/health"),
        requestJson<Array<{ prefix: string; target: string }>>("/debug/routes")
      ]);
      return {
        gateway: health,
        gatewayRoutes: routes,
        note: "The frontend calls only the API Gateway. Individual backend services are routed behind the gateway and can also be checked with scripts/health-check.sh."
      };
    });
  };

  const submitEnvironment = (event: FormEvent) => {
    event.preventDefault();
    runRequest(setEnvironmentState, () =>
      requestJson("/api/environment/report", {
        method: "POST",
        body: JSON.stringify({
          locationId: environmentForm.locationId,
          temperature: Number(environmentForm.temperature),
          humidity: Number(environmentForm.humidity),
          windSpeed: Number(environmentForm.windSpeed),
          pollenIndex: Number(environmentForm.pollenIndex)
        })
      })
    );
  };

  const submitSymptom = (event: FormEvent) => {
    event.preventDefault();
    runRequest(setSymptomState, () =>
      requestJson("/api/symptoms", {
        method: "POST",
        body: JSON.stringify({
          userId: symptomForm.userId,
          locationId: symptomForm.locationId,
          regionId: symptomForm.regionId,
          symptoms: splitCommaText(symptomForm.symptoms),
          intensity: Number(symptomForm.intensity)
        })
      })
    );
  };

  const recalculateRisk = () => {
    runRequest<RiskScore>(setRiskState, () =>
      requestJson<RiskScore>("/api/risk/recalculate", {
        method: "POST",
        body: JSON.stringify({
          locationId: riskForm.locationId,
          pollenIndex: Number(riskForm.pollenIndex),
          humidity: Number(riskForm.humidity),
          windSpeed: Number(riskForm.windSpeed),
          averageSymptomIntensity: Number(riskForm.averageSymptomIntensity)
        })
      })
    );
  };

  const getRisk = () => {
    runRequest<RiskScore>(setRiskState, () => requestJson<RiskScore>(`/api/risk/location/${riskForm.locationId}`));
  };

  const recommendRoute = (event: FormEvent) => {
    event.preventDefault();
    runRequest<RouteResponse>(setRouteState, () =>
      requestJson<RouteResponse>("/api/routes/recommend", {
        method: "POST",
        body: JSON.stringify({
          startLocation: routeForm.startLocation,
          destinationLocation: routeForm.destinationLocation,
          travelMode: routeForm.travelMode,
          useGoogleRoutes: routeForm.useGoogleRoutes,
          candidateLocationIds: splitCommaText(routeForm.candidateLocationIds)
        })
      })
    );
  };

  const fetchNotifications = () => {
    runRequest<NotificationItem[]>(setNotificationState, () =>
      requestJson<NotificationItem[]>(`/api/notifications/user/${notificationUserId || "broadcast"}`)
    );
  };

  const markNotificationRead = async (notificationId: string) => {
    setNotificationState((previous) => ({ ...previous, loading: true, error: null }));
    try {
      const updated = await requestJson<NotificationItem>(`/api/notifications/${notificationId}/read`, { method: "PUT" });
      setNotificationState({
        loading: false,
        error: null,
        data: notifications.map((notification) => (notification.id === updated.id ? updated : notification))
      });
    } catch (error) {
      setNotificationState({
        loading: false,
        error: error instanceof Error ? error.message : "Could not mark notification as read",
        data: notifications
      });
    }
  };

  const updateDemoStep = (index: number, update: Partial<DemoStep>) => {
    setDemoSteps((steps) => steps.map((step, stepIndex) => (stepIndex === index ? { ...step, ...update } : step)));
  };

  const runDemoFlow = async () => {
    setDemoRunning(true);
    setDemoSteps((steps) => steps.map((step) => ({ ...step, status: "Pending", response: undefined, error: undefined })));
    let demoUserId = userId;

    const steps: Array<() => Promise<unknown>> = [
      async () => {
        const user = await requestJson<UserProfile>("/api/users/register", {
          method: "POST",
          body: JSON.stringify({
            name: demoData.name,
            email: demoData.email,
            password: demoData.password,
            allergyTypes: demoData.allergyTypes,
            sensitivityLevel: demoData.sensitivityLevel,
            notificationEnabled: demoData.notificationEnabled
          })
        });
        demoUserId = user.id;
        saveUser(user);
        return user;
      },
      () =>
        requestJson("/api/environment/report", {
          method: "POST",
          body: JSON.stringify({
            locationId: demoData.locationId,
            temperature: demoData.temperature,
            humidity: demoData.humidity,
            windSpeed: demoData.windSpeed,
            pollenIndex: demoData.pollenIndex
          })
        }),
      () =>
        requestJson("/api/symptoms", {
          method: "POST",
          body: JSON.stringify({
            userId: demoUserId,
            locationId: demoData.locationId,
            regionId: demoData.regionId,
            symptoms: demoData.symptoms,
            intensity: demoData.intensity
          })
        }),
      async () => {
        const risk = await requestJson<RiskScore>("/api/risk/recalculate", {
          method: "POST",
          body: JSON.stringify({
            locationId: demoData.locationId,
            pollenIndex: demoData.pollenIndex,
            humidity: demoData.humidity,
            windSpeed: demoData.windSpeed,
            averageSymptomIntensity: demoData.averageSymptomIntensity
          })
        });
        setRiskState({ loading: false, error: null, data: risk });
        return risk;
      },
      () => requestJson<RiskScore>(`/api/risk/location/${demoData.locationId}`),
      async () => {
        const route = await requestJson<RouteResponse>("/api/routes/recommend", {
          method: "POST",
          body: JSON.stringify({
            startLocation: demoData.startLocation,
            destinationLocation: demoData.destinationLocation,
            candidateLocationIds: demoData.candidateLocationIds
          })
        });
        setRouteState({ loading: false, error: null, data: route });
        return route;
      },
      async () => {
        const result = await requestJson<NotificationItem[]>(`/api/notifications/user/${demoUserId}`);
        setNotificationState({ loading: false, error: null, data: result });
        return result;
      }
    ];

    for (let index = 0; index < steps.length; index += 1) {
      updateDemoStep(index, { status: "Running" });
      try {
        const response = await steps[index]();
        updateDemoStep(index, { status: "Success", response });
      } catch (error) {
        updateDemoStep(index, { status: "Failed", error: error instanceof Error ? error.message : "Unexpected error" });
        break;
      }
    }
    setDemoRunning(false);
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <span className="brand-mark">PS</span>
          <div>
            <h1>PollenShield</h1>
            <p>CENG-442 Demo</p>
          </div>
        </div>
        <nav className="side-nav" aria-label="Dashboard sections">
          {sections.map(([id, label]) => (
            <button key={id} className={activeSection === id ? "active" : ""} onClick={() => setActiveSection(id)}>
              {label}
            </button>
          ))}
        </nav>
        <div className="gateway-card">
          <span>API Gateway</span>
          <strong>{API_BASE_URL}</strong>
        </div>
      </aside>

      <main className="content">
        {activeSection === "overview" && (
          <section className="panel hero-panel">
            <p className="eyebrow">Hyperlocal allergy risk and safer walking routes</p>
            <h2>Microservice demo console</h2>
            <p>
              PollenShield combines allergy profiles, environmental observations, symptom reports, cached risk scoring,
              safer route recommendation, and notifications in a Docker-based microservice architecture.
            </p>
            <div className="overview-grid">
              <div><strong>7</strong><span>Backend microservices</span></div>
              <div><strong>REST</strong><span>Gateway and service APIs</span></div>
              <div><strong>RabbitMQ</strong><span>Async risk and notification events</span></div>
              <div><strong>Docker</strong><span>One command runnable stack</span></div>
            </div>
            <section className="guided-flow">
              <div className="section-heading">
                <h3>Run Demo Flow</h3>
                <p>Executes the core presentation scenario through the API Gateway and records each response.</p>
              </div>
              <button onClick={runDemoFlow} disabled={demoRunning}>{demoRunning ? "Running flow..." : "Run Demo Flow"}</button>
              <div className="demo-steps">
                {demoSteps.map((step) => (
                  <article key={step.key} className="demo-step">
                    <div className="step-line">
                      <span className={statusClass(step.status)}>{step.status}</span>
                      <strong>{step.title}</strong>
                    </div>
                    {step.error && <div className="notice error">{step.error}</div>}
                    <JsonCard value={step.response} />
                  </article>
                ))}
              </div>
            </section>
          </section>
        )}

        {activeSection === "status" && (
          <section className="panel">
            <div className="section-heading">
              <h2>System Status</h2>
              <p>The frontend verifies the API Gateway and the gateway routing table. Direct service health checks are available in `scripts/health-check.sh`.</p>
            </div>
            <button onClick={checkSystemStatus}>Check Gateway Status</button>
            <ResultPanel state={systemStatus} />
          </section>
        )}

        {activeSection === "user" && (
          <section className="panel">
            <div className="section-heading">
              <h2>User Registration</h2>
              <p>Creates an allergy profile in the User Profile Service through the API Gateway.</p>
            </div>
            <form className="form-grid" onSubmit={registerUser}>
              <label>Name<input value={registerForm.name} onChange={(e) => setRegisterForm({ ...registerForm, name: e.target.value })} /></label>
              <label>Email<input value={registerForm.email} onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })} /></label>
              <label>Password<input type="password" value={registerForm.password} onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })} /></label>
              <label>Allergy Types<input value={registerForm.allergyTypes} onChange={(e) => setRegisterForm({ ...registerForm, allergyTypes: e.target.value })} /></label>
              <label>Sensitivity<select value={registerForm.sensitivityLevel} onChange={(e) => setRegisterForm({ ...registerForm, sensitivityLevel: e.target.value })}><option>Low</option><option>Medium</option><option>High</option></select></label>
              <label className="checkbox-row"><input type="checkbox" checked={registerForm.notificationEnabled} onChange={(e) => setRegisterForm({ ...registerForm, notificationEnabled: e.target.checked })} /> Notifications enabled</label>
              <button type="submit">Register User</button>
            </form>
            <div className="profile-summary">
              <div className="inline-controls">
                <input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="userId" />
                <button onClick={fetchProfile}>Fetch Profile</button>
              </div>
              {profile && (
                <article className="info-card">
                  <h3>{profile.name}</h3>
                  <p>{profile.email}</p>
                  <p>User ID: {profile.id}</p>
                  <p>Allergies: {profile.allergyTypes.join(", ")}</p>
                  <p>Sensitivity: <span className={riskClass(profile.sensitivityLevel)}>{profile.sensitivityLevel}</span></p>
                  <p>Notifications: {profile.notificationEnabled ? "Enabled" : "Disabled"}</p>
                </article>
              )}
            </div>
            <ResultPanel state={registerState} />
            <ResultPanel state={profileState} />
          </section>
        )}

        {activeSection === "environment" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Environmental Data Report</h2>
              <p>Stores pollen and weather data in MongoDB and publishes `EnvironmentalDataUpdated`.</p>
            </div>
            <form className="form-grid" onSubmit={submitEnvironment}>
              {Object.entries(environmentForm).map(([key, value]) => (
                <label key={key}>{key}<input value={value} onChange={(e) => setEnvironmentForm({ ...environmentForm, [key]: e.target.value })} /></label>
              ))}
              <button type="submit">Submit Environmental Report</button>
            </form>
            <ResultPanel state={environmentState} />
          </section>
        )}

        {activeSection === "symptoms" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Symptom Report</h2>
              <p>Stores allergy symptoms in PostgreSQL and publishes `SymptomReportCreated`.</p>
            </div>
            <form className="form-grid" onSubmit={submitSymptom}>
              {Object.entries(symptomForm).map(([key, value]) => (
                <label key={key}>{key}<input value={value} onChange={(e) => setSymptomForm({ ...symptomForm, [key]: e.target.value })} /></label>
              ))}
              <button type="submit">Submit Symptom Report</button>
            </form>
            <ResultPanel state={symptomState} />
          </section>
        )}

        {activeSection === "risk" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Allergy Risk Calculation</h2>
              <p>Calculates a deterministic risk score and caches it in Redis.</p>
            </div>
            <div className="form-grid">
              {Object.entries(riskForm).map(([key, value]) => (
                <label key={key}>{key}<input value={value} onChange={(e) => setRiskForm({ ...riskForm, [key]: e.target.value })} /></label>
              ))}
              <div className="button-row">
                <button onClick={recalculateRisk}>Recalculate Risk</button>
                <button onClick={getRisk}>Get Cached Risk</button>
              </div>
            </div>
            <RiskDisplay risk={currentRisk} />
            <ResultPanel state={riskState} />
          </section>
        )}

        {activeSection === "routes" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Route Recommendation</h2>
              <p>Calls the Risk Service for route segments and selects the route with the lowest total risk.</p>
            </div>
            <form className="form-grid" onSubmit={recommendRoute}>
              <label>Start address<input value={routeForm.startLocation} onChange={(e) => setRouteForm({ ...routeForm, startLocation: e.target.value })} /></label>
              <label>Destination address<input value={routeForm.destinationLocation} onChange={(e) => setRouteForm({ ...routeForm, destinationLocation: e.target.value })} /></label>
              <label>Travel mode<select value={routeForm.travelMode} onChange={(e) => setRouteForm({ ...routeForm, travelMode: e.target.value })}><option value="WALK">Walk</option><option value="DRIVE">Drive</option><option value="BICYCLE">Bicycle</option><option value="TRANSIT">Transit</option></select></label>
              <label className="checkbox-row"><input type="checkbox" checked={routeForm.useGoogleRoutes} onChange={(e) => setRouteForm({ ...routeForm, useGoogleRoutes: e.target.checked })} /> Use Google Routes</label>
              <label className="full-span">Fallback candidateLocationIds<input value={routeForm.candidateLocationIds} onChange={(e) => setRouteForm({ ...routeForm, candidateLocationIds: e.target.value })} /></label>
              <button type="submit">Recommend Safest Route</button>
            </form>
            <RouteDisplay result={routeResult} />
            <ResultPanel state={routeState} />
          </section>
        )}

        {activeSection === "notifications" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Notifications</h2>
              <p>Displays high-risk alerts stored by the Notification Service.</p>
            </div>
            <div className="inline-controls">
              <input value={notificationUserId} onChange={(e) => setNotificationUserId(e.target.value)} placeholder="userId or broadcast" />
              <button onClick={fetchNotifications}>Fetch Notifications</button>
            </div>
            {notificationState.loading && <div className="notice info">Loading...</div>}
            {notificationState.error && <div className="notice error">{notificationState.error}</div>}
            <div className="notification-list">
              {notifications.map((notification) => (
                <article key={notification.id} className={`notification-card ${notification.read ? "read" : ""}`}>
                  <div>
                    <div className="card-heading">
                      <h3>{notification.title}</h3>
                      <span className={riskClass(notification.riskLevel || "High")}>{notification.riskLevel || "High"}</span>
                    </div>
                    <p>{notification.message}</p>
                    <small>{notification.createdAt}</small>
                  </div>
                  <button onClick={() => markNotificationRead(notification.id)} disabled={notification.read}>
                    {notification.read ? "Read" : "Mark as read"}
                  </button>
                </article>
              ))}
            </div>
            {!notifications.length && Boolean(notificationState.data) && <div className="notice muted">No notifications found yet.</div>}
          </section>
        )}

        {activeSection === "architecture" && (
          <section className="panel">
            <div className="section-heading">
              <h2>Architecture Summary</h2>
              <p>A compact explanation for the final presentation.</p>
            </div>
            <div className="architecture-grid">
              {[
                ["API Gateway", "Routes all client requests to backend services."],
                ["User Profile Service", "Stores allergy profiles and preferences in PostgreSQL."],
                ["Environmental Data Service", "Stores pollen/weather reports in MongoDB and publishes events."],
                ["Symptom Report Service", "Stores symptom reports in PostgreSQL and publishes events."],
                ["Allergy Risk Service", "Calculates and caches risk scores in Redis."],
                ["Route Recommendation Service", "Selects safer routes using risk scores over REST."],
                ["Notification Service", "Stores alerts generated from high-risk events in MongoDB."],
                ["RabbitMQ", "Carries asynchronous events between independent services."],
                ["PostgreSQL + MongoDB", "Use different databases for relational and document-style data."],
                ["Docker Compose", "Runs the complete distributed system with one command."]
              ].map(([title, text]) => (
                <article key={title} className="info-card">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function RiskDisplay({ risk }: { risk: RiskScore | null }) {
  if (!risk) {
    return <div className="notice muted">No risk score yet. Recalculate risk to populate the visualization.</div>;
  }

  return (
    <article className="risk-visual">
      <div className="risk-header">
        <span className={riskClass(risk.level)}>{risk.level}</span>
        <strong>{risk.score}/100</strong>
      </div>
      <div className="risk-bar" aria-label="Risk score from 0 to 100">
        <div style={{ width: `${risk.score}%` }} />
      </div>
      <p>{riskExplanation(risk.level)}</p>
      <small>Calculated at {risk.calculatedAt}</small>
      <div className="risk-scale">
        <span>0 Low</span>
        <span>26 Medium</span>
        <span>51 High</span>
        <span>76 Critical</span>
        <span>100</span>
      </div>
    </article>
  );
}

function RouteDisplay({ result }: { result: RouteResponse | null }) {
  if (!result) {
    return <div className="notice muted">No route recommendation yet.</div>;
  }

  return (
    <section className="route-display">
      <RouteMap result={result} />
      <article className="recommended-route">
        <h3>Recommended Route: {result.recommendedRoute.routeId}</h3>
        <p>Average pollen risk: <strong>{result.recommendedRoute.averageRiskScore}/100</strong></p>
        <p>Total risk score: <strong>{result.recommendedRoute.totalRiskScore}</strong></p>
        <p>Estimated duration: <strong>{result.recommendedRoute.estimatedDurationMinutes} minutes</strong></p>
        <p>Distance: <strong>{formatDistance(result.recommendedRoute.distanceMeters)}</strong></p>
        <p>Source: <strong>{result.recommendedRoute.source}</strong></p>
        <p>Selected because it minimizes pollen exposure first and uses shorter duration as a tie breaker.</p>
        <div className="segment-list">
          {result.recommendedRoute.segments.map((segment) => (
            <span key={segment.locationId} className={riskTone(segment.riskScore)}>{segment.locationId}: {segment.riskScore}</span>
          ))}
        </div>
      </article>
      <div className="alternative-grid">
        {result.alternatives.map((route) => (
          <article key={route.routeId} className="info-card">
            <h3>{route.routeId}</h3>
            <p>Average risk: {route.averageRiskScore}/100</p>
            <p>Total risk: {route.totalRiskScore}</p>
            <p>Duration: {route.estimatedDurationMinutes} min</p>
            <p>Distance: {formatDistance(route.distanceMeters)}</p>
            <p>Source: {route.source}</p>
            <div className="segment-list">
              {route.segments.map((segment) => (
                <span key={`${route.routeId}-${segment.locationId}`} className={riskTone(segment.riskScore)}>{segment.locationId}: {segment.riskScore}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

const googleMapsApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";

const googleMapsScriptId = "google-maps-script";

const loadGoogleMaps = () =>
  new Promise<void>((resolve, reject) => {
    if ((window as any).google?.maps) {
      resolve();
      return;
    }

    const existingScript = document.getElementById(googleMapsScriptId) as HTMLScriptElement | null;
    if (existingScript) {
      existingScript.addEventListener("load", () => resolve());
      existingScript.addEventListener("error", () => reject(new Error("Google Maps could not be loaded")));
      return;
    }

    const script = document.createElement("script");
    script.id = googleMapsScriptId;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Google Maps could not be loaded"));
    document.head.appendChild(script);
  });

const decodePolyline = (encoded: string): Array<{ lat: number; lng: number }> => {
  let index = 0;
  let lat = 0;
  let lng = 0;
  const coordinates: Array<{ lat: number; lng: number }> = [];

  while (index < encoded.length) {
    let result = 0;
    let shift = 0;
    let byte = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lat += result & 1 ? ~(result >> 1) : result >> 1;
    result = 0;
    shift = 0;

    do {
      byte = encoded.charCodeAt(index++) - 63;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20);

    lng += result & 1 ? ~(result >> 1) : result >> 1;
    coordinates.push({ lat: lat / 1e5, lng: lng / 1e5 });
  }

  return coordinates;
};

const formatDistance = (meters: number) => (meters >= 1000 ? `${(meters / 1000).toFixed(1)} km` : `${meters} m`);

const riskTone = (score: number) => {
  if (score <= 25) return "low";
  if (score <= 50) return "medium";
  if (score <= 75) return "high";
  return "critical";
};

function RouteMap({ result }: { result: RouteResponse }) {
  const mapElementId = "route-map";
  const [mapError, setMapError] = useState("");
  const hasPolyline = result.alternatives.some((route) => route.encodedPolyline);

  useEffect(() => {
    if (!googleMapsApiKey || !hasPolyline) {
      return;
    }

    let cancelled = false;

    loadGoogleMaps()
      .then(() => {
        if (cancelled) {
          return;
        }

        const google = (window as any).google;
        const mapElement = document.getElementById(mapElementId);
        if (!google?.maps || !mapElement) {
          return;
        }

        const routePaths = result.alternatives
          .map((route) => ({
            route,
            path: route.encodedPolyline ? decodePolyline(route.encodedPolyline) : []
          }))
          .filter(({ path }) => path.length > 0);

        const firstPath = routePaths[0]?.path;
        const map = new google.maps.Map(mapElement, {
          center: firstPath?.[0] || { lat: 39.9334, lng: 32.8597 },
          zoom: 13,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false
        });
        const bounds = new google.maps.LatLngBounds();

        routePaths.forEach(({ route, path }) => {
          const isRecommended = route.routeId === result.recommendedRoute.routeId;
          const polyline = new google.maps.Polyline({
            path,
            geodesic: true,
            strokeColor: isRecommended ? "#2f8a57" : route.averageRiskScore > 60 ? "#c75724" : "#7a8b82",
            strokeOpacity: isRecommended ? 0.95 : 0.55,
            strokeWeight: isRecommended ? 6 : 4
          });
          polyline.setMap(map);
          path.forEach((point) => bounds.extend(point));

          route.segments
            .filter((segment) => typeof segment.lat === "number" && typeof segment.lng === "number")
            .forEach((segment) => {
              new google.maps.Circle({
                map,
                center: { lat: segment.lat, lng: segment.lng },
                radius: 45,
                strokeWeight: 0,
                fillColor:
                  segment.riskScore <= 25
                    ? "#2f8a57"
                    : segment.riskScore <= 50
                      ? "#b6821d"
                      : segment.riskScore <= 75
                        ? "#c75724"
                        : "#a92734",
                fillOpacity: isRecommended ? 0.6 : 0.28
              });
            });
        });

        if (!bounds.isEmpty()) {
          map.fitBounds(bounds);
        }
      })
      .catch((error) => setMapError(error instanceof Error ? error.message : "Google Maps could not be loaded"));

    return () => {
      cancelled = true;
    };
  }, [hasPolyline, result]);

  if (!googleMapsApiKey) {
    return <div className="notice muted">Map is disabled because VITE_GOOGLE_MAPS_API_KEY is not configured.</div>;
  }

  if (!hasPolyline) {
    return <div className="notice muted">Map will appear when Google route polylines are available.</div>;
  }

  return (
    <>
      <div id={mapElementId} className="route-map" aria-label="Recommended and alternative route map" />
      {mapError && <div className="notice error">{mapError}</div>}
    </>
  );
}

export default App;
