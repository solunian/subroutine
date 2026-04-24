import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
  const { session } = await safeGetSession();

  // visible for anon
  const profile_res = await supabase
    .from("profiles")
    .select("name, bio, id")
    .eq("username", params.username)
    .single();

  if (profile_res.error) {
    error(400, "invalid username");
  }

  if (!session) {
    return { username: params.username, profile: profile_res.data };
  }

  // if logged in, load subroutines if identity or friend
  const sub_res = await supabase.from("subroutines").select("*").eq("user_id", profile_res.data.id);
  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  const entries_res = await Promise.all(
    sub_res.data.map((sub) => supabase.from("entries").select("*").eq("subroutine_id", sub.id))
  );

  const subroutines = sub_res.data;
  // quietly errant subroutine with data fetch failed
  const sub_entries = entries_res.map((entry_res) =>
    entry_res.data === null ? [] : entry_res.data
  );

  return {
    session,
    username: params.username,
    profile: profile_res.data,
    subroutines,
    sub_entries,
  };
};
