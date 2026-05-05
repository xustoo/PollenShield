import { Request, Response } from "express";
import { publishEvent } from "../events/environmentEvents";
import { createEnvironmentalData, getEnvironmentalDataByLocation, getLatestEnvironmentalData } from "../services/environmentService";

const errorDetails = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, status: number, error: string, details?: string) => res.status(status).json({ success: false, error, ...(details ? { details } : {}) });

export const getByLocation = async (req: Request, res: Response) => {
  try {
    const records = await getEnvironmentalDataByLocation(req.params.locationId);
    return ok(res, records);
  } catch (error) {
    console.error("Get environmental data by location failed", error);
    return fail(res, 500, "Could not get environmental data", errorDetails(error));
  }
};

export const reportEnvironment = async (req: Request, res: Response) => {
  try {
    const { locationId, temperature, humidity, windSpeed, pollenIndex } = req.body;
    if (!locationId || [temperature, humidity, windSpeed, pollenIndex].some((value) => typeof value !== "number")) {
      return fail(res, 400, "locationId, temperature, humidity, windSpeed and pollenIndex are required");
    }

    const data = await createEnvironmentalData({ locationId, temperature, humidity, windSpeed, pollenIndex });
    const event = await publishEvent("EnvironmentalDataUpdated", data);
    return ok(res, { report: data, event }, 201);
  } catch (error) {
    console.error("Report environmental data failed", error);
    return fail(res, 500, "Could not save environmental data", errorDetails(error));
  }
};

export const getLatestEnvironment = async (req: Request, res: Response) => {
  try {
    const limit = Number(req.query.limit) || 20;
    const records = await getLatestEnvironmentalData(limit);
    return ok(res, records);
  } catch (error) {
    console.error("Get latest environmental data failed", error);
    return fail(res, 500, "Could not get latest environmental data", errorDetails(error));
  }
};
