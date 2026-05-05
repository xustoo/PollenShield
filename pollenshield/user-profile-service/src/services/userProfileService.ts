import { randomUUID } from "crypto";
import type { UserProfile } from "@pollenshield/shared";
import { pool } from "../config/database";
import type { UserProfileEntity } from "../entities/UserProfileEntity";

interface RegisterUserInput {
  name: string;
  email: string;
  password: string;
  allergyTypes?: string[];
  sensitivityLevel?: string;
  notificationEnabled?: boolean;
}

interface PreferencesInput {
  allergyTypes?: string[];
  sensitivityLevel?: string;
  notificationEnabled?: boolean;
}

const toIsoString = (value: Date | string): string => (value instanceof Date ? value.toISOString() : new Date(value).toISOString());

const mapUser = (row: UserProfileEntity): UserProfile => ({
  id: row.id,
  name: row.name,
  email: row.email,
  allergyTypes: row.allergy_types,
  sensitivityLevel: row.sensitivity_level as UserProfile["sensitivityLevel"],
  notificationEnabled: row.notification_enabled,
  createdAt: toIsoString(row.created_at)
});

export const createUser = async (input: RegisterUserInput): Promise<UserProfile> => {
  const id = randomUUID();
  const result = await pool.query<UserProfileEntity>(
    `INSERT INTO users (id, name, email, password, allergy_types, sensitivity_level, notification_enabled)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     ON CONFLICT (email)
     DO UPDATE SET
       name = EXCLUDED.name,
       password = EXCLUDED.password,
       allergy_types = EXCLUDED.allergy_types,
       sensitivity_level = EXCLUDED.sensitivity_level,
       notification_enabled = EXCLUDED.notification_enabled
     RETURNING *`,
    [
      id,
      input.name,
      input.email,
      input.password,
      input.allergyTypes || [],
      input.sensitivityLevel || "Medium",
      input.notificationEnabled ?? true
    ]
  );

  return mapUser(result.rows[0]);
};

export const loginUserByEmail = async (email: string, password: string): Promise<UserProfile | null> => {
  const result = await pool.query<UserProfileEntity>("SELECT * FROM users WHERE email = $1 AND password = $2", [email, password]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
};

export const getUserById = async (userId: string): Promise<UserProfile | null> => {
  const result = await pool.query<UserProfileEntity>("SELECT * FROM users WHERE id = $1", [userId]);
  return result.rows[0] ? mapUser(result.rows[0]) : null;
};

export const updateUserPreferences = async (userId: string, input: PreferencesInput): Promise<UserProfile | null> => {
  const existing = await getUserById(userId);
  if (!existing) {
    return null;
  }

  const result = await pool.query<UserProfileEntity>(
    `UPDATE users
     SET allergy_types = $2,
         sensitivity_level = $3,
         notification_enabled = $4
     WHERE id = $1
     RETURNING *`,
    [
      userId,
      input.allergyTypes ?? existing.allergyTypes,
      input.sensitivityLevel ?? existing.sensitivityLevel,
      input.notificationEnabled ?? existing.notificationEnabled
    ]
  );

  return mapUser(result.rows[0]);
};
