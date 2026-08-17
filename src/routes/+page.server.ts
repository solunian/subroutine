import { error, fail, redirect, type Actions } from "@sveltejs/kit";
import type { PageServerLoad } from "./$types";
import * as v from "valibot";
import { FinNumberSchema, TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session, user } = await safeGetSession();
  if (!session || !user) {
    return;
  }

  const sub_prom = supabase
    .from("subroutines")
    .select("*, entries(*)")
    .eq("user_id", user.id)
    .order("created_at")
    .order("created_at", { referencedTable: "entries", ascending: true });
  const username_prom = supabase.from("profiles").select("username").eq("id", user.id).single();

  const [sub_res, username_res] = await Promise.all([sub_prom, username_prom]);

  if (sub_res.error) {
    error(sub_res.status, sub_res.error.message);
  }
  if (username_res.error) {
    error(username_res.status, username_res.error.message);
  }

  return { subroutines: sub_res.data, username: username_res.data.username };
};

export const actions: Actions = {
  append: async ({ request, locals: { supabase, safeGetSession } }) => {
    const fdata = await request.formData();

    // data validation
    const created_at = v.safeParse(
      TrimNormalStrSchema,
      fdata.get("created_at") ?? new Date().toISOString()
    );
    const subroutine_id = v.safeParse(TrimNormalStrSchema, fdata.get("subroutine_id"));
    const subroutine_type = v.safeParse(
      v.nullable(TrimNormalStrSchema),
      fdata.get("subroutine_type")
    );

    if (!subroutine_id.success || !created_at.success || !subroutine_type.success) {
      return fail(400, {
        errors: {
          created_at: created_at.issues && v.summarize(created_at.issues),
          subroutine_id: subroutine_id.issues && v.summarize(subroutine_id.issues),
          subroutine_type: subroutine_type.issues && v.summarize(subroutine_type.issues),
        },
      });
    }

    // db queries
    const { session, user } = await safeGetSession();
    if (!session || !user) {
      redirect(303, "/signin");
    }

    // custom data json for each subroutine
    const custom_data_map = new Map();
    if (subroutine_type.output) {
      if (subroutine_type.output === "semaphore") {
        const value = v.safeParse(FinNumberSchema, fdata.get("value"));
        if (!value.success) {
          return fail(400, {
            errors: {
              value: value.issues && v.summarize(value.issues),
            },
          });
        }

        custom_data_map.set("value", value.output);
      }
    }

    const updated_at_sub = await supabase
      .from("subroutines")
      .update({ updated_at: created_at.output })
      .eq("id", subroutine_id.output);

    if (updated_at_sub.error) {
      return fail(updated_at_sub.status, { message: updated_at_sub.error.message });
    }

    const new_entry = await supabase
      .from("entries")
      .insert({
        created_at: created_at.output,
        subroutine_id: subroutine_id.output,
        user_id: user.id,
        data: custom_data_map.size === 0 ? null : Object.fromEntries(custom_data_map),
      })
      .select()
      .single();

    if (new_entry.error) {
      return fail(new_entry.status, { message: new_entry.error.message });
    }
  },
};
