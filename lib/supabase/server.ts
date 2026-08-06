import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. " +
      "Add SUPABASE_SERVICE_ROLE_KEY to .env.local — see README.md. " +
      "This key is server-only and must never be exposed to the browser.",
  );
}

// Service-role client for server-only routes (Claude generation, the
// weather cron job) that need to bypass RLS. Never import this file from a
// Client Component or anything that ships to the browser — use
// lib/supabase/client.ts (anon key) there instead.
export const supabaseAdmin = createClient<Database>(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});
