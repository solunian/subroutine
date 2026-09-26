import { redirect } from "@sveltejs/kit";
import { auth_redirect } from "$lib/server/auth_redirect";
import type { RequestHandler } from "./$types";

export const GET: RequestHandler = async ({ url, locals: { supabase } }) => {
  const code = url.searchParams.get("code");
  const next = auth_redirect(url.searchParams.get("next"), url.origin);

  if (code && !url.searchParams.has("error")) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) redirect(303, next);
  }

  redirect(303, `/signin?oauth=error&redirect=${encodeURIComponent(next)}`);
};
