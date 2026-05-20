import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import { TrimNormalStrSchema } from "$lib/schemas";
import type { Tables } from "$lib/types/database.types";

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
  const entries_map = new Map<string, Tables<"entries">[]>();

  // quietly errant subroutine with data fetch failed
  const sub_entries = entries_res.map((entry_res) => entry_res.data);
  for (let i = 0; i < subroutines.length; i++) {
    entries_map.set(subroutines[i].id, sub_entries[i] ?? []);
  }

  const username_res = await supabase
    .from("profiles")
    .select("username")
    .eq("id", session.user.id)
    .single();
  if (username_res.error) {
    error(username_res.status, username_res.error.message);
  }

  return { username: username_res.data.username, subroutines, entries_map };
};

export const actions: Actions = {
  append: async ({ request, locals: { supabase, safeGetSession } }) => {
    const fdata = await request.formData();

    // data validation
    const current_timestamp = new Date().toISOString();
    const subroutine_id = v.safeParse(TrimNormalStrSchema, fdata.get("subroutine_id"));

    if (!subroutine_id.success) {
      return fail(400, {
        errors: {
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
        },
      });
    }

    // db queries
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/");
    }

    const updated_at_sub = await supabase
      .from("subroutines")
      .update({ updated_at: current_timestamp })
      .eq("id", subroutine_id.output);

    if (updated_at_sub.error) {
      return fail(updated_at_sub.status, { message: updated_at_sub.error.message });
    }

    const new_entry = await supabase
      .from("entries")
      .insert({
        created_at: current_timestamp,
        subroutine_id: subroutine_id.output,
        user_id: session.user.id,
      })
      .select()
      .single();

    if (new_entry.error) {
      return fail(new_entry.status, { message: new_entry.error.message });
    }
  },
};
