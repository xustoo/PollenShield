import { Request, Response } from "express";
import { publishEvent } from "../events/symptomEvents";
import { createSymptomReport as saveSymptomReport, getReportsByRegion, getReportsByUser } from "../services/symptomService";

const errorDetails = (error: unknown): string => (error instanceof Error ? error.message : "Unknown error");
const ok = (res: Response, data: unknown, status = 200) => res.status(status).json({ success: true, data });
const fail = (res: Response, status: number, error: string, details?: string) => res.status(status).json({ success: false, error, ...(details ? { details } : {}) });

export const createSymptomReport = async (req: Request, res: Response) => {
  try {
    const { userId, locationId, regionId, symptoms, intensity } = req.body;
    if (!userId || !locationId || !regionId || !Array.isArray(symptoms) || typeof intensity !== "number") {
      return fail(res, 400, "userId, locationId, regionId, symptoms and numeric intensity are required");
    }

    const report = await saveSymptomReport({ userId, locationId, regionId, symptoms, intensity });
    const event = await publishEvent("SymptomReportCreated", report);
    return ok(res, { report, event }, 201);
  } catch (error) {
    console.error("Create symptom report failed", error);
    return fail(res, 500, "Could not create symptom report", errorDetails(error));
  }
};

export const getByUser = async (req: Request, res: Response) => {
  try {
    const reports = await getReportsByUser(req.params.userId);
    return ok(res, reports);
  } catch (error) {
    console.error("Get symptoms by user failed", error);
    return fail(res, 500, "Could not get symptom reports", errorDetails(error));
  }
};

export const getByRegion = async (req: Request, res: Response) => {
  try {
    const reports = await getReportsByRegion(req.params.regionId);
    return ok(res, reports);
  } catch (error) {
    console.error("Get symptoms by region failed", error);
    return fail(res, 500, "Could not get symptom reports", errorDetails(error));
  }
};
