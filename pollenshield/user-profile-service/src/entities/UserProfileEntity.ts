export interface UserProfileEntity {
  id: string;
  name: string;
  email: string;
  password: string;
  allergy_types: string[];
  sensitivity_level: string;
  notification_enabled: boolean;
  created_at: Date;
}
