<script lang="ts">
  import { enhance } from "$app/forms";
  import ActivityGrid from "$lib/components/activity_grid.svelte";
  import MyDropdownMenuContent from "$lib/components/ui/my_dropdown_menu_content.svelte";
  import Entries from "$lib/components/entries.svelte";
  import { diff_days, from_now, to_date_str } from "$lib/helpers";
  import AtSymbol from "$lib/icons/at_symbol.svelte";
  import Check from "$lib/icons/check.svelte";
  import EllipsisHorizontal from "$lib/icons/ellipsis_horizontal.svelte";
  import Pencil from "$lib/icons/pencil.svelte";
  import Trash from "$lib/icons/trash.svelte";
  import XMark from "$lib/icons/x_mark.svelte";
  import { DropdownMenu } from "bits-ui";
  import MyDialog from "$lib/components/ui/my_dialog.svelte";
  import { now } from "$lib/state/time.svelte";
  import LockClosed from "$lib/icons/lock_closed.svelte";
  import Users from "$lib/icons/users.svelte";
  import SubroutineSmallView from "$lib/components/subroutine_small_view.svelte";
  import Identicon from "$lib/components/identicon.svelte";

  let { data } = $props();

  let editing_title = $state(false);

  let opened_delete_dialog = $state(false);
</script>

{#if data.session}
  <div class="flex flex-col gap-4">
    <header class="flex flex-col gap-1 p-4">
      <a
        href="/@{data.subroutine.profiles.username}"
        class="flex w-fit items-center font-nova text-xl opacity-50">
        <span class="size-5"><AtSymbol /></span>
        {data.subroutine.profiles.username}
      </a>

      <div class="flex items-center gap-3 text-2xl">
        <span class="flex items-center gap-1">
          <Identicon name={data.subroutine.type} />
          {#if !editing_title}
            <h1 class="h-8">{data.subroutine.title}</h1>
          {:else}
            <form
              method="POST"
              action="?/update_subroutine"
              use:enhance={({ formData }) => {
                formData.append("timestamp", new Date().toISOString());

                return async ({ update }) => {
                  editing_title = false;
                  await update({ reset: false });
                };
              }}
              class="flex h-8 gap-2">
              <input name="subroutine_id" value={data.subroutine.id} class="hidden" />
              <input
                {@attach (element) => element.focus()}
                name="title"
                value={data.subroutine.title}
                required
                class="field-sizing-content h-full min-w-24 border border-neutral-500 px-1 outline-none focus:border-current" />
              <button
                type="button"
                onclick={() => (editing_title = false)}
                class="flex aspect-square h-full shrink-0 items-center justify-center border border-neutral-500 p-1">
                <XMark />
              </button>
              <button
                type="submit"
                class="flex aspect-square h-full shrink-0 items-center justify-center border border-neutral-500 p-1">
                <Check />
              </button>
            </form>
          {/if}
        </span>

        <span class="size-5 text-neutral-500">
          {#if data.subroutine.visibility === "private"}
            <LockClosed />
          {:else if data.subroutine.visibility === "friends"}
            <Users />
          {/if}
        </span>

        {#if data.is_self}
          <DropdownMenu.Root>
            <DropdownMenu.Trigger class="size-8 text-neutral-500">
              <EllipsisHorizontal />
            </DropdownMenu.Trigger>
            <MyDropdownMenuContent align="start">
              <DropdownMenu.Item>
                <button
                  onclick={() => (editing_title = true)}
                  class="flex w-full min-w-40 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10 hover:text-current">
                  <span class="size-5"><Pencil /></span> rename
                </button>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <form
                  method="POST"
                  action="?/update_subroutine"
                  use:enhance={({ formData }) => {
                    formData.append("timestamp", new Date().toISOString());

                    return async ({ update }) => {
                      await update({ reset: false });
                    };
                  }}>
                  <input
                    name="visibility"
                    value={data.subroutine.visibility === "private" ? "friends" : "private"}
                    hidden />
                  <button
                    type="submit"
                    class="flex w-full min-w-40 items-center gap-2 p-2 pr-4 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10 hover:text-current">
                    {#if data.subroutine.visibility === "private"}
                      <span class="size-5"><Users /></span> make visible to friends
                    {:else if data.subroutine.visibility === "friends"}
                      <span class="size-5"><LockClosed /></span> make private
                    {/if}
                  </button>
                </form>
              </DropdownMenu.Item>
              <DropdownMenu.Item>
                <button
                  onclick={() => (opened_delete_dialog = true)}
                  class="flex w-full min-w-40 items-center gap-2 p-2 text-left text-neutral-500 transition-colors duration-150 hover:bg-neutral-500/10 hover:text-current">
                  <span class="size-5"><Trash /></span> delete
                </button>
              </DropdownMenu.Item>
            </MyDropdownMenuContent>
          </DropdownMenu.Root>
        {/if}
      </div>

      <div class="flex flex-nowrap items-center gap-2 text-nowrap opacity-50">
        <span>{to_date_str(new Date(data.subroutine.created_at))}</span>
        <span>·</span>
        <span
          >{data.subroutine.entries.length}
          {(data.subroutine.entries.length ?? 0) !== 1 ? "entries" : "entry"}</span>
        <span>·</span>
        <span>updated {from_now(now, new Date(data.subroutine.updated_at))}</span>
      </div>

      <!-- nullable -->
      {#if data.subroutine.description}
        <div>{data.subroutine.description}</div>
      {/if}
    </header>

    <div class="max-w-5xl">
      <SubroutineSmallView
        editable={data.is_self}
        subroutine={data.subroutine}
        entries={data.subroutine.entries} />
    </div>

    <ActivityGrid entries={data.subroutine.entries} subroutine_type={data.subroutine.type} />

    <Entries
      subroutine_id={data.subroutine.id}
      subroutine_type={data.subroutine.type}
      entries={data.subroutine.entries}
      editable={data.is_self} />

    <!-- delete subroutine dialog -->
    <MyDialog bind:open={opened_delete_dialog}>
      <div class="flex flex-col gap-4">
        <div class="flex items-center gap-2 text-2xl">
          <span class="h-8"><Trash /></span> delete {data.subroutine.title}
        </div>

        <div class="flex justify-center gap-2 text-neutral-500">
          <span>
            {diff_days(new Date(data.subroutine.created_at), now)}
            {diff_days(new Date(data.subroutine.created_at), now) !== 1 ? "days" : "day"} spent
          </span>
          <span>·</span>
          <span>
            {data.subroutine.entries.length}
            {(data.subroutine.entries.length ?? 0) !== 1 ? "entries" : "entry"}
          </span>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            onclick={() => (opened_delete_dialog = false)}
            class="grow bg-neutral-500/25 py-1 text-lg">cancel</button>
          <form
            method="POST"
            action="?/delete_subroutine"
            use:enhance={() => {
              return async ({ update }) => {
                await update({ reset: false });
              };
            }}
            class="grow">
            <input hidden name="subroutine_id" value={data.subroutine.id} />
            <button type="submit" class="w-full bg-red-500/25 py-1 text-lg">confirm</button>
          </form>
        </div>
      </div>
    </MyDialog>
  </div>
{/if}
