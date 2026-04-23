// src/routes/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { DateTimeSchema, NormalStrSchema, TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    redirect(303, "/");
  }
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    const fdata = await request.formData();

    // data validation
    const type = v.safeParse(TrimNormalStrSchema, fdata.get("type"));
    const title = v.safeParse(TrimNormalStrSchema, fdata.get("title"));
    const description = v.safeParse(v.nullable(NormalStrSchema), fdata.get("description") || null);
    const deadline = v.safeParse(v.nullable(DateTimeSchema), fdata.get("deadline") || null);

    if (!type.success || !title.success || !description.success || !deadline.success) {
      return fail(400, {
        errors: {
          type: type.issues && v.summarize(type.issues),
          title: title.issues && v.summarize(title.issues),
          description: description.issues && v.summarize(description.issues),
          deadline: deadline.issues && v.summarize(deadline.issues),
        },
      });
    }

    // db queries
    const { session } = await safeGetSession();

    const new_sub = await supabase
      .from("subroutines")
      .insert({
        user_id: session?.user.id,
        type: type.output,
        title: title.output,
        description: description.output,
        deadline: deadline.output,
      })
      .select()
      .single();

    if (new_sub.error) {
      return fail(new_sub.status, { message: new_sub.error.message });
    } else {
      // type specific db actions after creating subroutine
      if (type.output === "dot") {
        const init_dot_res = await supabase.from("entries").insert({
          user_id: session?.user.id,
          subroutine_id: new_sub.data.id,
          created_at: new_sub.data.created_at,
          title: "init dot",
        });

        if (init_dot_res.error) {
          return fail(init_dot_res.status, { message: init_dot_res.error.message });
        }
      }
    }

    redirect(303, "/");
  },
};
