<script lang="ts">
  import type { PageProps } from "./$types";
  import type { Database } from "$lib/types/database.types";
  import LandingPage from "$lib/components/landing_page.svelte";
  import SubroutineSmallView from "$lib/components/subroutine_small_view.svelte";
  import Identicon from "$lib/components/identicon.svelte";

  let { data }: PageProps = $props();

  const subtype_display_order: Database["public"]["Enums"]["subroutine_type"][] = [
    "dot",
    "semaphore",
    "torch",
    "journal",
    "summit",
    "nudge",
    "ping",
    "ledger",
    "blaze",
  ];

  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<main class="flex flex-col gap-2 py-2">
  {#if data.session && data.username}
    {#each subtype_display_order as subtype (subtype)}
      {#if (grouped_subroutines.get(subtype) ?? []).length > 0}
        <h2 class="flex items-center gap-1 p-2 text-xl">
          <Identicon name={subtype} /><span>{subtype}</span>
        </h2>
        <div class="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
          {#each grouped_subroutines.get(subtype) as sub (sub.id)}
            <SubroutineSmallView
              editable
              username={data.username}
              subroutine={sub}
              entries={sub.entries} />
          {/each}
        </div>
      {/if}
    {/each}
  {:else}
    <LandingPage />
  {/if}
</main>
