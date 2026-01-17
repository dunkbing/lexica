// Database schema definitions

// User preferences table row type
export interface UserPreferenceRow {
  key: string;
  value: string;
}

// User Data Database Schema
export const USER_DATA_SCHEMA = `
-- User preferences
CREATE TABLE IF NOT EXISTS user_preferences (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL
);
`;
