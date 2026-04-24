<script lang="ts">
  import LineChart from "$lib/components/line_chart.svelte";

  let { data } = $props();
</script>

<div class="flex flex-col gap-2">
  <div class="text-xl">@{data.username}</div>

  <div class="text-lg">{data.profile.name}</div>

  <!-- nullable -->
  {#if data.profile.bio}
    <div>{data.profile.bio}</div>
  {/if}

  {#if data.session}
    <hr />
    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each data.subroutines as sub, i (sub.id)}
        <div class="flex flex-col gap-2 border p-2">
          <div>
            <h2>{sub.title} {`<${sub.type}>`}</h2>
            <!-- <div>{sub.description}</div> -->
          </div>

          <LineChart type={sub.type} entries={data.sub_entries?.at(i)} />

          {#if data.sub_entries?.at(i)}
            <div class="border p-2">
              <h2>entries</h2>
              {#each data.sub_entries[i] as entry (entry.id)}
                <div>{new Date(entry.created_at)}</div>
              {/each}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  {/if}
</div>
