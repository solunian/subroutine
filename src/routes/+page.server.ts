import { error } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    return;
  }

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

  const subroutines = sub_res.data;
  // quietly errant subroutine with data fetch failed
  const sub_entries = entries_res.map((entry_res) =>
    entry_res.data === null ? [] : entry_res.data
  );

  return { subroutines, sub_entries };
};
