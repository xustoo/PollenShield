import { Request, Response } from "express";
import { processRiskInput } from "../events/riskEvents";
import { getCachedRiskScore } from "../services/riskService";

const errorDetails = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, status: number, error: string, details?: string) => res.status(status).json({ success: false, error, ...(details ? { details } : {}) });

export const getLocationRisk = async (req: Request, res: Response) => {
  try {
    const riskScore = await getCachedRiskScore(req.params.locationId);
    if (!riskScore) {
      return fail(res, 404, "No risk score is available yet for this location");
    }

    return ok(res, riskScore);
  } catch (error) {
    console.error("Get risk failed", error);
    return fail(res, 500, "Could not get risk score", errorDetails(error));
  }
};

export const getForecast = async (req: Request, res: Response) => {
  try {
    const riskScore = await getCachedRiskScore(req.params.locationId);
    if (!riskScore) {
      return fail(res, 404, "No cached risk score is available for forecast");
    }

    return ok(res, [
      { period: "morning", score: Math.max(0, riskScore.score - 5), level: riskScore.level },
      { period: "afternoon", score: riskScore.score, level: riskScore.level },
      { period: "evening", score: Math.min(100, riskScore.score + 5), level: riskScore.level }
    ]);
  } catch (error) {
    console.error("Get forecast failed", error);
    return fail(res, 500, "Could not get forecast", errorDetails(error));
  }
};

export const recalculateRisk = async (req: Request, res: Response) => {
  try {
    const { locationId, pollenIndex, humidity, windSpeed, averageSymptomIntensity } = req.body;
    if (!locationId || [pollenIndex, humidity, windSpeed].some((value) => typeof value !== "number")) {
      return fail(res, 400, "locationId, pollenIndex, humidity and windSpeed are required");
    }
    if (averageSymptomIntensity !== undefined && typeof averageSymptomIntensity !== "number") {
      return fail(res, 400, "averageSymptomIntensity must be numeric when provided");
    }

    const riskScore = await processRiskInput({ locationId, pollenIndex, humidity, windSpeed, intensity: averageSymptomIntensity });
    return ok(res, riskScore);
  } catch (error) {
    console.error("Recalculate risk failed", error);
    return fail(res, 500, "Could not recalculate risk", errorDetails(error));
  }
};
