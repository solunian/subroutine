<script lang="ts">
  import type { Tables } from "$lib/types/database.types";
  import { now } from "$lib/state/time.svelte";
  import { enhance } from "$app/forms";
  import NumberFlow from "@number-flow/svelte";
  import TypeIdenticon from "./type_identicon.svelte";
  import { get_n_days_date, round_to_fixed } from "$lib/helpers";
  let {
    subroutine,
    entries = [],
    href,
    editable = false,
  }: {
    subroutine: Tables<"subroutines">;
    entries?: Tables<"entries">[];
    href?: string;
    editable?: boolean;
  } = $props();

  let torch_on = $derived(entries.length % 2 !== 0);

  // in milliseconds
  let [total_duration, trend_value] = $derived.by(() => {
    const one_week_ago = get_n_days_date(-7);

    let one_week_trend = 0;
    let total = 0;

    // sum up all pairs
    for (let i = 0; i < Math.floor(entries.length / 2) * 2; i += 2) {
      const [start, end] = [new Date(entries[i].created_at), new Date(entries[i + 1].created_at)];

      const diff = end.getTime() - start.getTime();
      total += diff;

      if (one_week_ago < end) {
        one_week_trend += end.getTime() - Math.max(start.getTime(), one_week_ago.getTime());
      }
    }

    // for last entry
    if (entries.length % 2 !== 0) {
      const last_entry_time = new Date(entries[entries.length - 1].created_at).getTime();
      total += now.getTime() - last_entry_time;
      one_week_trend += now.getTime() - Math.max(last_entry_time, one_week_ago.getTime());
    }

    return [total, one_week_trend];
  });

  let hrs = $derived(Math.trunc(total_duration / 1000 / 60 / 60));
  let min = $derived(Math.trunc((total_duration / 1000 / 60) % 60));
  let sec = $derived(Math.trunc((total_duration / 1000) % 60));
</script>

<div
  class={[
    "flex flex-col gap-2 border border-gray-500 p-2 transition",
    torch_on && "border-amber-500! bg-amber-100 dark:bg-amber-900",
  ]}>
  <h2 class="flex items-center gap-1 text-xl">
    <TypeIdenticon type={subroutine.type} /> <a {href}>{subroutine.title}</a>
  </h2>

  <div class="flex flex-col items-center gap-1 px-3 py-2 font-mono text-2xl">
    <div>
      <NumberFlow trend={+1} format={{ minimumIntegerDigits: 2 }} value={hrs} />:<NumberFlow
        trend={+1}
        digits={{ 1: { max: 5 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={min} />:<NumberFlow
        trend={+1}
        digits={{ 1: { max: 5 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={sec} />
    </div>
    <span
      class={[
        "flex items-center gap-2 text-base text-gray-500 transition",
        trend_value > 0 && "text-green-500/90",
      ]}>
      1W

      {#if trend_value > 0}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M2.25 18 9 11.25l4.306 4.306a11.95 11.95 0 0 1 5.814-5.518l2.74-1.22m0 0-5.94-2.281m5.94 2.28-2.28 5.941" />
        </svg>
      {:else}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="size-6">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
        </svg>
      {/if}

      {round_to_fixed(Math.abs(trend_value) / (1000 * 60 * 60), 2)} hrs
    </span>
  </div>

  {#if editable}
    <form
      method="POST"
      action="/?/append"
      use:enhance={() => {
        return async ({ update }) => {
          await update({ reset: false });
        };
      }}>
      <input hidden name="subroutine_id" value={subroutine.id} />
      <button class="w-full border-0! bg-black/10 px-2 text-lg dark:bg-white/10"
        >{torch_on ? "torch off" : "torch on"}</button>
    </form>
  {/if}
</div>
