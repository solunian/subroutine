<script lang="ts">
  import { round_to_fixed } from "$lib/helpers";
  import { now } from "$lib/state/time.svelte";
  import NumberFlow, { NumberFlowGroup } from "@number-flow/svelte";

  const hours_between = (start: Date, end: Date) =>
    (end.getTime() - start.getTime()) / (1000 * 60 * 60);

  const start_of_monday_week = (date: Date) => {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const days_since_monday = date.getDay() === 0 ? 6 : date.getDay() - 1;
    start.setDate(start.getDate() - days_since_monday);
    return start;
  };

  const duration_info = $derived.by(() => {
    const start_of_year = new Date(now.getFullYear(), 0, 1);
    const end_of_year = new Date(now.getFullYear() + 1, 0, 1);
    const start_of_month = new Date(now.getFullYear(), now.getMonth(), 1);
    const end_of_month = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const start_of_week = start_of_monday_week(now);

    const end_of_week = new Date(start_of_week);
    end_of_week.setDate(start_of_week.getDate() + 7);

    const week_remaining = hours_between(now, end_of_week);
    const week_total = hours_between(start_of_week, end_of_week);
    const month_remaining = hours_between(now, end_of_month);
    const month_total = hours_between(start_of_month, end_of_month);
    const year_remaining = hours_between(now, end_of_year);
    const year_total = hours_between(start_of_year, end_of_year);

    return [
      {
        label: "week",
        remaining: round_to_fixed(week_remaining, 1),
        total: week_total,
        percent: round_to_fixed((week_remaining / week_total) * 100, 1),
      },
      {
        label: "month",
        remaining: round_to_fixed(month_remaining, 1),
        total: month_total,
        percent: round_to_fixed((month_remaining / month_total) * 100, 1),
      },
      {
        label: "year",
        remaining: round_to_fixed(year_remaining, 1),
        total: year_total,
        percent: round_to_fixed((year_remaining / year_total) * 100, 1),
      },
    ];
  });
</script>

<div
  class="time-info relative flex justify-center from-white/50 to-black/50 text-right font-mono text-base">
  <NumberFlowGroup>
    <span class="border bg-transparent px-2 py-1">
      <NumberFlow
        trend={+1}
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        value={now.getFullYear()} />-<NumberFlow
        trend={+1}
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        value={now.getMonth() + 1} />-<NumberFlow
        trend={+1}
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        value={now.getDate()} />
    </span>
    <span class="border border-l-0 bg-transparent px-2 py-1">
      <NumberFlow
        trend={+1}
        digits={{ 1: { max: 2 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={now.getHours()} />:<NumberFlow
        trend={+1}
        digits={{ 1: { max: 5 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={now.getMinutes()} />:<NumberFlow
        trend={+1}
        digits={{ 1: { max: 5 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={now.getSeconds()} />
    </span>
  </NumberFlowGroup>

  <div
    class="time-info-panel pointer-events-none absolute top-full z-20 mt-2 min-w-72 border border-neutral-500/50 bg-neutral-50 p-3 text-left text-sm opacity-100 shadow-[4px_4px_0_rgb(0_0_0_/0.12)] transition-opacity sm:right-0 dark:bg-neutral-950 dark:shadow-[4px_4px_0_rgb(255_255_255_/0.08)]">
    <div class="mb-2 text-neutral-500">remaining hours</div>
    <NumberFlowGroup>
      {#each duration_info as duration}
        <div
          class="grid grid-cols-[1fr_3fr_1fr] items-baseline gap-3 border-t border-neutral-500 py-1.5 first:border-t-0 dark:border-neutral-700/70">
          <span class="text-neutral-500">{duration.label}</span>
          <span class="text-right">
            <NumberFlow format={{ maximumFractionDigits: 1 }} value={duration.remaining} />
            <span class="text-neutral-500"> / </span>
            <NumberFlow format={{ maximumFractionDigits: 1 }} value={duration.total} />
          </span>
          <span class="text-right text-neutral-500">
            <NumberFlow format={{ maximumFractionDigits: 1 }} value={duration.percent} />%
          </span>
        </div>
      {/each}
    </NumberFlowGroup>
  </div>
</div>

<style>
  .time-info:hover .time-info-panel {
    opacity: 1;
  }
</style>
