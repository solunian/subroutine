<script lang="ts">
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import UsernameGoto from "$lib/components/username_goto.svelte";
  import type { PageProps } from "./$types";
  import type { Database } from "$lib/types/database.types";

  let { data }: PageProps = $props();

  const subtype_display_order: Database["public"]["Enums"]["subroutine_type"][] = [
    "torch",
    "dot",
    "semaphore",
  ];
  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<main class="flex flex-col gap-2">
  {#if data.session}
    <nav class="flex flex-wrap items-center justify-center gap-2 p-2 sm:justify-start">
      <UsernameGoto />
      {#if data.username}<a href="/@{data.username}">[profile]</a>{/if}
      <a href="/create">/create</a>
      <a href="/settings">/settings</a>
      <a href="/signout" data-sveltekit-reload>/signout</a>
    </nav>

    {#each subtype_display_order as subtype (subtype)}
      <h2 class="flex items-center gap-1 p-2 text-xl">
        <TypeIdenticon type={subtype} /><span>{subtype}</span>
      </h2>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {#each grouped_subroutines.get(subtype) as sub (sub.id)}
          {#if sub.type === "dot" || sub.type === "semaphore"}
            <DotSemaphore
              subroutine={sub}
              entries={data.entries_map?.get(sub.id)}
              href="/@{data.username}/{sub.id}"
              editable />
          {:else if sub.type === "torch"}
            <Torch
              subroutine={sub}
              entries={data.entries_map?.get(sub.id)}
              href="/@{data.username}/{sub.id}"
              editable />
          {:else}
            {`<${sub.type}>`} not implemented yet
          {/if}
        {/each}
      </div>
    {/each}
  {:else}
    <div>
      <a href="/signin">/signin</a>
      <a href="/signup">/signup</a>
      <a href="/magiclink">/magiclink</a>
    </div>

    <div class="flex w-full justify-center py-16">
      <div
        class="flex aspect-video w-md flex-col items-center gap-2 border p-16 text-center font-mono">
        <div>subroutine: a life tracker</div>
        <div>counts, times, entries, graphs, trends, friends... simple stuff</div>
        <div>._.</div>
      </div>
    </div>
  {/if}
</main>
