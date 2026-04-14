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

  const margin = { left: 40, top: 25, right: 40, bottom: 20 };

  let {
    type,
    entries = [],
    aspect_ratio = 16 / 9, // Default to widescreen aspect ratio
  }: { type: string; entries: Entry[]; aspect_ratio?: number } = $props();

  // 1. State to hold the dynamic width of the parent container
  let containter_width = $state(0);

  // 2. Derive dimensions dynamically based on container_width and aspect_ratio
  // (We use a fallback of 600 so calculations don't break before the component mounts)
  let width = $derived(containter_width || 600);
  let height = $derived(width / aspect_ratio);

  let inner_width = $derived(width - margin.left - margin.right);
  let inner_height = $derived(height - margin.top - margin.bottom);

  let sorted_data = $derived.by(() => {
    let data: DataPoint[] = [];
    const sorted_entries = entries.sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    for (const [i, e] of sorted_entries.entries()) {
      if (type === "dot") {
        data.push({ time: new Date(e.created_at), value: i });
      } else if (type === "semaphore") {
        data.push({ time: new Date(e.created_at), value: e.data.value });
      }
    }
    return data;
  });

  // 3. Scales will automatically recalculate when width/height change
  let x_scale = $derived(
    d3
      .scaleTime()
      .domain(d3.extent(sorted_data, (d) => d.time) as [Date, Date])
      .range([0, Math.max(0, inner_width)]) // Math.max prevents negative values on tiny screens
  );

  let y_scale = $derived.by(() => {
    let values = sorted_data.map((d) => d.value);
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

    let domain_min = min;
    let domain_max = max + padding;

    return d3
      .scaleLinear()
      .domain([domain_min, domain_max])
      .nice() // Rounds to nice numbers for cleaner ticks if you add axes later
      .range([Math.max(0, inner_height), 0]);
  });

  let line_path = $derived(
    d3
      .line<DataPoint>()
      .x((d) => x_scale(d.time))
      .y((d) => y_scale(d.value))
      .curve(d3.curveMonotoneX)(sorted_data) || ""
  );

  // let x_axis_element: SVGGElement | undefined = $state();
  // let y_axis_element: SVGGElement | undefined = $state();

  // 4. Effect runs whenever the scales change (like during a window resize)
  // $effect(() => {
  //   if (x_axis_element && y_axis_element && sorted_data.length > 0 && containter_width > 0) {
  //     // Calculate how many ticks to show based on screen width so they don't overlap
  //     const tick_count = inner_width < 400 ? d3.timeMonth.every(2) : d3.timeMonth.every(1);

  //     const x_axis = d3
  //       .axisBottom<Date>(x_scale)
  //       .ticks(tick_count)
  //       .tickFormat(d3.timeFormat("%b %Y") as any);

  //     const y_axis = d3.axisLeft<number>(y_scale);

  //     d3.select(x_axis_element).call(x_axis);
  //     d3.select(y_axis_element).call(y_axis);
  //   }
  // });

  let tooltip = $state<{ x: number; y: number; data: DataPoint } | null>(null);

  function handle_mouse_move(event: MouseEvent) {
    if (sorted_data.length === 0 || inner_width <= 0) return;

    const [mouse_x] = d3.pointer(event);
    const x_date = x_scale.invert(mouse_x);
    const bisect_date = d3.bisector<DataPoint, Date>((d) => d.time).left;
    const i = bisect_date(sorted_data, x_date, 1);

    const d0 = sorted_data[i - 1];
    const d1 = sorted_data[i];
    let closet_data_point: DataPoint;

    if (!d1) {
      closet_data_point = d0;
    } else if (!d0) {
      closet_data_point = d1;
    } else {
      closet_data_point =
        x_date.getTime() - d0.time.getTime() > d1.time.getTime() - x_date.getTime() ? d1 : d0;
    }

    tooltip = {
      x: x_scale(closet_data_point.time),
      y: y_scale(closet_data_point.value),
      data: closet_data_point,
    };
  }

  function handle_mouse_leave() {
    tooltip = null;
  }
</script>

<div class="flex justify-between border px-3 py-2 font-mono text-2xl">
  {#if tooltip}
    <span>{tooltip.data.value}</span>
    <span>{tooltip.data.time.toLocaleDateString()}</span>
  {:else}
    <span>{sorted_data[sorted_data.length - 1]?.value ?? "∅"}</span>
  {/if}
</div>

<div class="relative w-full space-y-4" bind:clientWidth={containter_width}>
  {#if containter_width > 0}
    {#if entries.length > 0}
      <svg {width} {height}>
        <g transform={`translate(${margin.left}, ${margin.top})`}>
          <!-- <g bind:this={x_axis_element} class="x-axis" transform={`translate(0,${inner_height})`}></g>
        <g bind:this={y_axis_element} class="y-axis"></g> -->

          {#if sorted_data.length > 0}
            <path
              d={line_path}
              transform={`translate(0, 0)`}
              class="fill-none stroke-purple-500 stroke-2" />
          {/if}

          {#if tooltip}
            <g transform={`translate(${tooltip.x}, 0)`}>
              <text text-anchor="middle" y="0" class=" fill-gray-500 text-sm"
                >{tooltip.data.time.toLocaleTimeString()}</text>
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

      <div class="flex justify-start gap-2 overflow-x-scroll font-mono sm:justify-center">
        <button class="px-2">1W</button>
        <button class="px-2">1M</button>
        <button class="px-2">3M</button>
        <button class="px-2">YTD</button>
        <button class="px-2">1Y</button>
        <button class="px-2">ALL</button>
      </div>
    {:else}
      <NoData {height} />
    {/if}
  {/if}
</div>
