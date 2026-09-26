import { fail, redirect, type Action } from "@sveltejs/kit";
import type { SupabaseClient } from "@supabase/supabase-js";

type AccountAdmin = Pick<SupabaseClient["auth"]["admin"], "signOut" | "deleteUser">;

export function delete_account(get_admin: () => AccountAdmin | null): Action {
  return async ({ locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();
    if (!session || !user) redirect(303, "/signin");

    const admin = get_admin();
    if (!admin) {
      return fail(503, {
        delete_error: "Account deletion is currently unavailable. Please try again later.",
      });
    }

    const { error: signout_error } = await admin.signOut(session.access_token, "global");
    if (signout_error) {
      return fail(500, { delete_error: "Unable to delete your account. Please try again." });
    }

    // Always use the verified identity, never an ID submitted by the browser.
    // Foreign keys cascade to the profile, subroutines, entries, and relationships.
    const { error } = await admin.deleteUser(user.id);
    if (error) {
      return fail(500, { delete_error: "Unable to delete your account. Please try again." });
    }

    await supabase.auth.signOut({ scope: "local" });
    redirect(303, "/");
  };
}
