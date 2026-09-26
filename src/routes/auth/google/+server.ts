import { redirect } from "@sveltejs/kit";
import { auth_redirect } from "$lib/server/auth_redirect";
import type { RequestHandler } from "./$types";

export const POST: RequestHandler = async ({ request, url, locals: { supabase } }) => {
  const form = await request.formData();
  const destination = form.get("redirect");
  const next = auth_redirect(typeof destination === "string" ? destination : null, url.origin);
  const callback = new URL("/auth/callback", url.origin);
  callback.searchParams.set("next", next);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: callback.toString(), skipBrowserRedirect: true },
  });

  if (error || !data.url) {
    redirect(303, `/signin?oauth=error&redirect=${encodeURIComponent(next)}`);
  }

  redirect(303, data.url);
};
