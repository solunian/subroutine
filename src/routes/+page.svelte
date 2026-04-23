<script lang="ts">
  import LineChart from "$lib/components/line_chart.svelte";
  import UsernameGoto from "$lib/components/username_goto.svelte";
  import type { PageProps } from "./$types";

  let { data }: PageProps = $props();
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
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each data.subroutines as sub (sub.id)}
        <div class="flex flex-col gap-2 border p-2">
          <div>
            <h2>{sub.title} {`<${sub.type}>`}</h2>
            <!-- <div>{sub.description}</div> -->
          </div>

          <LineChart type={sub.type} {entries} />

          {#if entries}
            <div class="border p-2">
              <h2>entries</h2>
              {#each entries as entry (entry.id)}
                <div>{new Date(entry.created_at)}</div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {:else}
    <div>
      <a href="/signin">/signin</a>
      <a href="/signup">/signup</a>
      <a href="/magiclink">/magiclink</a>
    </div>
  {/if}
</main>
