<script lang="ts">
  import ArrowsUpDown from "$lib/icons/arrows_up_down.svelte";
  import CircleDot from "$lib/icons/circle_dot.svelte";
  import Fire from "$lib/icons/fire.svelte";
  import PencilSquare from "$lib/icons/pencil_square.svelte";
  import QuestionMarkCircle from "$lib/icons/question_mark_circle.svelte";

  let { type }: { type: string } = $props();
</script>

<div class="inline-flex size-6 items-center justify-center">
  {#if type === "dot"}
    <CircleDot />
  {:else if type === "semaphore"}
    <ArrowsUpDown />
  {:else if type === "torch"}
    <Fire />
  {:else if type === "journal"}
    <PencilSquare />
  {:else}
    <QuestionMarkCircle />
  {/if}
</div>
