<script lang="ts">
  import type { Tables } from "$lib/types/database.types";
  import { time } from "$lib/state/time.svelte";
  import { enhance } from "$app/forms";
  let {
    subroutine,
    entries = [],
  }: { subroutine: Tables<"subroutines">; entries?: Tables<"entries">[] } = $props();

  let torch_on = $derived(entries.length % 2 !== 0);

  // in milliseconds
  let total_duration = $derived.by(() => {
    let result = 0;
    if (entries.length >= 2) {
      for (let i = 0; i < entries.length - 1; i += 2) {
        result +=
          new Date(entries[i + 1].created_at).getTime() - new Date(entries[i].created_at).getTime();
      }
    }

    if (entries.length % 2 !== 0) {
      result += time.now.getTime() - new Date(entries[entries.length - 1].created_at).getTime();
    }

    return result;
  });
</script>

<div class="border p-2">
  <h2>{subroutine.title} {`<${subroutine.type}>`}</h2>

  <form method="POST" action="/?/append" use:enhance>
    <input hidden name="subroutine_id" bind:value={subroutine.id} />
    <button>torch</button>
  </form>

  <div class="flex justify-between">
    <span>
      {torch_on ? "on" : "off"}
    </span>
    <span class="font-mono">
      {Math.trunc(total_duration / 1000)}
    </span>
  </div>
</div>
