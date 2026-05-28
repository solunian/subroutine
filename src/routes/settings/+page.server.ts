import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { TrimNormalStrSchema, URLSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession();
  const user_id = (await supabase.auth.getUser()).data.user?.id;
  if (!session || !user_id) {
    redirect(303, "/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, name, website, avatar_url")
    .eq("id", user_id)
    .single();

  return { session, profile };
};

export const actions: Actions = {
  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const { session } = await safeGetSession();
    const user_id = (await supabase.auth.getUser()).data.user?.id;
    if (!session || !user_id) {
      redirect(303, "/signin");
    }

    const fdata = await request.formData();

    const current_timestamp = new Date().toISOString();

    const name = v.safeParse(v.optional(TrimNormalStrSchema), fdata.get("name") ?? undefined);
    const username = v.safeParse(
      v.optional(TrimNormalStrSchema),
      fdata.get("username") ?? undefined
    );
    const website = v.safeParse(v.optional(URLSchema), fdata.get("website") ?? undefined);
    // const avatar_url = v.safeParse(
    //   v.optional(TrimNormalStrSchema),
    //   fdata.get("avatar_url") ?? undefined
    // );

    if (!name.success || !username.success || !website.success) {
      return fail(400, {
        errors: {
          name: name.issues && v.summarize(name.issues),
          username: username.issues && v.summarize(username.issues),
          website: website.issues && v.summarize(website.issues),
          // avatar_url: avatar_url.issues && v.summarize(avatar_url.issues),
        },
      });
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        name: name.output,
        username: username.output,
        website: website.output,
        // avatar_url: avatar_url.output,
        updated_at: current_timestamp,
      })
      .eq("id", user_id);

    if (error) {
      return fail(400, { message: error.message });
    }

    return {
      name: name.output,
      username: username.output,
      website: website.output,
      // avatar_url: avatar_url.output,
    };
  },
};
