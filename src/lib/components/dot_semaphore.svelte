<script lang="ts">
  import { enhance } from "$app/forms";
  import type { Tables } from "$lib/types/database.types";
  import LineChart from "./line_chart.svelte";
  import TypeIdenticon from "./type_identicon.svelte";

  let {
    subroutine,
    entries = [],
    href,
    editable = false,
  }: {
    subroutine: Tables<"subroutines">;
    entries?: Tables<"entries">[];
    href?: string;
    editable?: boolean;
  } = $props();

  // svelte-ignore state_referenced_locally
  let optimistic_entries = $state(entries);
  // svelte-ignore state_referenced_locally
  let sem_value = $state(entries.at(-1)?.data?.value ?? 0);
</script>

<div class="flex flex-col gap-2 border border-neutral-500/50 p-2">
  <div>
    <h2 class="flex items-center gap-1 overflow-x-scroll text-xl whitespace-nowrap">
      <TypeIdenticon type={subroutine.type} /> <a {href}>{subroutine.title}</a>
    </h2>
  </div>

  <LineChart type={subroutine.type} entries={optimistic_entries} />

  {#if editable}
    <form
      method="POST"
      action="/?/append"
      use:enhance={() => {
        // optimistic update
        optimistic_entries.push({
          created_at: new Date().toISOString(),
          data: null,
          id: "",
          subroutine_id: "",
          user_id: "",
          title: null,
          description: null,
          location: null,
          ascii_art: null,
        });
        // console.log("optimistic update");

        return async ({ result, update }) => {
          if (result.type === "error") {
            optimistic_entries.pop();
            // console.log(result.type, "(form submission failed)");
          } else {
            // console.log("success (form submitted)");
          }

          await update({ reset: false });
          optimistic_entries = entries;
          // console.log("update state with fetched page data");
        };
      }}>
      {#if subroutine.type === "dot"}
        <input hidden name="subroutine_id" value={subroutine.id} />
        <button class="w-full border-0! bg-black/10 px-2 text-lg dark:bg-white/10">dot</button>
      {:else if subroutine.type === "semaphore"}
        <input hidden name="subroutine_id" value={subroutine.id} />
        <input hidden name="subroutine_type" value="semaphore" />
        <div class="flex shrink-0 gap-2">
          <input
            name="value"
            type="number"
            step="any"
            bind:value={sem_value}
            class="w-full basis-4/6 py-2 text-center font-mono text-xl" />
          <div class="flex basis-1/6 flex-col gap-1">
            <button
              aria-label="increment"
              onclick={() => sem_value++}
              type="button"
              class="flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m4.5 15.75 7.5-7.5 7.5 7.5" />
              </svg>
            </button>
            <button
              aria-label="decrement"
              type="button"
              onclick={() => sem_value--}
              class="flex items-center justify-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                stroke-width="1.5"
                stroke="currentColor"
                class="size-6">
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  d="m19.5 8.25-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
          </div>
          <button
            aria-label="submit"
            type="submit"
            class="flex w-full shrink-0 basis-1/6 items-center justify-center border-0! bg-black/10 px-2 text-lg dark:bg-white/10">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              stroke-width="1.5"
              stroke="currentColor"
              class="size-6">
              <path
                stroke-linecap="round"
                stroke-linejoin="round"
                d="M17.25 8.25 21 12m0 0-3.75 3.75M21 12H3" />
            </svg>
          </button>
        </div>
      {/if}
    </form>
  {/if}
</div>
