import type { EmailOtpType } from "@supabase/supabase-js";
import { redirect } from "@sveltejs/kit";

import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next") ?? "/";
  const safe_next = next.startsWith("/") && !next.startsWith("//") ? next : "/";

  // Never carry auth tokens or untrusted redirect parameters into the destination URL.
  const redirectTo = new URL(url);
  redirectTo.pathname = type === "recovery" ? "/reset-password" : safe_next;
  redirectTo.search = "";

  if (token_hash) {
    if (type === "signup" || type === "magiclink" || type === "recovery") {
      const { error } = await supabase.auth.verifyOtp({ type, token_hash });
      if (!error) {
        redirect(303, redirectTo);
      }
    }
  }

  redirectTo.pathname = "/auth/error";
  redirect(303, redirectTo);
};
