<script lang="ts">
  import * as v from "valibot";
  import { SearchResultSchema, type SearchResult } from "$lib/search";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import ArrowLeft from "$lib/icons/arrow_left.svelte";
  import ArrowRight from "$lib/icons/arrow_right.svelte";
  import MagnifyingGlass from "$lib/icons/magnifying_glass.svelte";
  import { onDestroy } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  const MAX_SEARCH_QUERY_LENGTH = 64;
  const PAGE_SIZE = 20;

  let search_query = $state("");
  let search_results = $state.raw<SearchResult>({ users: [], has_more: false, next_offset: null });
  let loading = $state(false);
  let search_error = $state("");
  let offset = $state(0);
  let requested_offset = 0;
  let searched = $state(false);
  let search_timeout: ReturnType<typeof setTimeout> | undefined;
  let search_controller: AbortController | undefined;

  async function load_page(next_offset: number) {
    clearTimeout(search_timeout);
    search_controller?.abort();
    const controller = new AbortController();
    search_controller = controller;
    requested_offset = next_offset;
    loading = true;
    search_error = "";

    try {
      const params = new URLSearchParams({
        q: search_query.trim(),
        limit: String(PAGE_SIZE),
        offset: String(next_offset),
      });
      const res = await fetch(`/api/search/users?${params}`, { signal: controller.signal });
      if (!res.ok) throw new Error("search failed");
      const result = v.safeParse(SearchResultSchema, await res.json());
      if (!result.success) throw new Error("invalid search response");
      if (controller.signal.aborted) return;
      search_results = result.output;
      offset = next_offset;
      searched = true;
    } catch {
      if (!controller.signal.aborted) {
        search_error = "couldn't load profiles. please try again.";
      }
    } finally {
      if (!controller.signal.aborted) loading = false;
    }
  }

  function update_search_query(value: string) {
    search_query = value.slice(0, MAX_SEARCH_QUERY_LENGTH);
    clearTimeout(search_timeout);
    search_controller?.abort();
    search_results = { users: [], has_more: false, next_offset: null };
    search_error = "";
    offset = 0;
    searched = false;
    loading = search_query.trim().length > 0;
    if (loading) search_timeout = setTimeout(() => void load_page(0), 100);
  }

  onDestroy(() => {
    clearTimeout(search_timeout);
    search_controller?.abort();
  });
</script>

