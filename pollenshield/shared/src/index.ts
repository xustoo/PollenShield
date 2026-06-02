export type SensitivityLevel = "Low" | "Medium" | "High";
export type RiskLevel = "Low" | "Medium" | "High" | "Critical";

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  allergyTypes: string[];
  sensitivityLevel: SensitivityLevel;
  notificationEnabled: boolean;
  createdAt: string;
}

export interface EnvironmentalData {
  id: string;
  locationId: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pollenIndex: number;
  recordedAt: string;
}

export interface SymptomReport {
  id: string;
  userId: string;
  locationId: string;
  regionId: string;
  symptoms: string[];
  intensity: number;
  createdAt: string;
}

export interface RiskScore {
  locationId: string;
  score: number;
  level: RiskLevel;
  calculatedAt: string;
}

export interface RouteRecommendation {
  routeId: string;
  startLocation: string;
  destinationLocation: string;
  totalRiskScore: number;
  averageRiskScore: number;
  estimatedDurationMinutes: number;
  distanceMeters: number;
  encodedPolyline?: string;
  source: "google" | "mock";
  segments: Array<{
    locationId: string;
    riskScore: number;
    lat?: number;
    lng?: number;
    distanceMeters?: number;
  }>;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  locationId?: string;
  riskLevel?: string;
  read: boolean;
  createdAt: string;
}

export const EventNames = {
  EnvironmentalDataUpdated: "EnvironmentalDataUpdated",
  SymptomReportCreated: "SymptomReportCreated",
  RiskScoreUpdated: "RiskScoreUpdated",
  HighRiskAreaDetected: "HighRiskAreaDetected",
  NotificationRequested: "NotificationRequested"
} as const;
