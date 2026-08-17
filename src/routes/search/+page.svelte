<script lang="ts">
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
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

      <div
        class="flex w-full border border-neutral-500/50 transition-colors focus-within:border-inherit">
        <span
          aria-hidden="true"
          class="flex aspect-square items-center justify-center border-r border-neutral-500/50 text-neutral-500">
          {#if loading}
            <CircularSpinner />
          {:else}
            <span class="size-5"><MagnifyingGlass /></span>
          {/if}
        </span>
        <input
          id="search-query"
          type="text"
          maxlength={MAX_SEARCH_QUERY_LENGTH}
          autocomplete="username"
          autocapitalize="none"
          spellcheck="false"
          aria-describedby="search-query-count"
          bind:value={() => search_query, update_search_query}
          class="min-w-0 flex-1 border-0! bg-transparent px-3 py-2 outline-none placeholder:text-neutral-500/70" />
        <span
          id="search-query-count"
          class="flex items-center pr-3 font-mono text-xs text-neutral-500">
          {search_query.length}/{MAX_SEARCH_QUERY_LENGTH}
        </span>
      </div>

      {#if search_results.length > 0}
        <div
          in:slide={{ duration: 150, easing: cubicOut }}
          class="flex flex-col border border-neutral-500/50">
          {#each search_results as res (res.username)}
            <a
              href="/@{res.username}"
              class="flex gap-2 p-2 text-neutral-500 transition-colors even:bg-neutral-500/5 hover:bg-neutral-500/15 hover:text-inherit">
              <span>@{res.username}</span>
              <span>{res.name}</span>
            </a>
          {/each}
        </div>
      {/if}
    </div>

    <footer class="border-t border-neutral-500/50 px-5 py-3 sm:px-7">
      <p class="font-mono text-xs text-neutral-500">profiles open at /@username</p>
    </footer>
  </section>
</main>
