<script lang="ts">
  import { invalidate } from "$app/navigation";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

subroutine ~

<div class="flex flex-col">
  {#if data.session}
    <a href="/settings">/settings</a>
    <a href="/signout" onclick={() => invalidate("supabase:auth")}>/signout</a>
  {:else}
    <a href="/signin">/signin</a>
    <a href="/signup">/signup</a>
    <a href="/magiclink">/magiclink</a>
  {/if}
</div>
