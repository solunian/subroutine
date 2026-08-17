import { json } from "@sveltejs/kit";

export async function GET({ url, locals: { supabase } }) {
  let q = url.searchParams.get("q")?.trim() ?? "";

  // escapes for postgREST .or()
  q = q.slice(0, 50).replace(/[,%_()\\"]/g, "");

  if (q.length === 0) {
    return json([]);
  }

  // limit to 64 chars
  if (q.length > 64) {
    return json([], { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("name, username, avatar_url")
    .or(`name.ilike.%${q}%,username.ilike.%${q}%`)
    .limit(10);

  if (error) {
    console.error(error);
    return json([], { status: 500 });
  }

  return json(data);
}
