import { fail, redirect } from "@sveltejs/kit";
import type { Actions, PageServerLoad } from "./$types";
import * as v from "valibot";
import { TrimNormalStrSchema } from "$lib/schemas";

export const load: PageServerLoad = async ({ locals: { supabase, safeGetSession } }) => {
  const { session } = await safeGetSession();

  if (!session) {
    redirect(303, "/");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select(`username, full_name, website, avatar_url`)
    .eq("id", session.user.id)
    .single();

  return { session, profile };
};

export const actions: Actions = {
  update: async ({ request, locals: { supabase, safeGetSession } }) => {
    const fdata = await request.formData();

    const full_name = v.safeParse(v.nullable(TrimNormalStrSchema), fdata.get("full_name"));
    const username = v.safeParse(v.nullable(TrimNormalStrSchema), fdata.get("username"));
    const website = v.safeParse(v.nullable(TrimNormalStrSchema), fdata.get("website"));
    const avatar_url = v.safeParse(v.nullable(TrimNormalStrSchema), fdata.get("avatar_url"));

    if (!full_name.success || !username.success || !website.success || !avatar_url) {
      return fail(400, {
        errors: {
          full_name: full_name.issues && v.summarize(full_name.issues),
          username: username.issues && v.summarize(username.issues),
          website: website.issues && v.summarize(website.issues),
          avatar_url: avatar_url.issues && v.summarize(avatar_url.issues),
        },
      });
    }

    const { session } = await safeGetSession();
    const { error } = await supabase.from("profiles").upsert({
      id: session?.user.id,
      full_name: full_name.output,
      username: username.output,
      website: website.output,
      avatar_url: avatar_url.output,
      updated_at: new Date(),
    });

    if (error) {
      return fail(400, { message: error.message.toLowerCase() });
    }

    return {
      full_name: full_name.output,
      username: username.output,
      website: website.output,
      avatar_url: avatar_url.output,
    };
  },
};
