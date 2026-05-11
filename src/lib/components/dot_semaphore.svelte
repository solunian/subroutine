<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Tables } from "$lib/types/database.types";
  import LineChart from "./line_chart.svelte";

  let {
    subroutine,
    entries = [],
  }: { subroutine: Tables<"subroutines">; entries?: Tables<"entries">[] } = $props();
</script>

<div class="flex flex-col gap-2 border p-2">
  <div>
    <h2 class="overflow-x-scroll text-xl whitespace-nowrap">
      {`<${subroutine.type}>`}
      {subroutine.title}
    </h2>
    <!-- <div>{sub.description}</div> -->
  </div>

  <LineChart type={subroutine.type} {entries} />

  {#if subroutine.type === "dot"}
    <form method="POST" action="/?/append" use:enhance>
      <input hidden name="subroutine_id" bind:value={subroutine.id} />
      <button class="w-full border-0! bg-black/10 px-2 text-lg dark:bg-white/10">dot</button>
    </form>
  {/if}

  <!-- {#if entries}
    <div class="border p-2">
      <h2>entries</h2>
      {#each entries as entry (entry.id)}
        <div>{new Date(entry.created_at)}</div>
      {/each}
    </div>
  {/if} -->
</div>
