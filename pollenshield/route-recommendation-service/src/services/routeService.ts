import axios from "axios";
import type { RouteRecommendation } from "@pollenshield/shared";
import { allergyRiskServiceUrl } from "../config/services";

const getLocationRisk = async (locationId: string): Promise<number> => {
  try {
    const response = await axios.get(`${allergyRiskServiceUrl}/api/risk/location/${locationId}`, { timeout: 3000 });
    const riskData = response.data?.data || response.data;
    return typeof riskData.score === "number" ? riskData.score : 50;
  } catch (error) {
    console.error(`Risk lookup failed for ${locationId}`, error);
    return 50;
  }
};

const buildCandidateRoutes = (candidateLocationIds: string[]): string[][] => {
  const candidates = candidateLocationIds.length > 0 ? candidateLocationIds : ["default-location"];
  return [
    candidates,
    [...candidates].reverse(),
    candidates.length > 1 ? [candidates[0], candidates[candidates.length - 1]] : candidates
  ];
};

export const recommendSafestRoute = async (
  startLocation: string,
  destinationLocation: string,
  candidateLocationIds: string[]
): Promise<{ recommendedRoute: RouteRecommendation; alternatives: RouteRecommendation[] }> => {
  const routeCandidates = buildCandidateRoutes(candidateLocationIds);

  const alternatives = await Promise.all(
    routeCandidates.map(async (locations, index): Promise<RouteRecommendation> => {
      const riskScores = await Promise.all(locations.map(getLocationRisk));
      const segments = locations.map((locationId, segmentIndex) => ({
        locationId,
        riskScore: riskScores[segmentIndex]
      }));
      const totalRiskScore = riskScores.reduce((sum, score) => sum + score, 0);

      return {
        routeId: `route-${index + 1}`,
        startLocation,
        destinationLocation,
        totalRiskScore,
        estimatedDurationMinutes: 15 + index * 5,
        segments
      };
    })
  );

  const recommendedRoute = [...alternatives].sort((a, b) => a.totalRiskScore - b.totalRiskScore)[0];
  return { recommendedRoute, alternatives };
};
