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
  const subroutines = [];
  const sub_res = await supabase.from("subroutines").select("*").eq("user_id", profile_res.data.id);
  if (sub_res.error) {
    error(500, sub_res.error.message.toLowerCase());
  }

  for (const sub of sub_res.data) {
    const entries_res = await supabase.from("entries").select("*").eq("subroutine_id", sub.id);
    if (entries_res.error) {
      // quietly errant subroutine with data fetch failed
      subroutines.push([sub, []]);
    } else {
      subroutines.push([sub, entries_res.data]);
    }
  }

  return { session, username: params.username, profile: profile_res.data, subroutines };
};