<main class="mx-auto w-full max-w-3xl py-8 sm:py-14">
  <section class="border border-neutral-500/50">
    <header class="border-b border-neutral-500/50 p-5 sm:p-7">
      <h1 class="font-nova text-3xl sm:text-4xl">/search</h1>
      <p class="mt-2 max-w-lg text-neutral-500">
        find a profile on subroutine by their name or username.
      </p>
    </header>

    <div class="flex flex-col gap-4 py-5">
      <label for="search-query" class="mx-5 block text-neutral-500 sm:mx-7">query</label>

      <div
        class="mx-5 flex border border-neutral-500/50 transition-colors focus-within:border-inherit sm:mx-7">
        <div class="aspect-square border-r border-neutral-500/50 p-2 text-neutral-500">
          <div class="size-6">
            {#if loading}
              <CircularSpinner />
            {:else}
              <MagnifyingGlass />
            {/if}
          </div>
        </div>

        <input
          id="search-query"
          type="text"
          maxlength={MAX_SEARCH_QUERY_LENGTH}
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          aria-describedby="search-query-count"
          bind:value={() => search_query, update_search_query}
          class="w-full px-3 py-2 outline-none placeholder:text-neutral-500/70" />
        <span
          id="search-query-count"
          class="flex items-center pr-3 font-mono text-xs text-neutral-500">
          {search_query.length}/{MAX_SEARCH_QUERY_LENGTH}
        </span>
      </div>

      {#if search_error}
        <div
          role="alert"
          class="flex items-center justify-between gap-4 border border-red-500/50 p-4">
          <p>{search_error}</p>
          <button type="button" onclick={() => load_page(requested_offset)} class="underline"
            >retry</button>
        </div>
      {/if}
      {#if loading || searched}
        <div in:slide={{ duration: 150, easing: cubicOut }} class="flex flex-col">
          <div
            class="sticky top-0 z-10 flex min-h-12.5 flex-wrap items-center justify-between gap-3 border-b border-neutral-500/50 bg-neutral-500/10 px-4 py-2 text-sm text-neutral-500 backdrop-blur dark:bg-neutral-900/95">
            <p role="status" class="flex min-h-8 items-center">
              {#if loading}
                searching...
              {:else if searched && !search_error}
                {#if search_results.users.length === 0}
                  no profiles found.
                {:else}
                  showing {offset + 1} to {offset + search_results.users.length}
                {/if}
              {/if}
            </p>

            {#if searched && (search_results.users.length > 0 || offset > 0)}
              <nav aria-label="Search result pages" class="flex items-center gap-3">
                <button
                  type="button"
                  aria-label="Previous page"
                  disabled={loading || offset === 0}
                  onclick={() => load_page(Math.max(0, offset - PAGE_SIZE))}
                  class="flex size-8 items-center justify-center border border-neutral-500/50 p-1.5 text-neutral-500 transition-colors disabled:cursor-not-allowed disabled:border-neutral-500/30 disabled:text-neutral-500/50">
                  <span class="size-4" aria-hidden="true"><ArrowLeft /></span>
                </button>
                <div class="flex items-center gap-1">
                  <label for="search-page">page</label>
                  <input
                    id="search-page"
                    type="number"
                    min="1"
                    max={Math.floor(2147483647 / PAGE_SIZE) + 1}
                    step="1"
                    value={Math.floor(offset / PAGE_SIZE) + 1}
                    oninput={(event) => {
                      clearTimeout(search_timeout);
                      const page = event.currentTarget.valueAsNumber;
                      const next_offset = (page - 1) * PAGE_SIZE;
                      if (!Number.isInteger(page) || page < 1 || next_offset > 2147483647) return;
                      search_timeout = setTimeout(() => void load_page(next_offset), 300);
                    }}
                    class="h-8 w-10 [appearance:textfield] border border-neutral-500/50 bg-transparent px-1 text-center text-current outline-none focus:border-current [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
                </div>
                <button
                  type="button"
                  aria-label="Next page"
                  disabled={loading || !search_results.has_more}
                  onclick={() =>
                    search_results.next_offset !== null && load_page(search_results.next_offset)}
                  class="flex size-8 items-center justify-center border border-neutral-500/50 p-1.5 transition-colors disabled:cursor-not-allowed disabled:border-neutral-500/30 disabled:text-neutral-500/50">
                  <span class="size-4" aria-hidden="true"><ArrowRight /></span>
                </button>
              </nav>
            {/if}
          </div>

          {#if search_results.users.length > 0}
            <ul
              in:slide={{ duration: 150, easing: cubicOut }}
              class="mx-5 mt-5 divide-y divide-neutral-500/25 border border-neutral-500/50 sm:mx-7">
              {#each search_results.users as res (res.username)}
                <li>
                  <a
                    href="/@{res.username}"
                    aria-label="View @{res.username}'s profile"
                    class="group flex items-center gap-4 p-4 transition-colors hover:bg-neutral-500/10 sm:px-7">
                    <span
                      class="flex size-10 shrink-0 items-center justify-center border border-neutral-500/50 font-mono text-lg text-neutral-500 transition-colors group-hover:border-current group-hover:text-inherit"
                      aria-hidden="true">
                      {res.username.slice(0, 1).toUpperCase()}
                    </span>

                    <span class="min-w-0 flex-1">
                      <span class="block truncate">{res.name || res.username}</span>
                      <span class="block truncate text-sm text-neutral-500">@{res.username}</span>
                    </span>

                    <span
                      class="size-5 shrink-0 text-neutral-500 transition-transform group-hover:translate-x-1 group-hover:text-inherit"
                      aria-hidden="true">
                      <ArrowRight />
                    </span>
                  </a>
                </li>
              {/each}
            </ul>
          {/if}
        </div>
      {/if}
    </div>

    <footer class="border-t border-neutral-500/50 px-5 py-3 sm:px-7">
      <p class="font-mono text-xs text-neutral-500">profiles open at /@username</p>
    </footer>
  </section>
</main>
