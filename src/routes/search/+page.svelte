<script lang="ts">
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import ArrowRight from "$lib/icons/arrow_right.svelte";
  import MagnifyingGlass from "$lib/icons/magnifying_glass.svelte";
  import { onDestroy } from "svelte";
  import { cubicOut } from "svelte/easing";
  import { slide } from "svelte/transition";

  const MAX_SEARCH_QUERY_LENGTH = 64;

  let search_query = $state("");
  let search_results = $state<{ username: string; name: string }[]>([]);
  let loading = $state(false);
  let search_timeout: ReturnType<typeof setTimeout> | undefined;
  let search_controller: AbortController | undefined;

  function update_search_query(value: string) {
    search_query = value.slice(0, MAX_SEARCH_QUERY_LENGTH);
    const q = search_query.trim();

    clearTimeout(search_timeout);
    search_controller?.abort();

    if (q.length < 1) {
      search_results = [];
      loading = false;
      return;
    }

    search_timeout = setTimeout(async () => {
      const controller = new AbortController();
      search_controller = controller;
      loading = true;

      try {
        const res = await fetch(`/api/search/users?q=${encodeURIComponent(q)}`, {
          signal: controller.signal,
        });

        search_results = await res.json();
      } catch (err) {
        if (!(err instanceof DOMException && err.name === "AbortError")) {
          throw err;
        }
      } finally {
        if (search_controller === controller) {
          loading = false;
        }
      }
    }, 100);
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

    <div class="flex flex-col gap-2 p-5 sm:p-7">
      <label for="search-query" class="block text-neutral-500">query</label>

      <div class="flex border border-neutral-500/50 transition-colors focus-within:border-inherit">
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

      {#if search_results.length > 0}
        <ul
          in:slide={{ duration: 150, easing: cubicOut }}
          class="divide-y divide-neutral-500/25 border border-neutral-500/50">
          {#each search_results as res (res.username)}
            <li>
              <a
                href="/@{res.username}"
                aria-label="View @{res.username}'s profile"
                class="group flex items-center gap-4 p-4 transition-colors hover:bg-neutral-500/10 sm:px-7">
                <span
                  class="flex size-10 shrink-0 items-center justify-center border border-neutral-500/50 font-nova text-lg text-neutral-500 transition-colors group-hover:border-current group-hover:text-inherit"
                  aria-hidden="true">
                  {(res.name || res.username).slice(0, 1).toUpperCase()}
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

    <footer class="border-t border-neutral-500/50 px-5 py-3 sm:px-7">
      <p class="font-mono text-xs text-neutral-500">profiles open at /@username</p>
    </footer>
  </section>
</main>
