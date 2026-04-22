import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    return;
  }

  let subroutines = [];
  const sub_res = await supabase.from("subroutines").select("*").eq("user_id", session.user.id);
  if (sub_res.error) {
    error(500, sub_res.error.message);
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

  return { subroutines };
};
