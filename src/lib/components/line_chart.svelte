<script lang="ts">
  import * as d3 from "d3";
  import NoData from "./no_data.svelte";
  import type { Tables } from "$lib/types/database.types";
  import { now } from "$lib/state/time.svelte";
  import NumberFlow from "@number-flow/svelte";
  import { round_to_fixed, to_24hrtime_str, to_date_str } from "$lib/helpers";

  interface DataPoint {
    time: Date;
    value: number;
  }

  let {
    type,
    entries = [],
    aspect_ratio = 16 / 9, // Default to widescreen aspect ratio
  }: { type: string; entries?: Tables<"entries">[]; aspect_ratio?: number } = $props();

  const margin = { left: 25, top: 25, right: 25, bottom: 25 };
  const ranges = ["1H", "1D", "1W", "1M", "3M", "YTD", "1Y", "ALL"];

  let current_range = $state("1W");
  // dynamic width of the parent container
  let containter_width = $state(0);

  // dynamic dimensions based on container_width and aspect_ratio (600 fallback for before mount)
  let width = $derived(containter_width || 600);
  let height = $derived(width / aspect_ratio);
  let inner_width = $derived(width - margin.left - margin.right);
  let inner_height = $derived(height - margin.top - margin.bottom);

  let processed_entries = $derived.by(() => {
    const alr_sorted_entries = entries.slice();

    // set init values for dot type
    if (type === "dot") {
      for (const [i, e] of alr_sorted_entries.entries()) {
        e.data = {
          value: i,
        };
      }
    }
    return alr_sorted_entries;
  });

  let date_range = $derived.by(() => {
    let start = new Date(now.getTime());
    switch (current_range) {
      case "1H":
        start = new Date(now.getTime() - 60 * 60 * 1000);
        break;
      case "1D":
        start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "1W":
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1M":
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3M":
        start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "YTD":
        start = new Date(now.getFullYear(), 0, 1);
        break;
      case "1Y":
        start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "ALL":
        start = new Date(processed_entries.at(0)?.created_at ?? 0);
        break;
    }
    return { start, end: new Date(now.getTime()) };
  });

  let view_data = $derived.by(() => {
    let data: DataPoint[] = [];

    let start_slice = 0;
    for (; start_slice < processed_entries.length; start_slice++) {
      if (date_range.start <= new Date(processed_entries[start_slice].created_at)) {
        break;
      }
    }
    const filtered_entries = processed_entries.slice(start_slice);

    if (filtered_entries.length > 0) {
      for (const e of filtered_entries) {
        data.push({ time: new Date(e.created_at), value: e.data.value });
      }
      // flat line to start point
      data.unshift({ time: date_range.start, value: filtered_entries[0].data.value });

      // flat line to end point
      data.push({
        time: date_range.end,
        value: filtered_entries[filtered_entries.length - 1].data.value,
      });
    } else {
      // No data in range, show flat line from last data point
      const last_entries = processed_entries
        .filter((e) => new Date(e.created_at) < date_range.start)
        .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
      if (last_entries.length > 0) {
        const last_entry = last_entries[last_entries.length - 1];
        const value = last_entry.data.value;

        data.push({ time: date_range.start, value });
        data.push({ time: date_range.end, value });
      }
    }

    return data;
  });

  // recalculate scales when width/height change
  let x_scale = $derived(
    d3
      .scaleTime()
      .domain(d3.extent(view_data, (d) => d.time) as [Date, Date])
      .range([0, Math.max(0, inner_width)]) // Math.max prevents negative values on tiny screens
  );

  let y_scale = $derived.by(() => {
    let values = view_data.map((d) => d.value);
    let [min, max] = d3.extent(values);

    if (min === undefined || max === undefined) {
      // Fallback for no data (e.g., domain [0, 1] to avoid errors)
      return d3
        .scaleLinear()
        .domain([0, 1])
        .range([Math.max(0, inner_height), 0]);
    }

    // Calculate padding: 10% of the range, or a minimum of 0.1 to handle flat data
    let range = max - min || 0.1; // Avoid division by zero if min === max
    let padding = Math.max(range * 0.1, 0.1); // At least 0.1 padding for very small ranges

    let domain_min = min - padding;
    let domain_max = max + padding;

    return d3
      .scaleLinear()
      .domain([domain_min, domain_max])
      .range([Math.max(0, inner_height), 0]);
  });

  let line_path = $derived.by(() => {
    let curve = d3.curveMonotoneX;
    if (type === "dot") {
      curve = d3.curveStepAfter;
    }

    return d3
      .line<DataPoint>()
      .x((d) => x_scale(d.time))
      .y((d) => y_scale(d.value))
      .curve(curve)(view_data);
  });

  let tooltip = $state<{ mouseX: number } | null>(null);
  let tooltip_data = $derived.by(() => {
    if (tooltip === null || view_data.length === 0) {
      return null;
    }

    const x_date = x_scale.invert(tooltip.mouseX);
    const bisect_date = d3.bisector<DataPoint, Date>((d) => d.time).left;
    const i = bisect_date(view_data, x_date, 1);

    const d0 = view_data[i - 1];
    const d1 = view_data[i];
    let closest_data_point: DataPoint;

    if (!d1) {
      closest_data_point = d0;
    } else if (!d0) {
      closest_data_point = d1;
    } else {
      closest_data_point =
        x_date.getTime() - d0.time.getTime() > d1.time.getTime() - x_date.getTime() ? d1 : d0;
    }

    return {
      x: x_scale(closest_data_point.time),
      y: y_scale(closest_data_point.value),
      data: closest_data_point,
    };
  });

  let average = $derived.by(() => {
    if (view_data.length === 0) return 0;

    // special case when last data point is left of the range, use the last value (basically the line extender value)
    if (view_data.length <= 2) return view_data[view_data.length - 1].value;

    // remove the line extenders from the average calculation
    let view_data_slice = view_data.slice(1, -1);

    const sum = view_data_slice.reduce((acc, d) => acc + d.value, 0);
    return sum / view_data_slice.length;
  });

  function handle_mouse_move(event: MouseEvent) {
    if (view_data.length === 0 || inner_width <= 0) return;

    const [mouse_x] = d3.pointer(event);
    tooltip = { mouseX: mouse_x };
  }

  function handle_mouse_leave() {
    tooltip = null;
  }

  let current_diplay_value = $derived.by(() => {
    if (tooltip_data) {
      return tooltip_data.data.value;
    }
    if (view_data.length > 0) {
      return view_data[view_data.length - 1].value;
    }
  });

  let trend_value = $derived.by(() => {
    if (view_data.length > 1) {
      if (tooltip_data) {
        return tooltip_data.data.value - view_data[0].value;
      } else {
        return view_data[view_data.length - 1].value - view_data[0].value;
      }
    }
    return 0;
  });

  let trend_percentage_delta = $derived.by(() => {
    if (view_data.length > 1) {
      if (tooltip_data) {
        return (tooltip_data.data.value / view_data[0].value - 1) * 100;
      } else {
        return (view_data[view_data.length - 1].value / view_data[0].value - 1) * 100;
      }
    }
    return 0;
  });

  let text_anchor = $derived.by(() => {
    if (!tooltip_data) return "middle";

    const threshold = inner_width * 0.1; // 10% threshold from edges
    if (tooltip_data.x < threshold) {
      return "start";
    } else if (tooltip_data.x > inner_width - threshold) {
      return "end";
    }
    return "middle";
  });

  let anchor_x_offset = $derived.by(() => {
    const offset = 15;
    if (text_anchor === "start") {
      return -offset;
    } else if (text_anchor === "end") {
      return offset;
    } else {
      return 0;
    }
  });
