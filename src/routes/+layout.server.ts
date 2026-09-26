import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
  const { session, user } = await safeGetSession();

  const [profile_res, latest_gitcommit_res] = await Promise.all([
    user
      ? supabase.from("profiles").select("username, name").eq("id", user.id).maybeSingle()
      : null,
    supabase
      .from("globals")
      .select("value, updated_at")
      .eq("key", "latest_gitcommit_hash")
      .maybeSingle(),
  ]);

  return {
    session,
    user,
    username: profile_res?.data?.username ?? null,
    name: profile_res?.data?.name ?? null,
    latest_gitcommit: latest_gitcommit_res.data,
    sidebar_collapsed: cookies.get("subroutine-sidebar-collapsed") === "true",
    cookies: cookies.getAll(),
  };
};
