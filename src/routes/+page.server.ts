import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    return;
  }

  const subroutines = [];
  const sub_res = await supabase
    .from("subroutines")
    .select("*")
    .eq("user_id", session.user.id)
    .order("created_at");
  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  const entries_res = await Promise.all(
    sub_res.data.map((sub) =>
      supabase.from("entries").select("*").eq("subroutine_id", sub.id).order("created_at")
    )
  );

  for (let i = 0; i < sub_res.data.length; i++) {
    if (entries_res[i].error) {
      // quietly errant subroutine with data fetch failed
      subroutines.push([sub_res.data[i], []]);
    } else {
      subroutines.push([sub_res.data[i], entries_res[i].data]);
    }
  }

  return { subroutines };
};
