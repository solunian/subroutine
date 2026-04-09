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
  <UsernameGoto />

  {#if data.session}
    <div>
      <a href="/settings">/settings</a>
      <a href="/signout" data-sveltekit-reload>/signout</a>
    </div>

    <hr />
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2">
      {#each data.subroutines as [sub, entries]}
        <div class="flex flex-col gap-2 border p-2">
          <div>
            <h2>{sub.title} {`<${sub.type}>`}</h2>
            <div>{sub.description}</div>
          </div>

          <LineChart {entries} />

          {#if entries}
            <div class="border p-2">
              <h2>entries</h2>
              {#each entries as entry}
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

<!-- <main>
  <h2>Standard 16:9 Chart</h2>
  <div class="">
    <LineChart data={sampleData} aspect_ratio={16 / 9} />
  </div>
</main> -->
