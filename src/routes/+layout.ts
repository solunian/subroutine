// src/routes/+layout.ts
import { PUBLIC_SUPABASE_PUBLISHABLE_KEY, PUBLIC_SUPABASE_URL } from "$env/static/public";
import type { Database } from "$lib/types/database.types";
import type { LayoutLoad } from "./$types";
import { createBrowserClient, createServerClient, isBrowser } from "@supabase/ssr";

export const load: LayoutLoad = async ({ fetch, data, depends }) => {
  depends("supabase:auth");

  const supabase = isBrowser()
    ? createBrowserClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: {
          fetch,
        },
      })
    : createServerClient<Database>(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_PUBLISHABLE_KEY, {
        global: {
          fetch,
        },
        cookies: {
          getAll() {
            return data.cookies;
          },
        },
      });

  /**
   * It's fine to use `getSession` here, because on the client, `getSession` is
   * safe, and on the server, it reads `session` from the `LayoutData`, which
   * safely checked the session using `safeGetSession`.
   */
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const latest_gitcommit_res = await supabase
    .from("globals")
    .select("*")
    .eq("key", "latest_gitcommit_hash")
    .maybeSingle();

  return { supabase, session, latest_gitcommit: latest_gitcommit_res.data };
};
