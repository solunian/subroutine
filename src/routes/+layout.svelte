<!-- src/routes/+layout.svelte -->
<script lang="ts">
  import "../app.css";
  import { invalidate } from "$app/navigation";
  import { onMount } from "svelte";
  import ReleaseStageBanner from "$lib/components/release_stage_banner.svelte";
  import TimeInfo from "$lib/components/time_info.svelte";

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

<div class="px-4 py-2">
  <header
    class="flex flex-col items-center justify-between gap-2 py-2 font-nova text-3xl sm:flex-row">
    <a href="/" class="flex items-center gap-2 pr-1">
      <img src="/icons/favicon.png" alt="favicon" class="inline w-12" />subroutine
    </a>

    <TimeInfo />
  </header>

  {@render children()}
</div>
