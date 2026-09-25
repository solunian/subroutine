import { fail, redirect, type Action } from "@sveltejs/kit";
import * as v from "valibot";
import { FinNumberSchema, TimestampSchema, UUIDSchema } from "$lib/schemas";
import { supports_entry_editor, torch_pair, torch_overlaps } from "$lib/entry_helpers";
import type { TablesInsert } from "$lib/types/database.types";

export function save_entry(editing: boolean): Action {
  return async ({ request, params, locals: { safeGetSession, supabase } }) => {
    const { session, user } = await safeGetSession();
    if (!session || !user) redirect(303, "/signin");
    const form = await request.formData();
    const id = v.safeParse(UUIDSchema, params.subroutine_id);
    if (!id.success) return fail(400, { message: "Invalid subroutine." });
    const sub = await supabase
      .from("subroutines")
      .select("type, user_id")
      .eq("id", id.output)
      .single();
    if (sub.error || sub.data.user_id !== user.id)
      return fail(403, { message: "You cannot edit these entries." });
    const type = sub.data.type;
    if (!supports_entry_editor(type))
      return fail(400, {
        message: "This subroutine type does not support entry insertion or editing.",
      });

    const created_at = v.safeParse(
      TimestampSchema,
      form.get("created_at") ?? form.get("timestamp") ?? new Date().toISOString()
    );
    if (!created_at.success || !Number.isFinite(Date.parse(created_at.output)))
      return fail(400, { message: "Choose a valid time." });
    const entry_id = v.safeParse(UUIDSchema, form.get("entry_id"));
    if (editing && !entry_id.success) return fail(400, { message: "Invalid entry." });
    const history = await supabase
      .from("entries")
      .select("*")
      .eq("subroutine_id", id.output)
      .order("created_at")
      .order("id");
    if (history.error) return fail(500, { message: "Could not load entries. Please try again." });
    const original = editing
      ? history.data.find((entry) => entry.id === entry_id.output && entry.user_id === user.id)
      : undefined;
    if (editing && !original) return fail(404, { message: "Entry not found." });
    const base = { subroutine_id: id.output, user_id: user.id };
    let rows: TablesInsert<"entries">[] = [{ ...original, ...base, created_at: created_at.output }];
    if (type === "semaphore") {
      const value = v.safeParse(FinNumberSchema, form.get("value"));
      if (!value.success) return fail(400, { message: "Enter a finite numeric value." });
      rows[0].data = { ...original?.data, value: value.output };
    }
    if (type === "torch") {
      const pair = original ? torch_pair(history.data, original.id) : [];
      if (pair.some((entry) => entry.user_id !== user.id))
        return fail(403, { message: "You cannot edit this interval." });
      const end_input = form.get("end_at");
      // Existing quick controls append a single on/off event. The editor submits an interval.
      if (form.has("created_at") || editing) {
        const end = end_input ? v.safeParse(TimestampSchema, end_input) : null;
        if ((end && !end.success) || (!end && (!editing || pair.length === 2)))
          return fail(400, { message: "Choose a valid end time." });
        const end_at = end?.success ? end.output : null;
        const start_time = Date.parse(created_at.output);
        const end_time = end_at ? Date.parse(end_at) : Infinity;
        if (Number.isNaN(end_time) || end_time <= start_time)
          return fail(400, { message: "End time must be after the beginning." });
        const others = history.data.filter((entry) => !pair.some((item) => item.id === entry.id));
        if (torch_overlaps(others, start_time, end_time))
          return fail(400, {
            message:
              "This interval overlaps another torch interval. Choose times between existing intervals.",
          });
        rows = [{ ...pair[0], ...base, created_at: created_at.output }];
        if (end_at) rows.push({ ...pair[1], ...base, created_at: end_at });
      } else if (
        history.data.some((entry) => Date.parse(entry.created_at) >= Date.parse(created_at.output))
      ) {
        return fail(400, { message: "The timer time must be after the latest entry." });
      }
    }
    if (editing) rows = rows.map((row) => ({ ...row, id: row.id ?? crypto.randomUUID() }));
    const saved = editing
      ? await supabase.from("entries").upsert(rows, { defaultToNull: false }).select("id")
      : await supabase.from("entries").insert(rows).select("id");
    if (saved.error) return fail(500, { message: "Could not save the entry. Please try again." });
    const touched = await supabase
      .from("subroutines")
      .update({ updated_at: new Date().toISOString() })
      .eq("id", id.output);
    return {
      form_name: editing ? "update_entry" : "insert_entry",
      warning: touched.error
        ? "Entry saved, but the subroutine update time could not be refreshed."
        : undefined,
    };
  };
}
