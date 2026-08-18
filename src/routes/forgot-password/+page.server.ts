import { fail } from "@sveltejs/kit";
import type { Actions } from "./$types";
import * as v from "valibot";
import { EmailSchema } from "$lib/schemas";

export const actions: Actions = {
  default: async ({ request, url, locals: { supabase } }) => {
    const form_data = await request.formData();
    const email = v.safeParse(EmailSchema, form_data.get("email"));

    if (!email.success) {
      return fail(400, {
        errors: {
          email: email.issues && v.summarize(email.issues),
        },
      });
    }

    const { error } = await supabase.auth.resetPasswordForEmail(email.output, {
      redirectTo: `${url.origin}/reset-password`,
    });

    if (error) {
      console.error("unable to send password reset email", error);
      return fail(400, { message: "unable to send reset email. try again later." });
    }

    return {
      success: true,
      message: "if an account exists for that email address, a reset link has been sent.",
    };
  },
};
