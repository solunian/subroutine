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
    error(sub_res.status, sub_res.error.message);
  }

  const entries_res = await Promise.all(
    sub_res.data.map((sub) => supabase.from("entries").select("*").eq("subroutine_id", sub.id))
  );

  for (let i = 0; i < sub_res.data.length; i++) {
    if (entries_res[i].error) {
      // quietly errant subroutine with data fetch failed
      subroutines.push([sub_res.data[i], []]);
    } else {
      subroutines.push([sub_res.data[i], entries_res[i].data]);
    }
  }

  return { session, username: params.username, profile: profile_res.data, subroutines };
};
