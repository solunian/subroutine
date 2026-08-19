import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ parent, locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  if (!session || !user) {
    return;
  }

  const layout_data = await parent();

  if (!layout_data.is_self && !layout_data.is_friend) {
    return { friends: undefined };
  }

  const friends_res = await supabase
    .from("relationships")
    .select(
      `
    requester_id,
    requestee_id,
    requester:profiles!relationships_requester_id_fkey (
      id,
      name,
      username
    ),
    requestee:profiles!relationships_requestee_id_fkey (
      id,
      name,
      username
    )
  `
    )
    .eq("status", "accepted")
    .or(`requester_id.eq.${layout_data.profile.id},requestee_id.eq.${layout_data.profile.id}`);

  if (friends_res.error) {
    error(friends_res.status, friends_res.error.message);
  }

  const friends = (friends_res.data ?? [])
    .map((relationship) =>
      relationship.requester_id === layout_data.profile.id
        ? relationship.requestee
        : relationship.requester
    )
    .sort((a, b) => (a.name || a.username).localeCompare(b.name || b.username));

  return { friends };
};
