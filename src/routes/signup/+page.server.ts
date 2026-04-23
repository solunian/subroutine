// src/routes/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { EmailSchema, TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();

  // if the user is already logged in return them to the home page
  if (session) {
    redirect(303, "/");
  }

  return { url: url.origin };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();

    // data validation
    const email = v.safeParse(EmailSchema, formData.get("email"));
    const password = v.safeParse(TrimNormalStrSchema, formData.get("password"));

    if (!email.success || !password.success) {
      return fail(400, {
        errors: {
          email: email.issues && v.summarize(email.issues),
          password: password.issues && v.summarize(password.issues),
        },
      });
    }

    // sign up
    const { error } = await supabase.auth.signUp({
      email: email.output,
      password: password.output,
    });

    if (error) {
      return fail(400, { message: error.message });
    }

    redirect(303, "/signin");
  },
};
