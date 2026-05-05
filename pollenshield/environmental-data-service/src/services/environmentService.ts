import type { EnvironmentalData } from "@pollenshield/shared";
import { EnvironmentalDataModel } from "../models/EnvironmentalDataModel";

interface CreateEnvironmentalDataInput {
  locationId: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pollenIndex: number;
}

const toIsoString = (value: Date | string): string => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const mapEnvironmentalData = (document: any): EnvironmentalData => ({
  id: String(document._id),
  locationId: document.locationId,
  temperature: document.temperature,
  humidity: document.humidity,
  windSpeed: document.windSpeed,
  pollenIndex: document.pollenIndex,
  recordedAt: toIsoString(document.recordedAt)
});

export const createEnvironmentalData = async (input: CreateEnvironmentalDataInput): Promise<EnvironmentalData> => {
  const data = await EnvironmentalDataModel.create({ ...input, recordedAt: new Date() });
  return mapEnvironmentalData(data);
};

export const getEnvironmentalDataByLocation = async (locationId: string): Promise<EnvironmentalData[]> => {
  const records = await EnvironmentalDataModel.find({ locationId }).sort({ recordedAt: -1 }).limit(100);
  return records.map(mapEnvironmentalData);
};

export const getLatestEnvironmentalData = async (limit = 20): Promise<EnvironmentalData[]> => {
  const records = await EnvironmentalDataModel.find().sort({ recordedAt: -1 }).limit(limit);
  return records.map(mapEnvironmentalData);
};