</script>

<div class="flex flex-col justify-between gap-1 px-3 py-2 font-mono text-2xl">
  <span class="flex h-8 items-center">
    {#if current_diplay_value !== undefined}
      <NumberFlow value={current_diplay_value} />
    {:else}
      ∅
    {/if}
  </span>

  <span
    class={[
      "flex items-center gap-2 text-base text-gray-500 transition",
      trend_value > 0 && "text-green-500/90",
      trend_value < 0 && "text-red-500/90",
    ]}>
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
    {:else if trend_value < 0}
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
          d="M2.25 6 9 12.75l4.286-4.286a11.948 11.948 0 0 1 4.306 6.43l.776 2.898m0 0 3.182-5.511m-3.182 5.51-5.511-3.181" />
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

    {round_to_fixed(Math.abs(trend_value), 2)}
    {#if !Number.isNaN(trend_percentage_delta) && Number.isFinite(trend_percentage_delta)}
      ({round_to_fixed(Math.abs(trend_percentage_delta), 2)}%)
    {/if}
  </span>
</div>

<div class="relative w-full space-y-2 font-mono" bind:clientWidth={containter_width}>
  {#if containter_width > 0}
    {#if entries.length > 0}
      <svg {width} {height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          {#if view_data.length > 0}
            <path
              d={line_path}
              transform="translate(0, 0)"
              class="fill-none stroke-purple-500 stroke-2" />

            <!-- New: Dotted average line -->
            <line
              x1="0"
              y1={y_scale(average)}
              x2={inner_width}
              y2={y_scale(average)}
              class="stroke-gray-500 stroke-2 opacity-50"
              stroke-dasharray="5,5" />
          {/if}

          {#if tooltip_data}
            <g transform={`translate(${tooltip_data.x}, 0)`}>
              <text
                text-anchor={text_anchor}
                x={anchor_x_offset}
                y="0"
                class="fill-gray-500 text-sm">
                {to_24hrtime_str(tooltip_data.data.time)}
              </text>
              <line x1={0} y1={10} x2={1} y2={height - 60} class="stroke-gray-500 stroke-1" />
              <text
                text-anchor={text_anchor}
                x={anchor_x_offset}
                y={height - 40}
                class="fill-gray-500 text-sm">
                {to_date_str(tooltip_data.data.time)}
              </text>
            </g>
          {/if}

          <rect
            role="tooltip"
            width={Math.max(0, inner_width)}
            height={Math.max(0, inner_height)}
            fill="transparent"
            onmousemove={handle_mouse_move}
            onmouseleave={handle_mouse_leave} />
        </g>
      </svg>

      <div class="flex gap-2 overflow-x-scroll">
        {#each ranges as range_select (range_select)}
          <button
            class={[
              "px-2",
              current_range === range_select &&
                "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
            ]}
            onclick={() => (current_range = range_select)}>{range_select}</button>
        {/each}
      </div>
    {:else}
      <NoData {height} />
      <div class="flex gap-2 overflow-x-scroll">
        {#each ranges as range_select (range_select)}
          <button
            class={[
              "px-2",
              current_range === range_select &&
                "border-black bg-black text-white dark:border-white dark:bg-white dark:text-black",
            ]}
            onclick={() => (current_range = range_select)}>{range_select}</button>
        {/each}
      </div>
    {/if}
  {/if}
</div>
