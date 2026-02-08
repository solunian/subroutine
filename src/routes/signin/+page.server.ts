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
    if (!valid_email) {
      return fail(400, {
        errors: {
          email: "email requires a valid email address",
        },
      });
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.code == "email_not_confirmed") {
        return fail(400, {
          success: false,
          message: "confirm your email",
        });
      } else {
        return fail(400, {
          success: false,
          message: "idk bruv",
        });
      }
    }
  },
};
