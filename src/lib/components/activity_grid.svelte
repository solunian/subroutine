<script lang="ts">
  import { get_day_start, get_next_day, to_date_str, to_duration_str } from "$lib/helpers";
  import { now } from "$lib/state/time.svelte";
  import type { Tables } from "$lib/types/database.types";

  type EntryActivity = Pick<Tables<"entries">, "created_at">;
  type SubroutineType = Tables<"subroutines">["type"];
  type GridDay = {
    date: Date;
    key: string;
    value: number;
    is_today: boolean;
  };

  let {
    entries = [],
    weeks = 52,
    subroutine_type,
  }: {
    entries?: EntryActivity[];
    weeks?: number;
    subroutine_type?: SubroutineType;
  } = $props();

  // Assumes 0 = Sunday, 1 = Monday...
  const short_day_names = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];

  function add_duration(duration_map: Map<string, number>, start: Date, end: Date) {
    const cur = get_day_start(start);

    while (cur < end) {
      const key = to_date_str(cur);
      const segment_start = Math.max(start.getTime(), cur.getTime());
      const segment_end = Math.min(end.getTime(), get_next_day(cur).getTime());
      duration_map.set(
        key,
        (duration_map.get(key) ?? 0) + Math.max(0, segment_end - segment_start)
      );
      cur.setDate(cur.getDate() + 1);
    }
  }

  function count_activity_class(count: number, max_count: number) {
    if (count <= 0 || max_count <= 0) return "bg-neutral-500/15";

    const intensity = count / max_count;
    if (intensity >= 0.8) return "bg-green-500/80";
    if (intensity >= 0.4) return "bg-green-500/60";
    if (intensity >= 0.2) return "bg-green-500/40";
    return "bg-green-500/20";
  }

  function duration_activity_class(duration: number, max_duration: number) {
    if (duration <= 0 || max_duration <= 0) return "bg-neutral-500/15";

    const intensity = duration / max_duration;
    if (intensity >= 0.8) return "bg-amber-500/80";
    if (intensity >= 0.4) return "bg-amber-500/60";
    if (intensity >= 0.2) return "bg-amber-500/40";
    return "bg-amber-500/20";
  }

  function activity_class(value: number, max_value: number) {
    if (subroutine_type === "torch") {
      return duration_activity_class(value, max_value);
    }
    return count_activity_class(value, max_value);
  }

  let today = $derived.by(() => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    return date;
  });

  let activity_counts = $derived.by(() => {
    const counts = new Map<string, number>();

    for (const entry of entries) {
      const key = to_date_str(new Date(entry.created_at));
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }

    return counts;
  });

  let activity_durations = $derived.by(() => {
    const durations = new Map<string, number>();
    if (subroutine_type !== "torch") return durations;

    for (let idx = 0; idx < Math.floor(entries.length / 2) * 2; idx += 2) {
      add_duration(
        durations,
        new Date(entries[idx].created_at),
        new Date(entries[idx + 1].created_at)
      );
    }

    if (entries.length % 2 !== 0) {
      add_duration(durations, new Date(entries[entries.length - 1].created_at), now);
    }

    return durations;
  });

  let days = $derived.by(() => {
    const end = new Date(today);
    const start = new Date(end);
    start.setDate(end.getDate() - (weeks * 7 - 1));
    start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

    const grid_days: GridDay[] = [];
    const cursor = new Date(start);

    while (cursor <= end) {
      const key = to_date_str(cursor);
      grid_days.push({
        date: new Date(cursor),
        key,
        value:
          subroutine_type === "torch"
            ? (activity_durations.get(key) ?? 0)
            : (activity_counts.get(key) ?? 0),
        is_today: key === to_date_str(today),
      });
      cursor.setDate(cursor.getDate() + 1);
    }

    return grid_days;
  });

  let max_value = $derived(days.reduce((val, day) => Math.max(val, day.value), 0));

  let hovered_day_key = $state<string | null>(null);

  let selected_day = $derived.by(() => {
    const selected_key = hovered_day_key ?? to_date_str(today);
    return days.find((day) => day.key === selected_key) ?? days.at(-1);
  });

  let week_columns = $derived.by(() => {
    const columns: (typeof days)[] = [];
    for (let idx = 0; idx < days.length; idx += 7) {
      columns.push(days.slice(idx, idx + 7));
    }
    return columns;
  });

  let month_labels = $derived.by(() =>
    week_columns.map((week, idx) => {
      const first = week[0]?.date;
      if (!first) return "";
      if (idx === 0 || first.getDate() <= 7) {
        return first.toLocaleDateString("en", { month: "short" }).toLowerCase();
      }
      return "";
    })
  );
</script>

<div class="max-w-fit border border-neutral-500/50">
  <div class="overflow-x-auto p-4">
    <div
      class="inline-grid gap-x-2 gap-y-1 p-2"
      role="presentation"
      onpointerleave={() => (hovered_day_key = null)}>
      <div
        class="grid gap-0.5 pl-8"
        style:grid-template-columns="repeat({week_columns.length}, 0.75rem)">
        {#each month_labels as label, idx (`${label}-${idx}`)}
          <div class="h-4 text-xs text-neutral-500">{label}</div>
        {/each}
      </div>

      <div
        class="inline-flex gap-0.5 pt-1"
        style:grid-template-columns="repeat({week_columns.length}, 0.75rem)">
        <div class="flex w-8 flex-col gap-0.5 text-xs text-neutral-500">
          {#each short_day_names as day_name, day_idx (day_name)}
            <div class="h-3">
              {day_idx % 2 === 0 ? day_name : ""}
            </div>
          {/each}
        </div>

        {#each week_columns as week, week_idx (week_idx)}
          <div class="flex flex-col gap-0.5">
            {#each week as day (day.key)}
              <div
                class="size-3"
                role="presentation"
                onpointerenter={() => (hovered_day_key = day.key)}
                onpointerleave={() => (hovered_day_key = null)}>
                <div
                  class={[
                    "size-3 border border-neutral-500/10 transition hover:border-neutral-500/70",
                    day.is_today && hovered_day_key === null && "border-neutral-500/70",
                    activity_class(day.value, max_value),
                  ]}>
                </div>
              </div>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  </div>

  {#if selected_day}
    <div
      class="flex w-full justify-between border-t border-neutral-500/50 px-3 py-2 font-mono text-base text-neutral-500">
      <span>{selected_day.key}</span>

      <span>
        {#if subroutine_type === "torch"}
          <span>{to_duration_str(selected_day.value)}</span>
        {:else}
          <span>
            {selected_day.value}
            {selected_day.value === 1 ? "entry" : "entries"}
          </span>
        {/if}
      </span>
    </div>
  {/if}
</div>
