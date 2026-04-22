<script lang="ts">
  import * as d3 from "d3";
  import NoData from "./no_data.svelte";

  interface Entry {
    created_at: string;
    data: {
      value: number;
    };
  }

  interface DataPoint {
    time: Date;
    value: number;
  }

  let {
    type,
    entries = [],
    aspect_ratio = 16 / 9, // Default to widescreen aspect ratio
  }: { type: string; entries: Entry[]; aspect_ratio?: number } = $props();

  const margin = { left: 40, top: 25, right: 40, bottom: 20 };
  const ranges = ["1W", "1M", "3M", "YTD", "1Y", "ALL"];

  let current_range = $state("1W");
  // dynamic width of the parent container
  let containter_width = $state(0);

  // dynamic dimensions based on container_width and aspect_ratio (600 fallback for before mount)
  let width = $derived(containter_width || 600);
  let height = $derived(width / aspect_ratio);
  let inner_width = $derived(width - margin.left - margin.right);
  let inner_height = $derived(height - margin.top - margin.bottom);

  let current_time = $state(new Date());
  // refresh current time for time ranges
  $effect(() => {
    const interval = setInterval(() => {
      current_time = new Date();
    }, 100);
    return () => clearInterval(interval);
  });

  let sorted_entries = $derived.by(() => {
    const newly_sorted = entries.toSorted(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    // set init values for dot type
    if (type === "dot") {
      for (const [i, e] of newly_sorted.entries()) {
        e.data = {
          value: i + 1,
        };
      }
    }
    return newly_sorted;
  });

  let date_range = $derived.by(() => {
    let start = current_time;
    switch (current_range) {
      case "1W":
        start = new Date(current_time.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case "1M":
        start = new Date(current_time.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case "3M":
        start = new Date(current_time.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case "YTD":
        start = new Date(current_time.getFullYear(), 0, 1);
        break;
      case "1Y":
        start = new Date(current_time.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      case "ALL":
        start = new Date(sorted_entries.at(0)?.created_at ?? 0);
        break;
    }
    return { start, end: current_time };
  });

  let view_data = $derived.by(() => {
    let data: DataPoint[] = [];

    let start_slice = 0;
    for (; start_slice < sorted_entries.length; start_slice++) {
      if (date_range.start <= new Date(sorted_entries[start_slice].created_at)) {
        break;
      }
    }
    const filtered_entries = sorted_entries.slice(start_slice);

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
      const last_entries = sorted_entries
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
</script>

<div class="flex justify-between border px-3 py-2 font-mono text-2xl">
  {#if tooltip_data}
    <div class="space-x-2">
      <span>{tooltip_data.data.value}</span>
    </div>

    <span>
      {tooltip_data.data.time.getFullYear()}-{(tooltip_data.data.time.getMonth() + 1)
        .toString()
        .padStart(2, "0")}-{tooltip_data.data.time.getDate().toString().padStart(2, "0")}
    </span>
  {:else if view_data.length > 0}
    <span>{view_data[view_data.length - 1].value}</span>
    <span class="text-gray-500">{average.toFixed(2)}</span>
  {:else}
    <span>∅</span>
  {/if}
</div>

<div class="relative w-full space-y-4 font-mono" bind:clientWidth={containter_width}>
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
              <text text-anchor="middle" y="0" class=" fill-gray-500 text-base">
                {tooltip_data.data.time
                  .getHours()
                  .toString()
                  .padStart(2, "0")}:{tooltip_data.data.time
                  .getMinutes()
                  .toString()
                  .padStart(2, "0")}:{tooltip_data.data.time
                  .getSeconds()
                  .toString()
                  .padStart(2, "0")}
              </text>
              <line x1={0} y1={10} x2={1} y2={height} class="stroke-gray-500 stroke-1" />
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

      <div class="flex justify-start gap-2 overflow-x-scroll sm:justify-center">
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
    {/if}
  {/if}
</div>
