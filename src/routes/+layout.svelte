<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "../app.css";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import { page } from "$app/state";
  import ReleaseStageBanner from "$lib/components/release_stage_banner.svelte";

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
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<ReleaseStageBanner />

<div class="p-2">
  <div class="py-2 font-nova text-3xl">
    <a href="/">subroutine</a>
    {page.url.pathname}
  </div>

  {@render children()}
</div>
