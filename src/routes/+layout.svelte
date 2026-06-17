<script lang="ts">
  import "../app.css";
  import { invalidate, invalidateAll } from "$app/navigation";
  import { onMount } from "svelte";
  import ReleaseStageBanner from "$lib/components/release_stage_banner.svelte";
  import TimeInfo from "$lib/components/time_info.svelte";
  import { now } from "$lib/state/time.svelte.js";
  import GithubInvertocat from "$lib/icons/github_invertocat.svelte";
  import { from_now } from "$lib/helpers";
  import Hashtag from "$lib/icons/hashtag.svelte";

  let { data, children } = $props();
  let { supabase, session } = $derived(data);

  let now_interval: ReturnType<typeof setInterval> | undefined;

  const update_now = () => {
    now.setTime(Math.floor(Date.now() / 1000) * 1000);
  };

  const start_now_interval = () => {
    update_now();
    now_interval ??= setInterval(update_now, 500);
  };

  const stop_now_interval = () => {
    if (now_interval) {
      clearInterval(now_interval);
      now_interval = undefined;
    }
  };

  const handle_visibility_change = () => {
    if (document.visibilityState === "visible") {
      start_now_interval();
      invalidateAll();
    } else {
      stop_now_interval();
    }
  };

  const handle_page_show = (event: PageTransitionEvent) => {
    start_now_interval();

    if (event.persisted) {
      invalidateAll();
    }
  };

  onMount(() => {
    // supabase auth
    const { data } = supabase.auth.onAuthStateChange((event, _session) => {
      if (_session?.expires_at !== session?.expires_at) {
        invalidate("supabase:auth");
      }
    });

    if (document.visibilityState === "visible") {
      start_now_interval();
    }

    return () => {
      data.subscription.unsubscribe();
      stop_now_interval();
    };
  });
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<svelte:window onpageshow={handle_page_show} />
<svelte:document onvisibilitychange={handle_visibility_change} />

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
    class="mt-auto flex h-24 items-center justify-end gap-6 bg-linear-to-b from-neutral-500/0 to-neutral-500/25 px-6 text-neutral-500/50">
    {#if data.latest_gitcommit?.value}
      <a
        href="https://github.com/solunian/subroutine/commit/{data.latest_gitcommit.value.hash}"
        class="flex items-center gap-1">
        <Hashtag />

        <div class="flex flex-col font-mono text-sm">
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
