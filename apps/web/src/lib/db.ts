import { neon } from "@neondatabase/serverless";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error(
    "Missing env var: DATABASE_URL. " +
      "Add a Neon connection string to your Vercel project environment variables or .env.local.",
  );
}

export const db = neon(connectionString);
