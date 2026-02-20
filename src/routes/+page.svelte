<script lang="ts">
  import { invalidate } from "$app/navigation";
  import UsernameGoto from "$lib/components/username_goto.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

subroutine ~

<UsernameGoto />

<div class="flex flex-col">
  {#if data.session}
    <a href="/settings">/settings</a>
    <a href="/signout" onclick={() => invalidate("supabase:auth")} data-sveltekit-preload-data="off"
      >/signout</a>
  {:else}
    <a href="/signin">/signin</a>
    <a href="/signup">/signup</a>
    <a href="/magiclink">/magiclink</a>
  {/if}
</div>
