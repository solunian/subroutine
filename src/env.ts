import { defineEnvVars } from "@sveltejs/kit/env";

export const variables = defineEnvVars({
  PUBLIC_SUPABASE_URL: { public: true, static: true },
  PUBLIC_SUPABASE_PUBLISHABLE_KEY: { public: true, static: true },
  // Optional: account deletion handles a missing admin key without preventing app startup.
  SUPABASE_SECRET_KEY: { schema: (input) => input ?? "" },
});
