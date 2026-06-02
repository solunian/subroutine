import { RelationshipStatusType, TrimNormalStrSchema } from "$lib/schemas";
import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import * as v from "valibot";
import type { PageServerLoad } from "./$types";
import type { Tables } from "$lib/types/database.types";

export const load: PageServerLoad = async ({ parent, locals: { safeGetSession, supabase } }) => {
  const { session, user } = await safeGetSession();

  if (!session || !user) {
    return;
  }

  // load relevant page data after the layout load
  const layout_data = await parent();

  // load subroutines
  const sub_res = await supabase
    .from("subroutines")
    .select("*")
    .eq("user_id", layout_data.profile.id)
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

  const num_friends = await supabase
    .from("relationships")
    .select("*", { count: "exact" })
    .eq("status", "accepted")
    .or(`requester_id.eq.${layout_data.profile.id},requestee_id.eq.${layout_data.profile.id}`);

  return { subroutines, entries_map, num_friends: num_friends.count ?? 0 };
};

export const actions: Actions = {
  request_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();
    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const other_id = v.safeParse(TrimNormalStrSchema, fdata.get("other_id"));
    if (!other_id.success) {
      return fail(400, {
        errors: {
          other_id: other_id.issues && v.summarize(other_id.issues),
        },
      });
    }

    const req_res = await supabase.from("relationships").insert({
      requester_id: user.id,
      requestee_id: other_id.output,
      status: "pending",
    });

    if (req_res.error) {
      return fail(req_res.status, { message: req_res.error.message });
    }

    return { form_name: "request_relation" };
  },
  delete_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const other_id_vbot = v.safeParse(TrimNormalStrSchema, fdata.get("other_id"));
    if (!other_id_vbot.success) {
      return fail(400, {
        errors: {
          other_id: other_id_vbot.issues && v.summarize(other_id_vbot.issues),
        },
      });
    }

    const other_id = other_id_vbot.output;
    const del_res = await supabase
      .from("relationships")
      .delete()
      .or(
        `and(requester_id.eq.${user.id},requestee_id.eq.${other_id}),and(requester_id.eq.${other_id},requestee_id.eq.${user.id})`
      );

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }

    return { form_name: "delete_relation" };
  },
  update_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();

    if (!session || !user) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();
    const other_id_vbot = v.safeParse(TrimNormalStrSchema, fdata.get("other_id"));
    const status_vbot = v.safeParse(RelationshipStatusType, fdata.get("status"));
    if (!other_id_vbot.success || !status_vbot.success) {
      return fail(400, {
        errors: {
          other_id: other_id_vbot.issues && v.summarize(other_id_vbot.issues),
          status: status_vbot.issues && v.summarize(status_vbot.issues),
        },
      });
    }

    const other_id = other_id_vbot.output;
    const update_res = await supabase
      .from("relationships")
      .update({ status: status_vbot.output })
      .or(
        `and(requester_id.eq.${user.id},requestee_id.eq.${other_id}),and(requester_id.eq.${other_id},requestee_id.eq.${user.id})`
      );

    if (update_res.error) {
      return fail(update_res.status, { message: update_res.error.message });
    }

    return { form_name: "update_relation" };
  },
};
