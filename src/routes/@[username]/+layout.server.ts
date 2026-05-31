import { error } from "@sveltejs/kit";
import type { LayoutServerLoad } from "./$types";

export const load: LayoutServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  // visible for anon
  const profile_res = await supabase
    .from("profiles")
    .select("name, bio, id")
    .eq("username", params.username)
    .single();

  if (profile_res.error) {
    error(400, "invalid username");
  }

  if (!session || !user) {
    return { username: params.username, profile: profile_res.data };
  }

  // if logged in...
  // load relationship data
  const profile_user_id = profile_res.data.id;

  const relationship_res = await supabase
    .from("relationships")
    .select("*")
    .or(
      `and(requester_id.eq.${user.id},requestee_id.eq.${profile_user_id}),and(requester_id.eq.${profile_user_id},requestee_id.eq.${user.id})`
    )
    .maybeSingle();

  return {
    user_id: user.id,
    username: params.username,
    profile: profile_res.data,
    relationship: relationship_res.data,
  };
};
