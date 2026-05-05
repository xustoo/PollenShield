import { Pool } from "pg";

export const databaseUrl = process.env.DATABASE_URL || "postgresql://pollenshield:pollenshield@localhost:5432/pollenshield";

export const pool = new Pool({
  connectionString: databaseUrl,
  connectionTimeoutMillis: 10000,
  query_timeout: 10000
});

const createUsersTableSql = `
  CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    allergy_types TEXT[] NOT NULL DEFAULT '{}',
    sensitivity_level TEXT NOT NULL DEFAULT 'Medium',
    notification_enabled BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  );
`;

export const initializeDatabase = async (retries = 10): Promise<void> => {
  for (let attempt = 1; attempt <= retries; attempt += 1) {
    try {
      await pool.query(createUsersTableSql);
      console.log("User Profile Service database initialized");
      return;
    } catch (error) {
      console.error(`Database initialization failed, attempt ${attempt}/${retries}`, error);
      await new Promise((resolve) => setTimeout(resolve, 3000));
    }
  }

  throw new Error("Could not initialize User Profile Service database");
};
