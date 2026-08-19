<script lang="ts">
  import "../app.css";
  import { browser } from "$app/environment";
  import { afterNavigate, invalidate, invalidateAll } from "$app/navigation";
  import { page } from "$app/state";
  import { onMount } from "svelte";
  import type { Attachment } from "svelte/attachments";
  import ReleaseStageBanner from "$lib/components/release_stage_banner.svelte";
  import TimeInfo from "$lib/components/time_info.svelte";
  import {
    now,
    start_now_interval,
    stop_now_interval,
    update_now,
  } from "$lib/state/time.svelte.js";
  import GithubInvertocat from "$lib/icons/github_invertocat.svelte";
  import { from_now } from "$lib/helpers";
  import Hashtag from "$lib/icons/hashtag.svelte";
  import ThemeToggle from "$lib/components/theme_toggle.svelte";
  import Bars3 from "$lib/icons/bars_3.svelte";
  import NavIdenticon from "$lib/components/nav_identicon.svelte";
  import XMark from "$lib/icons/x_mark.svelte";
  import { fade } from "svelte/transition";
  import Sidebar from "$lib/icons/sidebar.svelte";

  if (!browser) {
    update_now();
  }

  let { data, children } = $props();
  let { supabase, session } = $derived(data);
  let sidebar_collapsed = $state(false);
  let mobile_menu_open = $state(false);

  // for maintaining scroll position between navs
  let page_scroller: HTMLDivElement | undefined;

  const attach_page_scroller: Attachment<HTMLDivElement> = (element) => {
    page_scroller = element;

    return () => {
      page_scroller = undefined;
    };
  };

  afterNavigate(({ from, to, type }) => {
    if (type !== "popstate" && from?.url.pathname !== to?.url.pathname && !to?.url.hash) {
      page_scroller?.scrollTo({ top: 0, left: 0 });
    }
  });

  export const snapshot: import("./$types").Snapshot<number> = {
    capture: () => page_scroller?.scrollTop ?? 0,
    restore: (scroll_top) => page_scroller?.scrollTo({ top: scroll_top, left: 0 }),
  };

  const nav_items = $derived([
    { name: "/profile", href: data.username ? `/@${data.username}` : "" },
    { name: ">/friends", href: data.username ? `/@${data.username}/friends` : "" },
    { name: "/search", href: "/search" },
    { name: "/create", href: "/create" },
    { name: "/settings", href: "/settings" },
    { name: "/signout", href: "/signout", reload: true },
  ]);

  const is_active = (href: string) => {
    return page.url.pathname === href;
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

<div class="flex h-dvh flex-col overflow-hidden">
  <ReleaseStageBanner />

  <header class="flex items-center justify-between gap-2 border-b border-neutral-500/50 px-4 py-2">
    <div class="flex items-center gap-3">
      <a href="/" class="flex h-8 items-center gap-2 pr-1 font-nova text-3xl sm:h-12 sm:text-4xl">
        <img src="/icons/favicon.png" alt="favicon" class="inline w-8 sm:w-12" />subroutine
      </a>
    </div>

    <div class="hidden sm:block">
      <TimeInfo />
    </div>

    <!-- menu button on mobile -->
    {#if session}
      <button
        type="button"
        class="flex size-8 flex-col items-center justify-center gap-1 border-neutral-500/50 sm:hidden sm:size-10"
        aria-label={mobile_menu_open ? "close navigation menu" : "open navigation menu"}
        aria-expanded={mobile_menu_open}
        aria-controls="mobile-navigation"
        onclick={() => (mobile_menu_open = !mobile_menu_open)}>
        <Bars3 />
      </button>
    {/if}
  </header>

  <div class="flex min-h-0 flex-1">
    {#if session}
      <aside
        class={[
          "hidden shrink-0 border-r border-neutral-500/50  transition-[width] sm:flex sm:flex-col",
          sidebar_collapsed ? "w-15" : "w-48",
        ]}>
        <nav class="flex h-full flex-col gap-1 px-2 py-2">
          {#each nav_items as item (item.name)}
            <a
              href={item.href}
              data-sveltekit-reload={item.reload ? true : undefined}
              aria-current={is_active(item.href) ? "page" : undefined}
              title={sidebar_collapsed ? item.name : undefined}
              class={[
                "flex h-10 flex-nowrap items-center gap-1 overflow-hidden px-2 text-neutral-500/95 transition-colors hover:text-inherit",
                is_active(item.href) ? "bg-neutral-500/15" : "hover:bg-neutral-500/10",
              ]}>
              <NavIdenticon name={item.name} />
              <span class={["text-nowrap", sidebar_collapsed && "sr-only"]}>
                {item.name}
              </span>
            </a>
          {/each}

          <div class="mt-auto">
            <button
              type="button"
              class="flex items-center border-0! border-neutral-500/50 px-2 py-2 text-neutral-500/95 transition-colors hover:bg-neutral-500/10 hover:text-inherit"
              aria-label={sidebar_collapsed ? "expand sidebar" : "collapse sidebar"}
              aria-expanded={!sidebar_collapsed}
              onclick={() => (sidebar_collapsed = !sidebar_collapsed)}>
              <Sidebar />
            </button>
          </div>
        </nav>
      </aside>
    {/if}

    <div {@attach attach_page_scroller} class="flex min-w-0 flex-1 flex-col overflow-y-auto">
      <div class="mb-4 flex-1 px-4">
        {@render children()}
      </div>

      <footer
        class="mt-auto flex h-24 shrink-0 items-center gap-6 bg-linear-to-b from-neutral-500/0 to-neutral-500/25 px-6 text-neutral-500">
        <span class="mr-auto">
          <ThemeToggle />
        </span>
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
  </div>

  {#if session && mobile_menu_open}
    <nav
      transition:fade={{ duration: 100 }}
      id="mobile-navigation"
      aria-label="Main navigation"
      class="absolute z-10 flex h-dvh w-full flex-col gap-1 bg-transparent backdrop-blur-2xl sm:hidden">
      <div class="flex items-center justify-between border-b border-neutral-500/50 px-4 py-2">
        <span class="h-8 font-nova text-3xl">menu</span>
        <button
          class="size-8 border-0! bg-neutral-500/0 p-1 transition-colors hover:bg-neutral-500/10"
          onclick={() => (mobile_menu_open = false)}>
          <XMark />
        </button>
      </div>
      {#each nav_items as item (item.name)}
        <a
          href={item.href}
          data-sveltekit-reload={item.reload ? true : undefined}
          aria-current={is_active(item.href) ? "page" : undefined}
          class={[
            "mx-2 flex h-10 items-center gap-1 bg-neutral-500/0 px-2 transition-colors",
            is_active(item.href) ? "bg-neutral-500/15" : "hover:bg-neutral-500/10",
          ]}
          onclick={() => (mobile_menu_open = false)}>
          <NavIdenticon name={item.name} />
          <span>/{item.name}</span>
        </a>
      {/each}
    </nav>
  {/if}
</div>
