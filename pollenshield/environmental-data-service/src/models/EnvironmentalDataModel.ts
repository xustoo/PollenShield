import { model, Schema } from "mongoose";

export interface EnvironmentalDataDocument {
  locationId: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  pollenIndex: number;
  recordedAt: Date;
}

const environmentalDataSchema = new Schema<EnvironmentalDataDocument>({
  locationId: { type: String, required: true, index: true },
  temperature: { type: Number, required: true },
  humidity: { type: Number, required: true },
  windSpeed: { type: Number, required: true },
  pollenIndex: { type: Number, required: true },
  recordedAt: { type: Date, default: Date.now, index: true }
});

export const EnvironmentalDataModel = model<EnvironmentalDataDocument>("EnvironmentalData", environmentalDataSchema);
