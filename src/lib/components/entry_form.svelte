<script lang="ts">
  import DateTimeField from "./date_time_field.svelte";
  import { enhance } from "$app/forms";
  import { adjacent_entries, local_datetime, torch_pair } from "$lib/entry_helpers";
  import { to_fulltime_str } from "$lib/helpers";
  import type { Tables } from "$lib/types/database.types";

  let {
    subroutine_id,
    type,
    entries,
    entry,
    oncancel,
    onsaved,
  }: {
    subroutine_id: string;
    type: string;
    entries: Tables<"entries">[];
    entry?: Tables<"entries">;
    oncancel: () => void;
    onsaved: () => void;
  } = $props();
  const id = $props.id();
  const opened_at = new Date().toISOString();
  let pair = $derived(entry && type === "torch" ? torch_pair(entries, entry.id) : []);
  let start = $derived(local_datetime(pair[0]?.created_at ?? entry?.created_at ?? opened_at));
  let end = $derived(
    pair[1] ? local_datetime(pair[1].created_at) : entry ? "" : local_datetime(opened_at)
  );
  let value = $derived<number | undefined>(entry?.data?.value ?? 0);
  let neighbors = $derived(adjacent_entries(entries, start, entry?.id));
  let pending = $state(false);
  let message = $state("");
  const input_class =
    "w-full min-w-0 border border-neutral-500/50 bg-transparent px-3 py-2 font-mono text-sm outline-none focus:border-current disabled:opacity-50";
</script>

<form
  method="POST"
  action="/s/{subroutine_id}?/{entry ? 'update_entry' : 'insert_entry'}"
  use:enhance={({ formData, cancel }) => {
    message = "";
    if (!start || !Number.isFinite(Date.parse(start))) {
      message = "Choose a valid time.";
      cancel();
      return;
    }
    if (type === "torch" && !end && (!entry || pair.length === 2)) {
      message = "Choose a valid end time.";
      cancel();
      return;
    }
    if (type === "torch" && end && Date.parse(end) <= Date.parse(start)) {
      message = "End time must be after the beginning.";
      cancel();
      return;
    }
    formData.set("created_at", new Date(start).toISOString());
    if (type === "torch") formData.set("end_at", end ? new Date(end).toISOString() : "");
    pending = true;
    return async ({ result, update }) => {
      try {
        if (result.type === "success") {
          await update({ reset: false });
          onsaved();
        } else if (result.type === "redirect") {
          await update();
        } else {
          message =
            result.type === "failure" && typeof result.data?.message === "string"
              ? result.data.message
              : "Could not save the entry. Please try again.";
        }
      } finally {
        pending = false;
      }
    };
  }}
  class="flex flex-col gap-4">
  {#if entry}<input type="hidden" name="entry_id" value={entry.id} />{/if}
  <fieldset disabled={pending} class="grid min-w-0 gap-4 sm:grid-cols-2">
    <div class={type === "dot" ? "sm:col-span-2" : ""}>
      <DateTimeField
        label={type === "torch" ? "start" : "time"}
        name="created_at"
        required
        disabled={pending}
        bind:value={start} />
    </div>
    {#if type === "semaphore"}
      <div>
        <label for="{id}-value" class="mb-1.5 block text-sm text-neutral-500">value</label>
        <input
          id="{id}-value"
          name="value"
          type="number"
          step="any"
          required
          bind:value
          class={input_class} />
      </div>
      <div
        class="grid grid-cols-2 gap-3 border border-neutral-500/25 bg-neutral-500/5 p-3 sm:col-span-2"
        aria-live="polite">
        {#each [{ label: "previous value", entry: neighbors.before }, { label: "next value", entry: neighbors.after }] as neighbor (neighbor.label)}
          <div class="min-w-0">
            <div class="text-xs text-neutral-500">{neighbor.label}</div>
            <div class="font-mono text-lg break-words">{neighbor.entry?.data?.value ?? "—"}</div>
            <div class="text-xs text-neutral-500">
              {neighbor.entry ? to_fulltime_str(new Date(neighbor.entry.created_at)) : "no entry"}
            </div>
          </div>
        {/each}
      </div>
    {:else if type === "torch"}
      <div>
        <DateTimeField
          label="end"
          name="end_at"
          required={!entry || pair.length === 2}
          disabled={pending}
          bind:value={end} />
      </div>
      {#if entry && pair.length === 1}
        <p class="text-sm text-neutral-500 sm:col-span-2">
          This torch is running. Leave the end empty to keep it running.
        </p>
      {/if}
    {/if}
  </fieldset>
  <p class="text-xs text-neutral-500">times are in your local timezone</p>
  {#if message}<p role="alert" class="text-sm text-red-600 dark:text-red-400">{message}</p>{/if}
  <div class="flex justify-end gap-2">
    <button
      type="button"
      onclick={oncancel}
      disabled={pending}
      class="border border-neutral-500/50 px-4 py-1.5 text-sm transition-colors hover:bg-neutral-500/10 disabled:opacity-50"
      >cancel</button>
    <button
      type="submit"
      disabled={pending}
      class="border border-green-500/30 bg-green-500/15 px-4 py-1.5 text-sm transition-colors hover:bg-green-500/25 disabled:opacity-50"
      >{pending ? "saving…" : entry ? "save changes" : "insert entry"}</button>
  </div>
</form>
