<script lang="ts">
  import { enhance } from "$app/forms";
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";

  let { data } = $props();

  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<div class="flex flex-col gap-2">
  <div class="flex items-center gap-4">
    <span class="text-xl">@{data.username}</span>

    <span
      hidden={!data.session || data.profile.id === data.session.user.id}
      class="flex flex-row items-stretch gap-1">
      {#if data.relationship && data.relationship.status === "accepted"}
        <button class="px-2" disabled>friended</button>
      {:else if data.relationship && data.relationship.status === "pending" && data.relationship.requestee_id === data.profile.id}
        <button class="px-2">requested</button>
      {:else}
        <form method="POST" action="?/request_relation" use:enhance>
          <input name="other_id" bind:value={data.profile.id} hidden />
          <button class="px-2" type="submit">add friend</button>
        </form>
      {/if}

      <form hidden={!data.relationship} method="POST" action="?/delete_relation" use:enhance>
        <input name="other_id" bind:value={data.profile.id} hidden />
        <button type="submit" title="remove" class="h-full px-1">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            stroke-width="1.5"
            stroke="currentColor"
            class="size-5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 18 18 6M6 6l12 12" />
          </svg>
        </button>
      </form>
    </span>
  </div>
  <div class="text-lg">{data.profile.name}</div>

  <!-- nullable -->
  {#if data.profile.bio}
    <div>{data.profile.bio}</div>
  {/if}

  {#if data.session && data.subroutines.length > 0}
    <hr />

    <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {#each grouped_subroutines.keys() as subtype (subtype)}
        <h2 class="text-xl">{subtype}</h2>
        <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
          {#each grouped_subroutines.get(subtype) as sub (sub.id)}
            {#if sub.type === "dot" || sub.type === "semaphore"}
              <DotSemaphore subroutine={sub} entries={data.entries_map?.get(sub.id)} />
            {:else if sub.type === "torch"}
              <Torch subroutine={sub} entries={data.entries_map?.get(sub.id)} />
            {:else}
              {`<${sub.type}>`} not implemented yet
            {/if}
          {/each}
        </div>
      {/each}
    </div>
  {/if}
</div>
