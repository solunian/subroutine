<script lang="ts">
  import type { Tables } from "$lib/types/database.types";
  import LineChart from "./line_chart.svelte";

  let {
    subroutine,
    entries = [],
  }: { subroutine: Tables<"subroutines">; entries?: Tables<"entries">[] } = $props();
</script>

<div class="flex flex-col gap-2 border p-2">
  <div>
    <h2 class="text-xl">{subroutine.title} {`<${subroutine.type}>`}</h2>
    <!-- <div>{sub.description}</div> -->
  </div>

  <LineChart type={subroutine.type} {entries} />

  {#if entries}
    <div class="border p-2">
      <h2>entries</h2>
      {#each entries as entry (entry.id)}
        <div>{new Date(entry.created_at)}</div>
      {/each}
    </div>
  {/if}
</div>
