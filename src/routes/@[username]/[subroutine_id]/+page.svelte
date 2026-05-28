<script lang="ts">
  import { enhance } from "$app/forms";
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import { to_date_str, to_fulltime_str } from "$lib/helpers";

  let { data } = $props();
</script>

{#if data.session}
  <div class="flex flex-col gap-4">
    <header class="flex flex-col gap-1 p-4">
      <a href="/@{data.username}" class="flex items-center font-nova text-xl opacity-50">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="size-5">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
        </svg>
        {data.username}
      </a>

      <h1 class="flex items-center gap-1 text-2xl">
        <TypeIdenticon type={data.subroutine.type} />
        {data.subroutine.title}
      </h1>

      <div class="flex flex-nowrap items-center gap-2 text-nowrap opacity-50">
        <span>{to_date_str(new Date(data.subroutine.created_at))}</span>
        <span>·</span>
        <span>{data.entries.length} {(data.entries.length ?? 0) !== 1 ? "entries" : "entry"}</span>
      </div>

      <!-- nullable -->
      {#if data.subroutine.description}
        <div>{data.subroutine.description}</div>
      {/if}
    </header>

    <div class="grid grid-cols-1 md:grid-cols-5 lg:grid-cols-7 2xl:grid-cols-9">
      <div class="col-span-3 md:col-start-2 lg:col-start-3 2xl:col-start-4">
        {#if data.subroutine.type === "dot" || data.subroutine.type === "semaphore"}
          <DotSemaphore editable subroutine={data.subroutine} entries={data.entries} />
        {:else if data.subroutine.type === "torch"}
          <Torch editable subroutine={data.subroutine} entries={data.entries} />
        {:else}
          <div class="flex aspect-video w-full items-center justify-center border font-mono">
            not implemented yet -_-
          </div>
        {/if}
      </div>
    </div>

    {#if data.entries.length > 0}
      <div class="bg-neutral-500/20">
        <h2 class="border-b border-neutral-500/30 p-3 text-xl">entries</h2>

        <div>
          {#each data.entries.toReversed() as entry, idx (entry.id)}
            <form
              method="POST"
              action="?/delete_entry"
              class="flex gap-4 px-2 py-2 even:bg-neutral-500/20"
              use:enhance={() => {
                return async ({ update }) => {
                  await update({ reset: false });
                };
              }}>
              <span class="basis-1/12 text-neutral-500/50">{data.entries.length - idx - 1}</span>
              <div class="flex w-full basis-11/12 items-center justify-between gap-1">
                <span>{to_fulltime_str(new Date(entry.created_at))}</span>
                <span class="font-mono text-sm">{JSON.stringify(entry.data)}</span>
              </div>
              <input name="entry_id" value={entry.id} hidden />
              <button aria-label="delete" type="submit" class="border-0!">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke-width="1.5"
                  stroke="currentColor"
                  class="size-6">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
              </button>
            </form>
          {/each}
        </div>
      </div>
    {/if}

    <form
      method="POST"
      action="?/delete_subroutine"
      use:enhance={() => {
        return async ({ update }) => {
          await update({ reset: false });
        };
      }}>
      <input hidden name="subroutine_id" value={data.subroutine.id} />
      <button type="submit" class="px-3 py-1 text-xl text-red-500/50">delete</button>
    </form>
  </div>
{/if}
