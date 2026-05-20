import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import { TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    return;
  }

  // if logged in...

  // load subroutine and entries
  const sub_res = await supabase
    .from("subroutines")
    .select("*")
    .eq("id", params.subroutine_id)
    .single();
  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  const entries_res = await supabase
    .from("entries")
    .select("*")
    .eq("subroutine_id", params.subroutine_id)
    .order("created_at");

  const subroutine = sub_res.data;
  const entries = entries_res.data ?? [];

  return {
    subroutine,
    entries,
  };
};

export const actions: Actions = {
  delete_subroutine: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/");
    }

    const fdata = await request.formData();
    const sub_id_vbot = v.safeParse(TrimNormalStrSchema, fdata.get("subroutine_id"));
    if (!sub_id_vbot.success) {
      return fail(400, {
        errors: {
          other_id: sub_id_vbot.issues && v.summarize(sub_id_vbot.issues),
        },
      });
    }

    const sub_id = sub_id_vbot.output;
    const del_res = await supabase.from("subroutines").delete().eq("id", sub_id);

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }

    redirect(303, "/");
  },
};
