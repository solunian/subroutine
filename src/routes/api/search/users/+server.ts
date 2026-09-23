import * as v from "valibot";
import { SearchResultSchema } from "$lib/search";
import { json } from "@sveltejs/kit";

export async function GET({ url, locals: { supabase } }) {
  const q = url.searchParams.get("q")?.trim() ?? "";
  const raw_limit = url.searchParams.get("limit") ?? "20";
  const raw_offset = url.searchParams.get("offset") ?? "0";
  const limit = Number(raw_limit);
  const offset = Number(raw_offset);

  if (!/^\d+$/.test(raw_limit) || !Number.isInteger(limit) || limit < 1 || limit > 50) {
    return json({ error: "limit must be an integer between 1 and 50" }, { status: 400 });
  }
  if (!/^\d+$/.test(raw_offset) || !Number.isInteger(offset) || offset > 2147483647) {
    return json({ error: "offset must be an integer between 0 and 2147483647" }, { status: 400 });
  }

  if (q.length === 0) {
    return json({ users: [], has_more: false, next_offset: null });
  }

  // limit to 64 chars
  if (q.length > 64) {
    return json({ error: "search must be 64 chars or fewer" }, { status: 400 });
  }

  try {
    const { data, error } = await supabase.rpc("search_users_page", {
      p_query: q,
      p_limit: limit,
      p_offset: offset,
    });

    if (error) throw error;
    if (!v.safeParse(SearchResultSchema, data).success) {
      throw new Error("Invalid search_users_page response");
    }
    return json(data);
  } catch (error) {
    console.error("User search failed:", error);
    return json({ error: "couldn't load profiles. please try again." }, { status: 500 });
  }
}
