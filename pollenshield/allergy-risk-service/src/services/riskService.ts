import type { RiskScore } from "@pollenshield/shared";
import { redisClient } from "../config/cache";
import type { RiskCalculationInput } from "../models/RiskModel";

const clampScore = (score: number): number => Math.min(100, Math.max(0, Math.round(score)));

export const getRiskLevel = (score: number): RiskScore["level"] => {
  if (score <= 25) {
    return "Low";
  }
  if (score <= 50) {
    return "Medium";
  }
  if (score <= 75) {
    return "High";
  }
  return "Critical";
};

export const calculateRiskScore = (input: RiskCalculationInput): RiskScore => {
  const humidityRisk = input.humidity < 30 ? 15 : input.humidity <= 60 ? 5 : 10;
  const windRisk = input.windSpeed < 5 ? 5 : input.windSpeed <= 20 ? 15 : 10;
  const symptomRisk = input.averageSymptomIntensity ? input.averageSymptomIntensity * 3 : 0;
  const score = clampScore(input.pollenIndex * 0.5 + humidityRisk + windRisk + symptomRisk);

  return {
    locationId: input.locationId,
    score,
    level: getRiskLevel(score),
    calculatedAt: new Date().toISOString()
  };
};

export const cacheRiskScore = async (riskScore: RiskScore): Promise<void> => {
  await redisClient.set(`risk:${riskScore.locationId}`, JSON.stringify(riskScore));
};

export const getCachedRiskScore = async (locationId: string): Promise<RiskScore | null> => {
  const cached = await redisClient.get(`risk:${locationId}`);
  return cached ? (JSON.parse(cached) as RiskScore) : null;
};
