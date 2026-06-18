<script lang="ts">
  import { enhance } from "$app/forms";
  import Cog from "$lib/icons/cog.svelte";
  import type { SubmitFunction } from "@sveltejs/kit";

  let { data, form } = $props();

  let loading = $state(false);

  const submit: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      loading = false;
      update({ reset: false, invalidateAll: false });
    };
  };
</script>

<div class="flex w-full justify-center py-16">
  <div class="flex aspect-video w-md flex-col items-center gap-2 border p-8">
    <h1 class="flex items-center gap-1 py-2 font-nova text-3xl">
      <span class="size-8"><Cog /></span>
      Settings
    </h1>
    <form method="POST" action="?/update" use:enhance={submit} class="flex w-full flex-col gap-2">
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

      <div class="flex gap-1 py-2">
        <button type="submit" disabled={loading} class="border px-2 py-1"
          >{loading ? "loading" : "update"}</button>
        <a href="/signout" data-sveltekit-reload class="border px-2 py-1">/signout</a>
      </div>
    </form>
  </div>
</div>

<style>
  @reference "tailwindcss";

  input,
  textarea {
    @apply w-full p-1;
  }
</style>
