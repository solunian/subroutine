import type { Tables } from "$lib/types/database.types";

export function supports_entry_editor(type: string) {
  return type === "dot" || type === "semaphore" || type === "torch";
}

export function sorted_entries(entries: Tables<"entries">[]) {
  return entries.toSorted(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at) || a.id.localeCompare(b.id)
  );
}

export function torch_pair(entries: Tables<"entries">[], id: string) {
  const ordered = sorted_entries(entries);
  const index = ordered.findIndex((entry) => entry.id === id);
  if (index < 0) return [];
  const start = index - (index % 2);
  return ordered.slice(start, start + 2);
}

export function adjacent_entries(entries: Tables<"entries">[], time: string, exclude?: string) {
  const ordered = sorted_entries(entries.filter((entry) => entry.id !== exclude));
  const timestamp = Date.parse(time);
  if (!Number.isFinite(timestamp)) return {};
  return {
    before: ordered.findLast((entry) => Date.parse(entry.created_at) <= timestamp),
    after: ordered.find((entry) => Date.parse(entry.created_at) > timestamp),
  };
}

export function torch_overlaps(entries: Tables<"entries">[], start: number, end: number) {
  const ordered = sorted_entries(entries);
  for (let i = 0; i < ordered.length; i += 2) {
    const other_start = Date.parse(ordered[i].created_at);
    const other_end = ordered[i + 1] ? Date.parse(ordered[i + 1].created_at) : Infinity;
    // Equal boundaries would leave the ordering of on/off events ambiguous.
    if (start <= other_end && end >= other_start) return true;
  }
  return false;
}

export function local_datetime(timestamp: string) {
  const date = new Date(timestamp);
  if (!Number.isFinite(date.getTime())) return "";
  return new Date(date.getTime() - date.getTimezoneOffset() * 60_000).toISOString().slice(0, 23);
}

export function entry_rows(entries: Tables<"entries">[], type: string) {
  const ordered = sorted_entries(entries);
  return ordered.flatMap<{ start: Tables<"entries">; end?: Tables<"entries"> }>((start, index) =>
    type === "torch"
      ? index % 2 === 0
        ? [{ start, end: ordered[index + 1] }]
        : []
      : [{ start, end: undefined }]
  );
}

export function interval_duration(start: string, end: string | number) {
  const seconds = Math.max(
    0,
    Math.floor(((typeof end === "number" ? end : Date.parse(end)) - Date.parse(start)) / 1000)
  );
  return `${Math.floor(seconds / 3600)}h ${Math.floor(seconds / 60) % 60}m ${seconds % 60}s`;
}
