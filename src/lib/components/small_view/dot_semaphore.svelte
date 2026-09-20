<script lang="ts">
  import { enhance } from "$app/forms";
  import ArrowLongRight from "$lib/icons/arrow_long_right.svelte";
  import type { Tables } from "$lib/types/database.types";
  import LineChart from "$lib/components/line_chart.svelte";
  import Identicon from "../identicon.svelte";
  import { eval_math } from "$lib/eval_math";

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

  let optimistic_entries = $derived(entries);
  let server_expr = $derived(String(entries.at(-1)?.data?.value ?? "0"));
  let draft_expr = $state<string | null>(null);
  let sem_expr = $derived(draft_expr ?? server_expr);

  const arithmetic_operations = [
    { label: "+", operator: "+", name: "add" },
    { label: "−", operator: "-", name: "subtract" },
    { label: "×", operator: "*", name: "multiply" },
    { label: "÷", operator: "/", name: "divide" },
  ] as const;

  function append_operator(operator: (typeof arithmetic_operations)[number]["operator"]) {
    draft_expr = `${sem_expr}${operator}`;
  }
</script>

<div class="flex flex-col gap-2 border border-neutral-500/50 p-2">
  <div>
    <h2 class="flex items-center gap-1 overflow-x-auto text-xl whitespace-nowrap">
      <Identicon name={subroutine.type} />
      <a {href}>{subroutine.title}</a>
    </h2>
  </div>

  <LineChart type={subroutine.type} entries={optimistic_entries} />

  {#if editable}
    <form
      method="POST"
      action="/s/{subroutine.id}?/insert_entry"
      use:enhance={({ formData }) => {
        const created_at = new Date().toISOString();
        formData.append("timestamp", created_at);

        // optimistic update
        optimistic_entries = [
          ...optimistic_entries,
          {
            created_at,
            data: subroutine.type === "semaphore" ? { value: eval_math(sem_expr) } : null,
            id: "",
            subroutine_id: "",
            user_id: "",
            title: null,
            description: null,
            location: null,
            ascii_art: null,
          },
        ];
        // console.log("optimistic update");

        return async ({ result, update }) => {
          if (result.type === "error") {
            optimistic_entries = optimistic_entries.slice(0, -1);
            // console.log(result.type, "(form submission failed)");
          } else {
            // console.log("success (form submitted)");
          }

          await update({ reset: false });

          if (result.type === "success") {
            draft_expr = null;
          }
          // console.log("update state with fetched page data");
        };
      }}>
      {#if subroutine.type === "dot"}
        <input hidden name="subroutine_id" value={subroutine.id} />
        <button class="w-full bg-black/10 px-2 text-lg dark:bg-white/10">dot</button>
      {:else if subroutine.type === "semaphore"}
        <input hidden name="subroutine_id" value={subroutine.id} />
        <input hidden name="subroutine_type" value="semaphore" />
        <div class="flex shrink-0 gap-2">
          <div class="flex min-w-0 basis-2/3 flex-col gap-1">
            <input
              bind:value={() => sem_expr, (value) => (draft_expr = value)}
              class="w-full border border-neutral-500/50 bg-transparent p-2 py-2 text-center font-mono text-xl outline-none focus:border-current" />
            <div class="grid grid-cols-4 gap-1">
              {#each arithmetic_operations as operation (operation.operator)}
                <button
                  type="button"
                  aria-label={operation.name}
                  onclick={() => append_operator(operation.operator)}
                  class="bg-black/10 px-2 py-1 font-mono text-lg dark:bg-white/10">
                  {operation.label}
                </button>
              {/each}
            </div>
          </div>
          <input name="value" type="text" value={eval_math(sem_expr)} required hidden />
          <div
            class="flex grow flex-col items-center justify-center gap-1 overflow-scroll bg-neutral-500/10 font-mono text-sm whitespace-nowrap text-neutral-500">
            = {eval_math(sem_expr) ?? "?"}
          </div>
          <button
            aria-label="submit"
            type="submit"
            class="flex w-full shrink-0 basis-1/8 items-center justify-center bg-black/10 px-2 text-lg dark:bg-white/10">
            <span class="h-6">
              <ArrowLongRight />
            </span>
          </button>
        </div>
      {/if}
    </form>
  {/if}
</div>
