<script lang="ts">
  import * as d3 from "d3";
  import NoData from "./no_data.svelte";
  import type { Tables } from "$lib/types/database.types";
  import { now } from "$lib/state/time.svelte";
  import NumberFlow from "@number-flow/svelte";
  import { round_to_fixed, to_24hrtime_str, to_date_str } from "$lib/helpers";
  import ArrowTrendingUp from "$lib/icons/arrow_trending_up.svelte";
  import ArrowTrendingDown from "$lib/icons/arrow_trending_down.svelte";
  import ArrowLongRight from "$lib/icons/arrow_long_right.svelte";

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
  // Map of range labels to milliseconds offset from now
  const range_offsets: Record<string, number | null> = {
    "1H": 60 * 60 * 1000,
    "1D": 24 * 60 * 60 * 1000,
    "1W": 7 * 24 * 60 * 60 * 1000,
    "1M": 30 * 24 * 60 * 60 * 1000,
    "3M": 90 * 24 * 60 * 60 * 1000,
    "1Y": 365 * 24 * 60 * 60 * 1000,
    YTD: null, // Special case
    ALL: null, // Special case
  };

  // default range
  let current_range = $state("1W");
  // dynamic width of the parent container
  let containter_width = $state(0);

  // dynamic dimensions based on container_width and aspect_ratio (600 fallback for before mount)
  let width = $derived(containter_width || 600);
  let height = $derived(width / aspect_ratio);
  let inner_width = $derived(width - margin.left - margin.right);
  let inner_height = $derived(height - margin.top - margin.bottom);

  let date_range = $derived.by(() => {
    let start: Date;
    const offset = range_offsets[current_range];

    if (offset !== null) {
      start = new Date(now.getTime() - offset);
    } else if (current_range === "YTD") {
      start = new Date(now.getFullYear(), 0, 1);
    } else {
      // ALL
      start = new Date(entries.at(0)?.created_at ?? 0);
    }

    return { start, end: new Date(now.getTime()) };
  });

  let view_data = $derived.by(() => {
    let data: DataPoint[] = [];

    // Find the starting index based on date_range
    let start_idx = entries.findIndex((e) => date_range.start <= new Date(e.created_at));
    if (start_idx === -1) start_idx = entries.length;

    const filtered_entries = entries.slice(start_idx);

    if (filtered_entries.length > 0) {
      for (let i = 0; i < filtered_entries.length; i++) {
        const entry = filtered_entries[i];
        const value = type === "dot" ? start_idx + i : entry.data.value;
        data.push({ time: new Date(entry.created_at), value });
      }
      // extension to start point
      const start_value = type === "dot" ? start_idx : filtered_entries[0].data.value;
      data.unshift({ time: date_range.start, value: start_value });

      // extension to end point
      data.push({
        time: date_range.end,
        value:
          type === "dot"
            ? start_idx + filtered_entries.length - 1
            : filtered_entries[filtered_entries.length - 1].data.value,
      });
    } else {
      // No data in range, show flat line from last data point
      const last_entries = entries.filter((e) => new Date(e.created_at) < date_range.start);
      if (last_entries.length > 0) {
        const last_entry = last_entries[last_entries.length - 1];
        const value = type === "dot" ? last_entries.length - 1 : last_entry.data.value;

        data.push({ time: date_range.start, value });
        data.push({ time: date_range.end, value });
      }
    }

    return data;
  });

  // recalculate scales when width/height change
  let x_scale = $derived.by(() => {
    const [start, end] = d3.extent(view_data, (d) => d.time) as [
      Date | undefined,
      Date | undefined,
    ];

    if (!start || !end) {
      // Fallback for no data
      return d3
        .scaleTime()
        .domain([new Date(0), new Date()])
        .range([0, Math.max(0, inner_width)]);
    }

    return d3
      .scaleTime()
      .domain([start, end])
      .range([0, Math.max(0, inner_width)]);
  });

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

  let current_display_value = $derived(
    tooltip_data?.data.value ?? view_data[view_data.length - 1]?.value
  );

  let average = $derived.by(() => {
    if (view_data.length === 0) return 0;

    // special case when last data point is left of the range, use the last value (basically the line extender value)
    if (view_data.length <= 2) return view_data[view_data.length - 1].value;

    // remove the line extenders from the average calculation
    let view_data_slice = view_data.slice(1, -1);

    const sum = view_data_slice.reduce((acc, d) => acc + d.value, 0);
    return sum / view_data_slice.length;
  });

  let trend_value = $derived(
    view_data.length >= 2 ? current_display_value - view_data[0].value : 0
  );

  let trend_percentage_delta = $derived(
    view_data.length >= 2 ? (current_display_value / view_data[0].value - 1) * 100 : 0
  );

  let text_anchor = $derived.by(() => {
    if (!tooltip_data) return "middle";

    const threshold = inner_width * 0.1; // 10% threshold from edges
    if (tooltip_data.x < threshold) {
      return "start";
    }
    if (tooltip_data.x > inner_width - threshold) {
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

  const handle_mouse_move = (event: MouseEvent) => {
    if (view_data.length === 0 || inner_width <= 0) return;

    const [mouse_x] = d3.pointer(event);
    tooltip = { mouseX: mouse_x };
  };

  const handle_mouse_leave = () => {
    tooltip = null;
  };
</script>

<div class="flex flex-col justify-between gap-1 px-3 py-2 font-mono text-2xl">
  <span class="flex h-8 items-center">
    {#if current_display_value !== undefined}
      <NumberFlow value={current_display_value} />
    {:else}
      ∅
    {/if}
  </span>

  <span
    class={[
      "flex items-center gap-2 text-base transition",
      trend_value > 0 && "text-green-500/90",
      trend_value === 0 && "text-neutral-500/90",
      trend_value < 0 && "text-red-500/90",
    ]}>
    {#if trend_value > 0}
      <ArrowTrendingUp />
    {:else if trend_value < 0}
      <ArrowTrendingDown />
    {:else}
      <ArrowLongRight />
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
              class="stroke-neutral-500 stroke-2 opacity-50"
              stroke-dasharray="5,5" />
          {/if}

          {#if tooltip_data}
            <g transform={`translate(${tooltip_data.x}, 0)`}>
              <text
                text-anchor={text_anchor}
                x={anchor_x_offset}
                y="0"
                class="fill-neutral-500 text-sm">
                {to_24hrtime_str(tooltip_data.data.time)}
              </text>
              <line x1={0} y1={10} x2={1} y2={height - 60} class="stroke-neutral-500 stroke-1" />
              <text
                text-anchor={text_anchor}
                x={anchor_x_offset}
                y={height - 40}
                class="fill-neutral-500 text-sm">
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

      <div class="flex justify-center-safe gap-2 overflow-x-scroll">
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
