import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  throw new Error(
    "Missing env var: NEXT_PUBLIC_SUPABASE_URL. " +
      "Add it to your Vercel project environment variables or .env.local",
  );
}
if (!supabaseServiceKey) {
  throw new Error(
    "Missing env var: SUPABASE_SERVICE_ROLE_KEY. " +
      "Add it to your Vercel project environment variables (as a Secret).",
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey ?? "");

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
