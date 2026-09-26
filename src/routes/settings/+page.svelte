<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import Cog from "$lib/icons/cog.svelte";
  import Trash from "$lib/icons/trash.svelte";
  import MyDialog from "$lib/components/ui/my_dialog.svelte";
  import { Dialog } from "bits-ui";
  import type { SubmitFunction } from "@sveltejs/kit";

  let { data, form } = $props();

  let loading = $state(false);
  let opened_delete_dialog = $state(false);
  let deleting = $state(false);
  let delete_error = $state("");

  const submit_delete: SubmitFunction = ({ cancel }) => {
    if (deleting) {
      cancel();
      return;
    }
    deleting = true;
    delete_error = "";
    return async ({ result, update }) => {
      deleting = false;
      if (result.type === "failure") {
        delete_error = String(
          result.data?.delete_error ?? "Unable to delete your account. Try again."
        );
      } else if (result.type === "error") {
        delete_error = "Unable to delete your account. Try again.";
      } else {
        await update({ reset: false });
      }
    };
  };

  const submit: SubmitFunction = ({ formData }) => {
    formData.append("timestamp", new Date().toISOString());

    loading = true;
    return async ({ update }) => {
      loading = false;
      update({ reset: false, invalidateAll: false });
    };
  };
</script>

<div class="flex w-full justify-center py-16">
  <div class="flex w-lg flex-col items-center gap-2 border border-neutral-500/50 p-8">
    <h1 class="flex w-full items-center gap-2 py-2 font-nova text-3xl sm:text-4xl">
      <span class="size-10 animate-[spin_7s_linear_infinite]"><Cog /></span>
      <span>/settings</span>
    </h1>
    <form
      method="POST"
      action="?/update_profile"
      use:enhance={submit}
      class="flex w-full flex-col gap-2">
      {form?.message}

      <div>
        <label for="email">email</label>
        <input name="email" type="text" class="text-neutral-500" value={data.email} disabled />
      </div>

      <div>
        <label for="username">username</label>
        <input name="username" type="text" value={form?.username ?? data.profile?.username ?? ""} />
        {form?.errors?.username}
      </div>

      <div>
        <label for="name">name</label>
        <input name="name" type="text" value={form?.name ?? data.profile?.name ?? ""} />
        {form?.errors?.name}
      </div>

      <div>
        <label for="website">bio</label>
        <textarea name="bio" value={form?.bio ?? data.profile?.bio ?? ""}></textarea>
        {form?.errors?.bio}
      </div>

      <div>
        <label for="website">website</label>
        <input name="website" type="url" value={form?.website ?? data.profile?.website ?? ""} />
        {form?.errors?.website}
      </div>

      <div class="flex justify-between gap-2 py-2">
        <button
          type="submit"
          disabled={loading}
          class="flex w-full items-center justify-center bg-black/10 px-4 py-1 dark:bg-white/10">
          {#if loading}
            <CircularSpinner />
            <span class="sr-only">updating...</span>
          {:else}
            update
          {/if}
        </button>
        <a
          href="/signout"
          data-sveltekit-reload
          class="w-full bg-black/10 px-4 py-1 text-center dark:bg-white/10">/signout</a>
      </div>
    </form>
    <div class="w-full border-t border-neutral-500/50 pt-4">
      <button
        type="button"
        onclick={() => {
          delete_error = "";
          opened_delete_dialog = true;
        }}
        class="flex w-full items-center justify-center gap-2 bg-red-500/25 px-4 py-1">
        <span class="size-5"><Trash /></span> delete account
      </button>
    </div>

    <MyDialog
      bind:open={opened_delete_dialog}
      contentProps={{
        onEscapeKeydown: (event) => {
          if (deleting) event.preventDefault();
        },
        onInteractOutside: (event) => {
          if (deleting) event.preventDefault();
        },
      }}>
      <div class="flex flex-col gap-4">
        <Dialog.Title class="flex items-center gap-2 text-2xl">
          <span class="h-8"><Trash /></span> delete account
        </Dialog.Title>
        <Dialog.Description class="text-neutral-500">
          this will permanently delete your account, profile, subroutines, entries, and connections.
          this cannot be undone.
        </Dialog.Description>
        {#if delete_error}
          <p role="alert" class="text-red-600 dark:text-red-400">{delete_error}</p>
        {/if}
        <div class="flex gap-2">
          <button
            type="button"
            disabled={deleting}
            onclick={() => (opened_delete_dialog = false)}
            class="grow bg-neutral-500/25 py-1 text-lg">cancel</button>
          <form method="POST" action="?/delete_account" use:enhance={submit_delete} class="grow">
            <button
              type="submit"
              disabled={deleting}
              class="flex h-9 w-full items-center justify-center bg-red-500/25 py-1 text-lg">
              {#if deleting}
                <CircularSpinner />
                <span class="sr-only">deleting account...</span>
              {:else}
                confirm
              {/if}
            </button>
          </form>
        </div>
      </div>
    </MyDialog>
  </div>
</div>

<style>
  @reference "tailwindcss";

  input,
  textarea {
    @apply w-full border border-neutral-500/50 bg-transparent p-2 outline-none focus:border-current;
  }

  textarea {
    @apply resize-y;
  }
</style>
