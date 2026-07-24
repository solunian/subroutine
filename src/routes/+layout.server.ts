import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ locals: { safeGetSession, supabase }, cookies }) => {
  const { session, user } = await safeGetSession();

  const profile = user
    ? await supabase.from("profiles").select("username").eq("id", user.id).maybeSingle()
    : null;

  return {
    session,
    user,
    username: profile?.data?.username ?? null,
    cookies: cookies.getAll(),
  };
};
