<script lang="ts">
  import { now } from "$lib/state/time.svelte";
  import { enhance } from "$app/forms";
  import DropSelect from "$lib/components/drop_select.svelte";
  import { to_fulltime_str } from "$lib/helpers";
  import ArrowLeft from "$lib/icons/arrow_left.svelte";
  import ArrowRight from "$lib/icons/arrow_right.svelte";
  import PlusCircle from "$lib/icons/plus_circle.svelte";
  import XMark from "$lib/icons/x_mark.svelte";
  import type { Tables } from "$lib/types/database.types";
  import EntryForm from "./entry_form.svelte";
  import ChevronDown from "$lib/icons/chevron_down.svelte";
  import { entry_rows, interval_duration, supports_entry_editor } from "$lib/entry_helpers";

  let {
    subroutine_id,
    subroutine_type,
    entries = [],
    editable = false,
  }: {
    subroutine_id: string;
    subroutine_type: Tables<"subroutines">["type"];
    entries?: Tables<"entries">[];
    editable?: boolean;
  } = $props();

  const page_size_options = [
    { value: "32", label: "32 rows" },
    { value: "64", label: "64 rows" },
    { value: "128", label: "128 rows" },
  ] as const;
  const id = $props.id();
  let page = $state(1);
  let page_size = $state<"32" | "64" | "128">("32");
  let rows = $derived(entry_rows(entries, subroutine_type));
  let rows_per_page = $derived(Number(page_size));
  let total_pages = $derived(Math.max(1, Math.ceil(rows.length / rows_per_page)));
  let current_page = $derived(Math.max(1, Math.min(page, total_pages)));
  let page_start = $derived((current_page - 1) * rows_per_page);
  let visible_entries = $derived(rows.toReversed().slice(page_start, page_start + rows_per_page));

  function go_to_page(next_page: number) {
    if (!Number.isFinite(next_page)) return;
    page = Math.max(1, Math.min(Math.trunc(next_page), total_pages));
  }

  let updating_entry = $state<string | null>(null); // uuid of updating entry
  let inserting_entry = $state(false);
  let can_edit = $derived(editable && supports_entry_editor(subroutine_type));
</script>

