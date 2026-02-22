<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "../app.css";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";

  let { data, children } = $props();
  let { supabase, session } = $derived(data);

  onMount(() => {
    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        invalidate("supabase:auth");
      }
    });

    return () => data.subscription.unsubscribe();
  });

  // pre-alpha, alpha, beta, release candidate, general availability
  const release_stage = "pre-alpha";
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<div
  class="pleated-stripes flex h-7 w-full flex-col items-center justify-center border-b border-gray-300 py-1 text-gray-500">
  <span>{release_stage}</span>
</div>

<div class="p-2">
  {@render children()}
</div>

<style>
  .pleated-stripes {
    background: repeating-linear-gradient(
      45deg,
      #ffeedd 0px,
      #ffffff 15px,
      #ffb366 15px,
      #ffd9b3 30px
    );
  }
</style>
