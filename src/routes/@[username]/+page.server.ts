import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import { TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ params, locals: { safeGetSession, supabase } }) => {
  const { session } = await safeGetSession();

  // visible for anon
  const profile_res = await supabase
    .from("profiles")
    .select("name, bio, id")
    .eq("username", params.username)
    .single();

  if (profile_res.error) {
    error(400, "invalid username");
  }

  if (!session) {
    return { username: params.username, profile: profile_res.data };
  }

  // if logged in...
  // load relationship data
  const user_id = session.user.id;
  const other_id = profile_res.data.id;

  const relationship_res = await supabase
    .from("relationships")
    .select("*")
    .or(
      `and(requester_id.eq.${user_id},requestee_id.eq.${other_id}),and(requester_id.eq.${other_id},requestee_id.eq.${user_id})`
    )
    .maybeSingle();

  // load subroutines
  const sub_res = await supabase.from("subroutines").select("*").eq("user_id", profile_res.data.id);
  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }

  const entries_res = await Promise.all(
    sub_res.data.map((sub) => supabase.from("entries").select("*").eq("subroutine_id", sub.id))
  );
  // quiet errant subroutine with data fetch failed

  return {
    session,
    username: params.username,
    profile: profile_res.data,
    subroutines: sub_res.data,
    sub_entries: entries_res.map((entry_res) => (entry_res.data === null ? [] : entry_res.data)),
    relationship: relationship_res.data,
  };
};

export const actions: Actions = {
  request_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/");
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
      requester_id: session.user.id,
      requestee_id: other_id.output,
      status: "pending",
    });

    if (req_res.error) {
      return fail(req_res.status, { message: req_res.error.message });
    }
  },
  delete_relation: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { session } = await safeGetSession();
    if (!session) {
      redirect(303, "/");
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

    const user_id = session.user.id;
    const other_id = other_id_vbot.output;
    const del_res = await supabase
      .from("relationships")
      .delete()
      .or(
        `and(requester_id.eq.${user_id},requestee_id.eq.${other_id}),and(requester_id.eq.${other_id},requestee_id.eq.${user_id})`
      );

    if (del_res.error) {
      return fail(del_res.status, { message: del_res.error.message });
    }
  },
};