<section class="border border-neutral-500/50" aria-labelledby="{id}-heading">
  <div
    class="sticky top-0 z-10 flex flex-wrap items-center justify-between gap-3 border-b border-neutral-500/50 bg-neutral-500/10 px-6 py-2 text-neutral-500 backdrop-blur dark:bg-neutral-900/95">
    <div class="flex items-center gap-3">
      <h2 id="{id}-heading" class="text-xl">entries</h2>
      {#if can_edit}
        <button
          type="button"
          aria-expanded={inserting_entry}
          aria-controls="{id}-insert"
          onclick={() => {
            inserting_entry = !inserting_entry;
            updating_entry = null;
          }}
          class="flex items-center gap-1.5 border border-neutral-500/50 px-2 py-1 text-sm transition-colors hover:bg-neutral-500/10 hover:text-current">
          <span class="size-4"><PlusCircle /></span> insert entry
        </button>
      {/if}
    </div>

    <nav
      class="flex flex-wrap items-center justify-end gap-6 text-sm"
      aria-label="Entries pagination">
      <div class="flex gap-3">
        <button
          type="button"
          class="flex size-8 items-center justify-center border border-neutral-500/50 p-1.5 text-neutral-500 transition-colors disabled:cursor-not-allowed disabled:border-neutral-500/30 disabled:text-neutral-500/50"
          aria-label="Previous page"
          disabled={current_page === 1}
          onclick={() => go_to_page(current_page - 1)}>
          <span class="size-4" aria-hidden="true"><ArrowLeft /></span>
        </button>

        <div class="flex items-center gap-1">
          <label for="{id}-page">page</label>
          <input
            id="{id}-page"
            value={current_page}
            oninput={(event) => {
              const val = Number(event.currentTarget.value);
              if (1 <= val && val <= total_pages) {
                go_to_page(val);
              }
            }}
            class="h-8 w-10 border border-neutral-500/50 bg-transparent px-1 text-center text-current outline-none focus:border-current" />
          <span>of {total_pages}</span>
        </div>

        <button
          type="button"
          class="flex size-8 items-center justify-center border border-neutral-500/50 p-1.5 transition-colors disabled:cursor-not-allowed disabled:border-neutral-500/30 disabled:text-neutral-500/50"
          aria-label="Next page"
          disabled={current_page === total_pages}
          onclick={() => go_to_page(current_page + 1)}>
          <span class="size-4" aria-hidden="true"><ArrowRight /></span>
        </button>
      </div>

      <div>
        <DropSelect
          id="{id}-page-size"
          options={page_size_options}
          bind:value={page_size}
          onchange={() => (page = 1)}
          ariaLabel="rows per page" />
      </div>

      <span>
        {rows.length}
        {subroutine_type === "torch"
          ? rows.length === 1
            ? "interval"
            : "intervals"
          : rows.length === 1
            ? "entry"
            : "entries"}
      </span>
    </nav>
  </div>

  {#if can_edit && inserting_entry}
    <div id="{id}-insert" class="border-b border-neutral-500/50 bg-neutral-500/5 p-4 sm:p-6">
      <h3 class="mb-4 text-lg">insert entry</h3>
      <EntryForm
        {subroutine_id}
        type={subroutine_type}
        {entries}
        oncancel={() => (inserting_entry = false)}
        onsaved={() => {
          inserting_entry = false;
          page = 1;
        }} />
    </div>
  {/if}

  {#if entries.length === 0}
    <div class="flex flex-col items-center gap-2 py-20">
      <h2 class="text-2xl">no entries</h2>
    </div>
  {:else}
    <div>
      {#each visible_entries as row, idx (row.start.id)}
        {@const entry = row.start}
        {@const entry_number = rows.length - page_start - idx - 1}
        <div class="border-neutral-500/50 not-last:border-b">
          <div class="flex items-center gap-3 px-3 py-2">
            {#if can_edit}
              <button
                type="button"
                aria-label="Edit entry {entry_number}"
                aria-expanded={updating_entry === entry.id}
                aria-controls="{id}-{entry.id}"
                onclick={() => {
                  updating_entry = updating_entry === entry.id ? null : entry.id;
                  inserting_entry = false;
                }}
                class="size-7 shrink-0 border border-neutral-500/30 p-1 text-neutral-500 transition-colors hover:bg-neutral-500/10 hover:text-current">
                <span
                  class={[
                    "block transition-transform",
                    updating_entry === entry.id && "rotate-180",
                  ]}><ChevronDown /></span>
              </button>
            {/if}
            <span class="basis-1/12 text-neutral-500/50">{entry_number}</span>
            {#if subroutine_type === "torch"}
              <div
                class="grid min-w-0 flex-1 grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto] sm:gap-4">
                <div>
                  <span class="block text-xs text-neutral-500">start</span><span class="text-sm"
                    >{to_fulltime_str(new Date(entry.created_at))}</span>
                </div>
                <div>
                  <span class="block text-xs text-neutral-500">end</span><span class="text-sm"
                    >{row.end ? to_fulltime_str(new Date(row.end.created_at)) : "running"}</span>
                </div>
                <div>
                  <span class="block text-xs text-neutral-500">duration</span><span
                    class="font-mono text-sm"
                    >{interval_duration(
                      entry.created_at,
                      row.end?.created_at ?? now.getTime()
                    )}</span>
                </div>
              </div>
            {:else}
              <div class="flex min-w-0 flex-1 items-center justify-between gap-2">
                <span>{to_fulltime_str(new Date(entry.created_at))}</span>
                <span class="font-mono text-sm"
                  >{subroutine_type === "semaphore"
                    ? entry.data?.value
                    : subroutine_type === "dot"
                      ? ""
                      : JSON.stringify(entry.data)}</span>
              </div>
            {/if}
            {#if editable}
              <form
                method="POST"
                action="/s/{subroutine_id}?/delete_entry"
                use:enhance={({ formData }) => {
                  formData.append("timestamp", new Date().toISOString());

                  return async ({ update }) => {
                    await update({ reset: false });
                  };
                }}
                class="h-6">
                <input name="entry_id" value={entry.id} hidden />
                <button
                  aria-label={subroutine_type === "torch" ? "delete interval" : "delete entry"}
                  type="submit"
                  class="h-6">
                  <XMark />
                </button>
              </form>
            {/if}
          </div>
          {#if can_edit && updating_entry === entry.id}
            <div
              id="{id}-{entry.id}"
              class="border-t border-neutral-500/25 bg-neutral-500/5 p-4 sm:p-6">
              <EntryForm
                {subroutine_id}
                type={subroutine_type}
                {entries}
                {entry}
                oncancel={() => (updating_entry = null)}
                onsaved={() => (updating_entry = null)} />
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</section>
