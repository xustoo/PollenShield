import { Request, Response } from "express";
import { recommendSafestRoute } from "../services/routeService";

const errorDetails = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, status: number, error: string, details?: string) => res.status(status).json({ success: false, error, ...(details ? { details } : {}) });

export const recommendRoute = async (req: Request, res: Response) => {
  try {
    const { startLocation, destinationLocation, candidateLocationIds, travelMode, useGoogleRoutes } = req.body;
    if (!startLocation || !destinationLocation) {
      return fail(res, 400, "startLocation and destinationLocation are required");
    }
    if (candidateLocationIds !== undefined && !Array.isArray(candidateLocationIds)) {
      return fail(res, 400, "candidateLocationIds must be an array when provided");
    }

    const result = await recommendSafestRoute(startLocation, destinationLocation, candidateLocationIds || [], {
      travelMode,
      useGoogleRoutes
    });
    return ok(res, result);
  } catch (error) {
    console.error("Route recommendation failed", error);
    return fail(res, 500, "Could not recommend route", errorDetails(error));
  }
};

export const getRouteRisk = (req: Request, res: Response) => {
  return ok(res, {
    routeId: req.params.routeId,
    totalRiskScore: 40,
    riskLevel: "Medium",
    message: "Mock route risk information"
  });
};
