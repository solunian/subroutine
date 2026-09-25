import { torch_pair } from "$lib/entry_helpers";
import { save_entry } from "$lib/server/save_entry";
import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import {
  DateTimeSchema,
  empty_to_null,
  empty_to_undefined,
  NormalStrSchema,
  SubroutineVisibility,
  TrimNormalStrSchema,
  UUIDSchema,
} from "$lib/schemas";

export const load: PageServerLoad = async ({
  url,
  params,
  locals: { safeGetSession, supabase },
}) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) {
    redirect(303, `/signin?redirect=${url}`);
  }

  // if logged in...

  // load subroutine and entries
  const sub_res = await supabase
    .from("subroutines")
    .select("*, profiles!inner(id, username), entries(*)")
    .eq("id", params.subroutine_id)
    .order("created_at")
    .order("created_at", { referencedTable: "entries", ascending: true })
    .single();

  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  return {
    is_self: user.id === sub_res.data.profiles.id,
    subroutine: sub_res.data,
  };
};

// update_subroutine, insert_entry, update_entry, delete_entry: must set the timestamp for subroutines.updated_at.

export const actions: Actions = {
  update_subroutine: async ({ request, params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const timestamp = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("timestamp") ?? new Date().toISOString()
    );
    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    const title = v.safeParse(
      v.optional(v.pipe(TrimNormalStrSchema, v.nonEmpty())),
      fdata.get("title") ?? undefined
    );
    const description = v.safeParse(
      v.optional(empty_to_null(NormalStrSchema)),
      fdata.get("description") ?? undefined
    );
    const visibility = v.safeParse(
      v.optional(SubroutineVisibility),
      fdata.get("visibility") ?? undefined
    );
    // const location = v.safeParse(NormalStrSchema, fdata.get("location"));
    // const ascii_art = v.safeParse(v.optional(NormalStrSchema), fdata.get("ascii_art") ?? undefined);
    // datetime is default empty string ""
    const deadline = v.safeParse(
      v.optional(empty_to_undefined(DateTimeSchema)),
      fdata.get("deadline") ?? undefined
    );

    if (
      !timestamp.success ||
      !subroutine_id.success ||
      !title.success ||
      !description.success ||
      !visibility.success ||
      !deadline.success
    ) {
      return fail(400, {
        errors: {
          timestamp: timestamp.issues && v.summarize(timestamp.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          title: title.issues && v.summarize(title.issues),
          description: description.issues && v.summarize(description.issues),
          visibility: visibility.issues && v.summarize(visibility.issues),
          deadline: deadline.issues && v.summarize(deadline.issues),
        },
      });
    }

    const updated_at_prom = supabase
      .from("subroutines")
      .update({ updated_at: timestamp.output })
      .eq("id", subroutine_id.output);

    const update_prom = supabase
      .from("subroutines")
      .update({
        title: title.output,
        description: description.output,
        visibility: visibility.output,
        deadline: deadline.output,
      })
      .eq("id", subroutine_id.output);

    const [updated_at_res, update_res] = await Promise.all([updated_at_prom, update_prom]);

    if (updated_at_res.error) {
      return fail(updated_at_res.status, { message: updated_at_res.error.message });
    }

    if (update_res.error) {
      return fail(update_res.status, { message: update_res.error.message });
    }

    return { form_name: "update_subroutine" };
  },
  delete_subroutine: async ({ params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    if (!subroutine_id.success) {
      return fail(400, {
        errors: {
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
        },
      });
    }

    const del_res = await supabase.from("subroutines").delete().eq("id", subroutine_id.output);

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }

    redirect(303, "/");
  },
  insert_entry: save_entry(false),
  update_entry: save_entry(true),
  delete_entry: async ({ request, params, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const timestamp = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("timestamp") ?? new Date().toISOString()
    );
    const subroutine_id = v.safeParse(UUIDSchema, params.subroutine_id);
    const entry_id = v.safeParse(UUIDSchema, fdata.get("entry_id"));
    if (!timestamp.success || !subroutine_id.success || !entry_id.success) {
      return fail(400, {
        errors: {
          timestamp: timestamp.issues && v.summarize(timestamp.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          entry_id: entry_id.issues && v.summarize(entry_id.issues),
        },
      });
    }

    const updated_at_prom = supabase
      .from("subroutines")
      .update({ updated_at: timestamp.output })
      .eq("id", subroutine_id.output);

    const sub = await supabase
      .from("subroutines")
      .select("type, user_id")
      .eq("id", subroutine_id.output)
      .single();
    if (sub.error || sub.data.user_id !== session.user.id)
      return fail(403, { message: "You cannot delete these entries." });
    let ids = [entry_id.output];
    if (sub.data.type === "torch") {
      const history = await supabase
        .from("entries")
        .select("*")
        .eq("subroutine_id", subroutine_id.output);
      if (history.error) return fail(500, { message: "Could not load the interval." });
      ids = torch_pair(history.data, entry_id.output).map((entry) => entry.id);
      if (!ids.length) return fail(404, { message: "Interval not found." });
    }
    const del_prom = supabase
      .from("entries")
      .delete()
      .in("id", ids)
      .eq("subroutine_id", subroutine_id.output)
      .eq("user_id", session.user.id);

    const [updated_at_res, del_res] = await Promise.all([updated_at_prom, del_prom]);

    if (updated_at_res.error) {
      return fail(updated_at_res.status, { message: updated_at_res.error.message });
    }
    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }
  },
};
