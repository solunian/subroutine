import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { DateTimeSchema, NormalStrSchema, SubroutineType, TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();
  if (!session) {
    redirect(303, `/signin?redirect=${url}`);
  }
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase, safeGetSession } }) => {
    const fdata = await request.formData();

    // data validation
    const created_at = new Date().toISOString();
    const type = v.safeParse(SubroutineType, fdata.get("type"));
    const title = v.safeParse(TrimNormalStrSchema, fdata.get("title"));
    const description = v.safeParse(
      v.optional(NormalStrSchema),
      fdata.get("description") ?? undefined
    );
    // datetime is default empty string ""
    const deadline = v.safeParse(
      v.optional(DateTimeSchema),
      fdata.get("deadline") === "" ? undefined : (fdata.get("deadline") ?? undefined)
    );

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
    const user_id = (await supabase.auth.getUser()).data.user?.id;
    if (!session || !user_id) {
      redirect(303, "/signin");
    }

    const new_sub = await supabase
      .from("subroutines")
      .insert({
        created_at,
        user_id,
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
          created_at,
          user_id,
          subroutine_id: new_sub.data.id,
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
