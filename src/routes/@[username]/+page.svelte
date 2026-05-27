<script lang="ts">
  import { enhance } from "$app/forms";
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import type { Database } from "$lib/types/database.types";

  let { data } = $props();

  const subtype_display_order: Database["public"]["Enums"]["subroutine_type"][] = [
    "dot",
    "semaphore",
    "torch",
  ];
  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<div class="flex flex-col gap-2">
  <header class="flex flex-col gap-1 p-4">
    <div class="text-lg opacity-50">{data.profile.name}</div>

    <div class="flex items-center gap-4">
      <span class="flex items-center font-nova text-2xl">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          stroke-width="2"
          stroke="currentColor"
          class="size-7">
          <path
            stroke-linecap="round"
            stroke-linejoin="round"
            d="M16.5 12a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Zm0 0c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25" />
        </svg>
        {data.username}
      </span>

      <span
        hidden={!data.session || data.profile.id === data.user_id}
        class="flex flex-row items-stretch gap-1">
        {#if data.relationship && data.relationship.status === "accepted"}
          <button class="px-2" disabled>friended</button>
        {:else if data.relationship && data.relationship.status === "pending" && data.relationship.requestee_id === data.profile.id}
          <button class="px-2">requested</button>
        {:else}
          <form
            method="POST"
            action="?/request_relation"
            use:enhance={() => {
              return async ({ update }) => {
                await update({ reset: false });
              };
            }}>
            <input name="other_id" value={data.profile.id} hidden />
            <button class="px-2" type="submit">add friend</button>
          </form>
        {/if}

        <form
          hidden={!data.relationship}
          method="POST"
          action="?/delete_relation"
          use:enhance={() => {
            return async ({ update }) => {
              await update({ reset: false });
            };
          }}>
          <input name="other_id" value={data.profile.id} hidden />
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

    <div class="flex flex-nowrap items-center gap-2 text-nowrap opacity-50">
      <span>
        {data.subroutines?.length ?? 0}
        {(data.subroutines?.length ?? 0) !== 1 ? "subroutines" : "subroutine"}
      </span>
      <span>·</span>
      <span>
        {data.num_friends}
        {data.num_friends !== 1 ? "friends" : "friend"}
      </span>
    </div>

    <!-- nullable -->
    {#if data.profile.bio}
      <div>{data.profile.bio}</div>
    {/if}
  </header>

  {#if data.session && data.subroutines && data.subroutines.length > 0}
    {#each subtype_display_order as subtype (subtype)}
      <h2 class="flex items-center gap-1 text-xl">
        <TypeIdenticon type={subtype} /><span>{subtype}</span>
      </h2>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {#each grouped_subroutines.get(subtype) as sub (sub.id)}
          {#if sub.type === "dot" || sub.type === "semaphore"}
            <DotSemaphore
              subroutine={sub}
              entries={data.entries_map?.get(sub.id)}
              href="/@{data.username}/{sub.id}" />
          {:else if sub.type === "torch"}
            <Torch
              subroutine={sub}
              entries={data.entries_map?.get(sub.id)}
              href="/@{data.username}/{sub.id}" />
          {:else}
            {`<${sub.type}>`} not implemented yet
          {/if}
        {/each}
      </div>
    {/each}
  {/if}
</div>
