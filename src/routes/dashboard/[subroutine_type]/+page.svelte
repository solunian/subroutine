<script lang="ts">
  import type { PageProps } from "./$types";
  import SubroutineSmallView from "$lib/components/subroutine_small_view.svelte";

  let { data }: PageProps = $props();
</script>

<main class="@container flex flex-col gap-2 py-2">
  <h1 class="flex items-center gap-2 p-2 font-nova text-3xl sm:text-4xl">
    <span>>/{data.subroutine_type}</span>
  </h1>
  <div class="grid grid-cols-1 gap-2 @3xl:grid-cols-2 @5xl:grid-cols-3 @7xl:grid-cols-4">
    {#each data.subroutines as sub (sub.id)}
      <SubroutineSmallView editable subroutine={sub} entries={sub.entries} />
    {:else}
      <p class="p-2 text-neutral-500">no {data.subroutine_type} subroutines yet.</p>
    {/each}
  </div>
</main>
