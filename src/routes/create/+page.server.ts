// src/routes/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions } from "./$types";
import * as v from "valibot";
import { DateTimeSchema, NormalStrSchema, TrimNormalStrSchema } from "$lib/schemas";

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
    const { user } = await safeGetSession();

    const { error } = await supabase.from("subroutines").insert({
      user_id: user?.id,
      type: type.output,
      title: title.output,
      description: description.output,
      deadline: deadline.output,
    });

    if (error) {
      return fail(400, { message: error.message.toLowerCase() });
    }

    redirect(303, "/");
  },
};
