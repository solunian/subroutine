<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Tables } from "$lib/types/database.types";
  import LineChart from "./line_chart.svelte";

  let {
    subroutine,
    entries = [],
    href,
    editable = false,
  }: {
    subroutine: Tables<"subroutines">;
    entries?: Tables<"entries">[];
    href: string;
    editable?: boolean;
  } = $props();
</script>

<div class="flex flex-col gap-2 border p-2">
  <div>
    <h2 class="overflow-x-scroll text-xl whitespace-nowrap">
      {`<${subroutine.type}>`}
      <a {href}>{subroutine.title}</a>
    </h2>
    <!-- <div>{sub.description}</div> -->
  </div>

  <LineChart type={subroutine.type} {entries} />

  {#if editable}
    {#if subroutine.type === "dot"}
      <form
        method="POST"
        action="/?/append"
        use:enhance={() => {
          return async ({ update }) => {
            await update({ reset: false });
          };
        }}>
        <input hidden name="subroutine_id" value={subroutine.id} />
        <button class="w-full border-0! bg-black/10 px-2 text-lg dark:bg-white/10">dot</button>
      </form>
    {:else if subroutine.type === "semaphore"}
      <form
        method="POST"
        action="/?/append"
        use:enhance={() => {
          return async ({ update }) => {
            await update({ reset: false });
          };
        }}>
        <input hidden name="subroutine_id" value={subroutine.id} />
        <input hidden name="subroutine_type" value="semaphore" />
        <div class="flex gap-2">
          <input
            name="value"
            type="number"
            step="any"
            value={entries.at(-1)?.data.value ?? 0}
            class="basis-3/4 py-2 text-center font-mono text-lg" />
          <button class="w-full basis-1/4 border-0! bg-black/10 px-2 text-lg dark:bg-white/10">
            v / p
          </button>
        </div>
      </form>
    {/if}
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
