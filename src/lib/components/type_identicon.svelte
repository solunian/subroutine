<script lang="ts">
  import ArrowsUpDown from "$lib/icons/arrows_up_down.svelte";
  import CircleDot from "$lib/icons/circle_dot.svelte";
  import Fire from "$lib/icons/fire.svelte";
  import QuestionMarkCircle from "$lib/icons/question_mark_circle.svelte";
  import type { Database } from "$lib/types/database.types";

  let { type }: { type: Database["public"]["Enums"]["subroutine_type"] } = $props();
</script>

{#if type === "dot"}
  <CircleDot />
{:else if type === "semaphore"}
  <ArrowsUpDown />
{:else if type === "torch"}
  <Fire />
{:else}
  <QuestionMarkCircle />
{/if}
