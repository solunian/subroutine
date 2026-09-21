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
  import XMark from "$lib/icons/x_mark.svelte";
  import { fade } from "svelte/transition";
  import Sidebar from "$lib/icons/sidebar.svelte";
  import { DropdownMenu } from "bits-ui";
  import MyDropdownMenuContent from "$lib/components/ui/my_dropdown_menu_content.svelte";
  import ArrowRightStartOnRectangle from "$lib/icons/arrow_right_start_on_rectangle.svelte";
  import Cog from "$lib/icons/cog.svelte";
  import AtSymbol from "$lib/icons/at_symbol.svelte";
  import Identicon from "$lib/components/identicon.svelte";

  if (!browser) {
    update_now();
  }

  let { data, children } = $props();
  let { supabase, session } = $derived(data);
  let sidebar_collapsed = $derived(data.sidebar_collapsed);
  let mobile_menu_open = $state(false);

  const toggle_sidebar = () => {
    sidebar_collapsed = !sidebar_collapsed;

    try {
      const secure = location.protocol === "https:" ? "; Secure" : "";
      document.cookie = `subroutine-sidebar-collapsed=${sidebar_collapsed}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
    } catch {
      // Keep the sidebar usable when cookies are unavailable.
    }
  };

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
    { name: "/search", href: "/search" },
    { name: ">/friends", href: data.username ? `/@${data.username}/friends` : "" },
    { name: "/create", href: "/create" },
    { name: "hr", href: "" },
  ]);

  const mobile_nav_items = $derived([
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
        <span class="h-6"><Bars3 /></span>
      </button>
    {/if}
  </header>

  <div class="flex min-h-0 flex-1">
    {#if session && data.username}
      <aside
        class={[
          "hidden shrink-0 border-r border-neutral-500/50 transition-[width] sm:flex sm:flex-col",
          sidebar_collapsed ? "w-15" : "w-60",
        ]}>
        <nav class="flex h-full flex-col gap-1">
          {#each nav_items as item (item.name)}
            {#if item.name === "hr"}
              <hr class="my-1 border-neutral-500/50" />
            {:else}
              <a
                href={item.href}
                aria-current={is_active(item.href) ? "page" : undefined}
                title={sidebar_collapsed ? item.name : undefined}
                class={[
                  "mx-2 flex h-10 flex-nowrap items-center gap-1 overflow-hidden px-2 text-neutral-500/95 transition-colors first:mt-2 last:mb-2 hover:text-inherit",
                  is_active(item.href) ? "bg-neutral-500/15" : "hover:bg-neutral-500/10",
                  sidebar_collapsed && "w-fit",
                ]}>
                <Identicon name={item.name} />
                <span class={["text-nowrap", sidebar_collapsed && "sr-only"]}>
                  {item.name}
                </span>
              </a>
            {/if}
          {/each}

          <button
            type="button"
            class="mx-2 mt-auto flex w-fit items-center border-neutral-500/50 px-2 py-2 text-neutral-500/95 transition-colors first:mt-2 last:mb-2 hover:bg-neutral-500/10 hover:text-inherit"
            aria-label={sidebar_collapsed ? "expand sidebar" : "collapse sidebar"}
            aria-expanded={!sidebar_collapsed}
            onclick={toggle_sidebar}>
            <span class="h-6">
              <Sidebar />
            </span>
          </button>

          <div class="flex flex-col gap-1 border-t border-neutral-500/50">
            <DropdownMenu.Root>
              <DropdownMenu.Trigger
                class={[
                  "group m-2 flex h-10 flex-nowrap items-center gap-2 overflow-hidden px-2  transition-colors hover:bg-neutral-500/10",
                ]}>
                <span
                  class="flex size-6 min-w-6 items-center justify-center border border-neutral-500/50 font-mono text-lg text-neutral-500 transition-colors select-none group-hover:border-current group-hover:text-current"
                  aria-hidden="true">
                  {data.username.slice(0, 1).toUpperCase()}
                </span>
                <span
                  class={[
                    "overflow-hidden text-nowrap text-neutral-500 transition-colors group-hover:border-current group-hover:text-current",
                    sidebar_collapsed && "sr-only",
                  ]}>{data.username}</span>
              </DropdownMenu.Trigger>
              <MyDropdownMenuContent align="start">
                <DropdownMenu.Item>
                  <a
                    href="/@{data.username}"
                    class="flex w-full min-w-60 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10 hover:text-current">
                    <span class="size-5"><AtSymbol /></span>/profile
                  </a>
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <a
                    href="/settings"
                    class="flex w-full min-w-60 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10 hover:text-current">
                    <span class="size-5"><Cog /></span>/settings
                  </a>
                </DropdownMenu.Item>
                <DropdownMenu.Item>
                  <a
                    href="/signout"
                    data-sveltekit-reload
                    class="flex w-full min-w-40 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10 hover:text-current">
                    <span class="size-5"><ArrowRightStartOnRectangle /></span>/signout
                  </a>
                </DropdownMenu.Item>
              </MyDropdownMenuContent>
            </DropdownMenu.Root>
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
          class="size-8 bg-neutral-500/0 p-1 transition-colors hover:bg-neutral-500/10"
          onclick={() => (mobile_menu_open = false)}>
          <XMark />
        </button>
      </div>
      {#each mobile_nav_items as item (item.name)}
        <a
          href={item.href}
          data-sveltekit-reload={item.reload ? true : undefined}
          aria-current={is_active(item.href) ? "page" : undefined}
          class={[
            "mx-2 flex h-10 items-center gap-1 bg-neutral-500/0 px-2 transition-colors",
            is_active(item.href) ? "bg-neutral-500/15" : "hover:bg-neutral-500/10",
          ]}
          onclick={() => (mobile_menu_open = false)}>
          <Identicon name={item.name} />
          <span>{item.name}</span>
        </a>
      {/each}
    </nav>
  {/if}
</div>
