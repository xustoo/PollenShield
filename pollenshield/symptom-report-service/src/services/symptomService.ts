import { randomUUID } from "crypto";
import type { SymptomReport } from "@pollenshield/shared";
import { pool } from "../config/database";
import type { SymptomReportEntity } from "../entities/SymptomReportEntity";

interface CreateSymptomReportInput {
  userId: string;
  locationId: string;
  regionId: string;
  symptoms: string[];
  intensity: number;
}

const toIsoString = (value: Date | string): string => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const mapSymptomReport = (row: SymptomReportEntity): SymptomReport => ({
  id: row.id,
  userId: row.user_id,
  locationId: row.location_id,
  regionId: row.region_id,
  symptoms: row.symptoms,
  intensity: row.intensity,
  createdAt: toIsoString(row.created_at)
});

export const createSymptomReport = async (input: CreateSymptomReportInput): Promise<SymptomReport> => {
  const result = await pool.query<SymptomReportEntity>(
    `INSERT INTO symptom_reports (id, user_id, location_id, region_id, symptoms, intensity)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING *`,
    [randomUUID(), input.userId, input.locationId, input.regionId, input.symptoms || [], input.intensity]
  );

  return mapSymptomReport(result.rows[0]);
};

export const getReportsByUser = async (userId: string): Promise<SymptomReport[]> => {
  const result = await pool.query<SymptomReportEntity>(
    "SELECT * FROM symptom_reports WHERE user_id = $1 ORDER BY created_at DESC",
    [userId]
  );
  return result.rows.map(mapSymptomReport);
};

export const getReportsByRegion = async (regionId: string): Promise<SymptomReport[]> => {
  const result = await pool.query<SymptomReportEntity>(
    "SELECT * FROM symptom_reports WHERE region_id = $1 ORDER BY created_at DESC",
    [regionId]
  );
  return result.rows.map(mapSymptomReport);
};
