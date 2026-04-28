<script lang="ts">
  import LineChart from "$lib/components/line_chart.svelte";
  import Torch from "$lib/components/torch.svelte";
  import UsernameGoto from "$lib/components/username_goto.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();

  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<main class="flex flex-col gap-2">
  {#if data.session}
    <nav class="flex flex-wrap items-center justify-center gap-2 p-2 sm:justify-start">
      <UsernameGoto />
      <a href="/create">/create</a>
      <a href="/settings">/settings</a>
      <a href="/signout" data-sveltekit-reload>/signout</a>
    </nav>

    <hr />

    {#each grouped_subroutines.keys() as subtype}
      <h2 class="text-xl">{subtype}</h2>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {#each grouped_subroutines.get(subtype) as sub (sub.id)}
          {#if sub.type === "dot" || sub.type === "semaphore"}
            <div class="flex flex-col gap-2 border p-2">
              <div>
                <h2>{sub.title} {`<${sub.type}>`}</h2>
                <!-- <div>{sub.description}</div> -->
              </div>

              <LineChart type={sub.type} entries={data.entries_map?.get(sub.id)} />

              {#if data.entries_map?.get(sub.id)}
                <div class="border p-2">
                  <h2>entries</h2>
                  {#each data.entries_map.get(sub.id) as entry (entry.id)}
                    <div>{new Date(entry.created_at)}</div>
                  {/each}
                </div>
              {/if}
            </div>
          {:else if sub.type === "torch"}
            <Torch subroutine={sub} entries={data.entries_map?.get(sub.id)} />
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
  {/if}
</main>
