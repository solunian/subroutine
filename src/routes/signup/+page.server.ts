// src/routes/+page.server.ts
import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { EmailSchema, PasswordSchema, TrimNormalStrSchema, UsernameSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { safeGetSession } }) => {
  const { session } = await safeGetSession();

  // if the user is already logged in return them to the home page
  if (session) {
    redirect(303, "/");
  }
};

export const actions: Actions = {
  default: async ({ request, locals: { supabase } }) => {
    const fdata = await request.formData();

    // data validation
    const name = v.safeParse(TrimNormalStrSchema, fdata.get("name"));
    const username = v.safeParse(UsernameSchema, fdata.get("username"));
    const email = v.safeParse(EmailSchema, fdata.get("email"));
    const password = v.safeParse(PasswordSchema, fdata.get("password"));

    if (!name.success || !username.success || !email.success || !password.success) {
      return fail(400, {
        errors: {
          name: name.issues && v.summarize(name.issues),
          username: username.issues && v.summarize(username.issues),
          email: email.issues && v.summarize(email.issues),
          password: password.issues && v.summarize(password.issues),
        },
      });
    }

    const username_exists = await supabase
      .from("profiles")
      .select("username", { head: true, count: "exact" })
      .eq("username", username.output);

    if (username_exists.error) {
      console.log(username_exists.error);
      return fail(400, {
        errors: {
          name: undefined,
          username: "invalid username: username already exists",
          email: undefined,
          password: undefined,
        },
      });
    }

    // sign up
    const signup_res = await supabase.auth.signUp({
      email: email.output,
      password: password.output,
      options: {
        data: {
          name,
          username,
        },
      },
    });

    if (signup_res.error) {
      return fail(400, { message: signup_res.error.message });
    }

    redirect(303, "/signin");
  },
};
