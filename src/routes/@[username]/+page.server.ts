import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ params, locals: { supabase } }) => {
  // visible even if not signed in
  const res = await supabase
    .from("profiles")
    .select("name, bio")
    .eq("username", params.username)
    .single();

  if (res.error) {
    error(400, "invalid username");
  }

  return { username: params.username, profile: res.data };
};
