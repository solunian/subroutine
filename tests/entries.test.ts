import { entry_rows, interval_duration } from "../src/lib/entry_helpers";
import type { RequestEvent } from "@sveltejs/kit";
import type { Tables, TablesInsert } from "../src/lib/types/database.types";
import { test } from "node:test";
import assert from "node:assert/strict";
import { adjacent_entries, torch_pair, torch_overlaps } from "../src/lib/entry_helpers.ts";
import { save_entry } from "../src/lib/server/save_entry.ts";

const subroutine_id = "11111111-1111-4111-8111-111111111111";
const user_id = "22222222-2222-4222-8222-222222222222";
const time = (hour: number) => `2026-09-20T${String(hour).padStart(2, "0")}:00:00.000Z`;
const entry = (hour: number, value = 0) => ({
  id: `33333333-3333-4333-8333-${String(hour).padStart(12, "0")}`,
  subroutine_id,
  user_id,
  created_at: time(hour),
  data: { value },
  title: null,
  description: null,
  location: null,
  ascii_art: null,
});

async function submit({
  type = "dot",
  history = [],
  fields = {},
  editing = false,
  owner = user_id,
  write_error = false,
}: {
  type?: string;
  history?: Tables<"entries">[];
  fields?: Record<string, string | undefined>;
  editing?: boolean;
  owner?: string;
  write_error?: boolean;
} = {}) {
  const writes: { operation: string; rows: TablesInsert<"entries">[] }[] = [];
  const supabase = {
    from(table: string) {
      let operation = "select";
      const query = {
        select() {
          return query;
        },
        eq() {
          return query;
        },
        order() {
          return query;
        },
        single() {
          return Promise.resolve({ data: { type, user_id: owner }, error: null });
        },
        insert(rows: TablesInsert<"entries">[]) {
          operation = "insert";
          writes.push({ operation, rows });
          return query;
        },
        upsert(rows: TablesInsert<"entries">[]) {
          operation = "upsert";
          writes.push({ operation, rows });
          return query;
        },
        update() {
          operation = "update";
          return query;
        },
        then(resolve: (value: unknown) => unknown, reject?: (reason: unknown) => unknown) {
          return Promise.resolve({
            data: table === "entries" && operation === "select" ? history : [],
            error: write_error && operation !== "select" ? { message: "failed" } : null,
          }).then(resolve, reject);
        },
      };
      return query;
    },
  };
  const form = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) form.set(key, value);
  }
  const result = await save_entry(editing)({
    request: new Request("http://localhost", { method: "POST", body: form }),
    params: { subroutine_id },
    locals: {
      supabase,
      safeGetSession: async () => ({ session: { user: { id: user_id } }, user: { id: user_id } }),
    },
  } as unknown as RequestEvent);
  return { result: result as { status?: number }, writes };
}

test("semaphore neighbors follow time, exclude the edited entry, and cover boundaries", () => {
  const entries = [entry(14, 30), entry(10, 10), entry(12, 20)];
  assert.equal(adjacent_entries(entries, time(13)).before?.data.value, 20);
  assert.equal(adjacent_entries(entries, time(13)).after?.data.value, 30);
  assert.equal(adjacent_entries(entries, time(12), entries[2].id).before?.data.value, 10);
  assert.equal(adjacent_entries(entries, time(9)).before, undefined);
  assert.equal(adjacent_entries(entries, time(15)).after, undefined);
});

test("torch pairing and overlap checks handle unsorted events and running intervals", () => {
  const entries = [entry(12), entry(10), entry(16)];
  assert.deepEqual(
    torch_pair(entries, entry(12).id).map((row) => row.created_at),
    [time(10), time(12)]
  );
  assert.equal(torch_overlaps(entries, Date.parse(time(13)), Date.parse(time(15))), false);
  assert.equal(torch_overlaps(entries, Date.parse(time(12)), Date.parse(time(15))), true);
  assert.equal(torch_overlaps(entries, Date.parse(time(17)), Date.parse(time(18))), true);
});

test("dot inserts the selected time and semaphore saves a numeric value", async () => {
  const dot = await submit({ fields: { created_at: time(10) } });
  assert.equal(dot.writes[0].rows[0].created_at, time(10));
  const semaphore = await submit({
    type: "semaphore",
    fields: { created_at: time(11), value: "-2.5" },
  });
  assert.deepEqual(semaphore.writes[0].rows[0].data, { value: -2.5 });
  const invalid = await submit({ type: "semaphore", fields: { value: "Infinity" } });
  assert.equal(invalid.result.status, 400);
  assert.equal(invalid.writes.length, 0);
});

test("unsupported types and non-owners cannot insert", async () => {
  for (const type of ["summit", "blaze", "loop", "nudge", "ping", "ledger", "journal"]) {
    const { result, writes } = await submit({ type });
    assert.equal(result.status, 400);
    assert.equal(writes.length, 0);
  }
  assert.equal((await submit({ owner: "someone-else" })).result.status, 403);
});

test("torch inserts both endpoints together and rejects invalid intervals", async () => {
  const valid = await submit({ type: "torch", fields: { created_at: time(10), end_at: time(12) } });
  assert.equal(valid.writes.length, 1);
  assert.equal(valid.writes[0].rows.length, 2);
  for (const fields of [
    { created_at: time(12), end_at: time(10) },
    { created_at: time(12) },
    { created_at: time(10), end_at: time(10) },
  ]) {
    const invalid = await submit({ type: "torch", fields });
    assert.equal(invalid.result.status, 400);
    assert.equal(invalid.writes.length, 0);
  }
  const overlapping = await submit({
    type: "torch",
    history: [entry(10), entry(12)],
    fields: { created_at: time(11), end_at: time(13) },
  });
  assert.equal(overlapping.result.status, 400);
});

test("editing either torch endpoint updates its pair and can finish a running torch", async () => {
  const edited = await submit({
    type: "torch",
    history: [entry(10), entry(12)],
    editing: true,
    fields: { entry_id: entry(12).id, created_at: time(9), end_at: time(13) },
  });
  assert.deepEqual(
    edited.writes[0].rows.map((row) => row.id),
    [entry(10).id, entry(12).id]
  );
  const finished = await submit({
    type: "torch",
    history: [entry(10)],
    editing: true,
    fields: { entry_id: entry(10).id, created_at: time(10), end_at: time(13) },
  });
  assert.equal(finished.writes[0].rows.length, 2);
  assert.ok(finished.writes[0].rows[1].id);
});

test("quick torch controls still append one event; failed saves return a failure", async () => {
  const quick = await submit({
    type: "torch",
    history: [entry(10)],
    fields: { timestamp: time(12) },
  });
  assert.equal(quick.writes[0].rows.length, 1);
  assert.equal((await submit({ write_error: true })).result.status, 500);
});

test("torch rows pair before pagination and retain a running interval", () => {
  const rows = entry_rows([entry(16), entry(12), entry(10)], "torch");
  assert.equal(rows.length, 2);
  assert.equal(rows[0].start.id, entry(10).id);
  assert.equal(rows[0].end?.id, entry(12).id);
  assert.equal(rows[1].start.id, entry(16).id);
  assert.equal(rows[1].end, undefined);
  assert.equal(entry_rows([entry(10), entry(12)], "dot").length, 2);
  assert.equal(interval_duration(time(10), time(12)), "2h 0m 0s");
  assert.equal(interval_duration(time(10), Date.parse(time(11))), "1h 0m 0s");
});
