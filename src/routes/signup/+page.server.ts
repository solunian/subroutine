// src/routes/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({ url, locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();

  // if the user is already logged in return them to the account page
  if (session) {
    redirect(303, "/account");
  }

  return { url: url.origin };
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const formData = await request.formData();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;

    // data validation
    const valid_email = /^[\w-\.+]+@([\w-]+\.)+[\w-]{2,8}$/.test(email);
    const valid_pw = /^.{6,}$/.test(password);
    if (!valid_email || !valid_pw) {
      return fail(400, {
        errors: {
          email: valid_email ? null : "email requires a valid email address",
          password: valid_pw ? null : "password requires a minimum length of 6 characters",
        },
      });
    }

    const { error } = await supabase.auth.signUp({ email, password });

    if (error) {
      return fail(400, {
        success: false,
        message: `There was an issue, Please contact support.`,
      });
    }

    redirect(303, "/signin");
  },
};
