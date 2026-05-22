import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import { DateTimeSchema, NormalStrSchema, TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({
  url,
  params,
  locals: { safeGetSession, supabase },
}) => {
  const { session } = await safeGetSession();
  if (!session) {
    redirect(303, `/signin?redirect=${url}`);
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
  edit_subroutine: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const subroutine_id = v.safeParse(NormalStrSchema, fdata.get("subroutine_id"));
    const title = v.safeParse(v.optional(TrimNormalStrSchema), fdata.get("title") ?? undefined);
    const description = v.safeParse(
      v.optional(NormalStrSchema),
      fdata.get("description") ?? undefined
    );
    // const location = v.safeParse(NormalStrSchema, fdata.get("location"));
    const ascii_art = v.safeParse(v.optional(NormalStrSchema), fdata.get("ascii_art") ?? undefined);
    // datetime is default empty string ""
    const deadline = v.safeParse(
      v.optional(DateTimeSchema),
      fdata.get("deadline") === "" ? undefined : (fdata.get("deadline") ?? undefined)
    );

    if (
      !subroutine_id.success ||
      !title.success ||
      !description.success ||
      !ascii_art.success ||
      !deadline.success
    ) {
      return fail(400, {
        errors: {
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          title: title.issues && v.summarize(title.issues),
          description: description.issues && v.summarize(description.issues),
          ascii_art: ascii_art.issues && v.summarize(ascii_art.issues),
          deadline: deadline.issues && v.summarize(deadline.issues),
        },
      });
    }

    const edit_res = await supabase
      .from("subroutines")
      .update({
        title: title.output,
        description: description.output,
        ascii_art: ascii_art.output,
        deadline: deadline.output,
      })
      .eq("id", subroutine_id.output);

    if (edit_res.error) {
      return fail(edit_res.status, { message: edit_res.error.message });
    }

    return { form_name: "edit_subroutine" };
  },
  delete_subroutine: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
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
