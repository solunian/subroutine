<script lang="ts">
  import type { Tables } from "$lib/types/database.types";
  import DotSemaphore from "./small_view/dot_semaphore.svelte";
  import Journal from "./small_view/journal.svelte";
  import Torch from "./small_view/torch.svelte";

  let {
    username,
    subroutine,
    entries = [],
    href,
    editable = false,
  }: {
    username: string;
    subroutine: Tables<"subroutines">;
    entries?: Tables<"entries">[];
    href?: string;
    editable?: boolean;
  } = $props();
</script>

{#if subroutine.type === "dot" || subroutine.type === "semaphore"}
  <DotSemaphore {username} {subroutine} {entries} {href} {editable} />
{:else if subroutine.type === "torch"}
  <Torch {username} {subroutine} {entries} {href} {editable} />
{:else if subroutine.type === "journal"}
  <Journal {username} {subroutine} {entries} {href} {editable} />
{:else}
  <div class="flex aspect-video w-full items-center justify-center border font-mono">
    not implemented yet -_-
  </div>
{/if}
