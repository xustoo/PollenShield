export interface SymptomReportEntity {
  id: string;
  user_id: string;
  location_id: string;
  region_id: string;
  intensity: number;
  symptoms: string[];
  created_at: Date;
}
