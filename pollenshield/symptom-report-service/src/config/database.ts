import { Pool } from "pg";

export const databaseUrl = process.env.DATABASE_URL || "postgresql://pollenshield:pollenshield@localhost:5432/pollenshield";

export const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000
});

const createSymptomReportsTableSql = `
  CREATE TABLE IF NOT EXISTS symptom_reports (
    id UUID PRIMARY KEY,
    user_id TEXT NOT NULL,
    location_id TEXT NOT NULL,
    region_id TEXT NOT NULL,
    symptoms TEXT[] NOT NULL DEFAULT '{}',
    intensity INTEGER NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`;

export const initializeDatabase = async (retries = 10): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query(createSymptomReportsTableSql);
      console.log("Symptom Report Service database initialized");
      return;
    } catch (error) {
      console.error(`Database initialization failed, attempt ${attempt}/${retries}`, error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not initialize Symptom Report Service database");
};
