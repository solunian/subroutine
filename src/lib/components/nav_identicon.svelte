<script lang="ts">
  import ArrowRightStartOnRectangle from "$lib/icons/arrow_right_start_on_rectangle.svelte";
  import AtSymbol from "$lib/icons/at_symbol.svelte";
  import Cog from "$lib/icons/cog.svelte";
  import MagnifyingGlass from "$lib/icons/magnifying_glass.svelte";
  import PlusCircle from "$lib/icons/plus_circle.svelte";
  import QuestionMarkCircle from "$lib/icons/question_mark_circle.svelte";
  import Users from "$lib/icons/users.svelte";

  let { name }: { name: string } = $props();
</script>

<div class="inline-flex size-6 min-w-6 items-center justify-center">
  {#if name === "/profile"}
    <AtSymbol />
  {:else if name === ">/friends"}
    <Users />
  {:else if name === "/search"}
    <MagnifyingGlass />
  {:else if name === "/create"}
    <PlusCircle />
  {:else if name === "/settings"}
    <Cog />
  {:else if name === "/signout"}
    <ArrowRightStartOnRectangle />
  {:else}
    <QuestionMarkCircle />
  {/if}
</div>
