export interface RiskCalculationInput {
  locationId: string;
  humidity: number;
  windSpeed: number;
  pollenIndex: number;
  averageSymptomIntensity?: number;
}
