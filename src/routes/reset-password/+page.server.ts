import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { PasswordSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { user } = await safeGetSession();

  if (!user) {
    redirect(303, "/signin");
  }
};

export const actions: Actions = {
  default: async ({ request, locals: { safeGetSession, supabase } }) => {
    const { user } = await safeGetSession();

    if (!user) {
      redirect(303, "/signin");
    }

    const form_data = await request.formData();
    const password = v.safeParse(PasswordSchema, form_data.get("password"));
    const confirm_password = v.safeParse(PasswordSchema, form_data.get("confirm_password"));

    if (!password.success || !confirm_password.success) {
      return fail(400, {
        errors: {
          password: password.issues && v.summarize(password.issues),
          confirm_password: confirm_password.issues && v.summarize(confirm_password.issues),
        },
      });
    }

    if (password.output !== confirm_password.output) {
      return fail(400, {
        errors: {
          password: undefined,
          confirm_password: "invalid password: passwords do not match",
        },
      });
    }

    const { error } = await supabase.auth.updateUser({ password: password.output });

    if (error) {
      console.error("unable to reset password", error);
      return fail(400, {
        message: "unable to reset password. request a new reset link and try again.",
      });
    }

    const { error: signout_error } = await supabase.auth.signOut({ scope: "local" });

    if (signout_error) {
      console.error("unable to sign out after password reset", signout_error);
      redirect(303, "/signout");
    }

    redirect(303, "/signin?reset=success");
  },
};
