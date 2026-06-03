<script lang="ts">
  import "../app.css";
  import { invalidate, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import ReleaseStageBanner from "$lib/components/release_stage_banner.svelte";
  import TimeInfo from "$lib/components/time_info.svelte";
  import { now } from "$lib/state/time.svelte.js";
  import GithubInvertocat from "$lib/icons/github_invertocat.svelte";
  import { from_now } from "$lib/helpers";

  let { data, children } = $props();
  let { supabase, session } = $derived(data);

  onMount(() => {
    // supabase auth
    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        invalidate("supabase:auth");
      }
    });

    // now interval
    const now_interval = setInterval(() => {
      now.setTime(Date.now());
    }, 100);

    return () => {
      data.subscription.unsubscribe();
      clearInterval(now_interval);
    };
  });
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<!-- idle/browser offload invalidation -->

<!-- watch for bfcache restores (ideal for mobile "back" navigation) -->
<svelte:window
  onpageshow={(e) => {
    if (e.persisted) {
      invalidateAll();
    }
  }} />

<!-- watch for tab visibility changes (ideal for idle background tabs) -->
<svelte:document
  onvisibilitychange={() => {
    // Triggered when the browser tab becomes visible again
    if (document.visibilityState === "visible") {
      invalidateAll(); // Reruns all active load functions
    }
  }} />

<div class="flex min-h-screen flex-col">
  <ReleaseStageBanner />
  <div class="mb-4 px-4 py-2">
    <header
      class="flex flex-col items-center justify-between gap-2 py-2 font-nova text-4xl sm:flex-row">
      <a href="/" class="flex items-center gap-2 pr-1">
        <img src="/icons/favicon.png" alt="favicon" class="inline w-12" />subroutine
      </a>

      <TimeInfo />
    </header>

    {@render children()}
  </div>

  <footer
    class="mt-auto flex h-16 items-center justify-end gap-6 bg-linear-to-b from-neutral-500/0 to-neutral-500/50 px-6 text-neutral-500/50">
    {#if data.latest_gitcommit?.value}
      <a
        href="https://github.com/solunian/subroutine/commit/{data.latest_gitcommit.value.hash}"
        class="flex items-center gap-1">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="1.5"
          stroke="currentColor"
          class="inline size-5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M5.25 8.25h15m-16.5 7.5h15m-1.8-13.5-3.9 19.5m-2.1-19.5-3.9 19.5" />
        </svg>

        <div class="flex flex-col font-mono text-xs">
          <span>{data.latest_gitcommit.value.hash.slice(0, 7)} </span>
          <span>
            {from_now(now, new Date(data.latest_gitcommit.updated_at))}
          </span>
        </div>
      </a>
    {/if}
    <a href="https://github.com/solunian/subroutine" target="_blank"><GithubInvertocat /></a>
  </footer>
</div>
