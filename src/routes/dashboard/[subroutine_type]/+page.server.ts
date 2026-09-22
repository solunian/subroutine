import { error, redirect } from "@sveltejs/kit";
import * as v from "valibot";
import { SubroutineType } from "$lib/schemas";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async ({
  params,
  url,
  locals: { supabase, safeGetSession },
}) => {
  const type = v.safeParse(SubroutineType, params.subroutine_type);
  if (!type.success) {
    error(404, "unknown subroutine type");
  }

  const { session, user } = await safeGetSession();
  if (!session || !user) {
    redirect(303, `/signin?redirect=${encodeURIComponent(url.pathname)}`);
  }

  const result = await supabase
    .from("subroutines")
    .select("*, entries(*)")
    .eq("user_id", user.id)
    .eq("type", type.output)
    .order("created_at")
    .order("created_at", { referencedTable: "entries", ascending: true });

  if (result.error) {
    error(result.status, result.error.message);
  }

  return { subroutine_type: type.output, subroutines: result.data };
};
