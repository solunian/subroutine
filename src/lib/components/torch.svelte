<script lang="ts">
  import type { Tables } from "$lib/types/database.types";
  import { now } from "$lib/state/time.svelte";
  import { enhance } from "$app/forms";
  import NumberFlow from "@number-flow/svelte";
  let {
    subroutine,
    entries = [],
    href,
    editable = false,
  }: {
    subroutine: Tables<"subroutines">;
    entries?: Tables<"entries">[];
    href: string;
    editable: boolean;
  } = $props();

  let torch_on = $derived(entries.length % 2 !== 0);

  // in milliseconds
  let total_duration = $derived.by(() => {
    let result = 0;
    if (entries.length >= 2) {
      for (let i = 0; i < entries.length - 1; i += 2) {
        result +=
          new Date(entries[i + 1].created_at).getTime() - new Date(entries[i].created_at).getTime();
      }
    }

    if (entries.length % 2 !== 0) {
      result += now.getTime() - new Date(entries[entries.length - 1].created_at).getTime();
    }

    return result;
  });

  let hrs = $derived(Math.trunc(total_duration / 1000 / 60 / 60));
  let min = $derived(Math.trunc((total_duration / 1000 / 60) % 60));
  let sec = $derived(Math.trunc((total_duration / 1000) % 60));
</script>

<div
  class={[
    "flex flex-col gap-2 border p-2 transition",
    torch_on && "border-amber-500 bg-amber-100 dark:bg-amber-900",
  ]}>
  <h2 class="text-xl">{`<${subroutine.type}>`} <a {href}>{subroutine.title}</a></h2>

  <div class="px-3 py-2 text-center font-mono text-2xl">
    <NumberFlow trend={+1} format={{ minimumIntegerDigits: 2 }} value={hrs} />:<NumberFlow
      trend={+1}
      digits={{ 1: { max: 5 } }}
      format={{ minimumIntegerDigits: 2 }}
      value={min} />:<NumberFlow
      trend={+1}
      digits={{ 1: { max: 5 } }}
      format={{ minimumIntegerDigits: 2 }}
      value={sec} />
  </div>

  {#if editable}
    <form
      method="POST"
      action="/?/append"
      use:enhance={() => {
        return async ({ update }) => {
          await update({ reset: false });
        };
      }}>
      <input hidden name="subroutine_id" value={subroutine.id} />
      <button class="w-full border-0! bg-black/10 px-2 text-lg dark:bg-white/10"
        >{torch_on ? "torch off" : "torch on"}</button>
    </form>
  {/if}
</div>
