<script lang="ts">
  import ArrowRightStartOnRectangle from "$lib/icons/arrow_right_start_on_rectangle.svelte";
  import AtSymbol from "$lib/icons/at_symbol.svelte";
  import Cog from "$lib/icons/cog.svelte";
  import PlusCircle from "$lib/icons/plus_circle.svelte";
  import QuestionMarkCircle from "$lib/icons/question_mark_circle.svelte";

  let { type }: { type: string } = $props();
</script>

<div class="inline-flex size-6 min-w-6 items-center justify-center">
  {#if type === "profile"}
    <AtSymbol />
  {:else if type === "create"}
    <PlusCircle />
  {:else if type === "settings"}
    <Cog />
  {:else if type === "signout"}
    <ArrowRightStartOnRectangle />
  {:else}
    <QuestionMarkCircle />
  {/if}
</div>
