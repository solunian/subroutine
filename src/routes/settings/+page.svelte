<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidate } from "$app/navigation";
  import Avatar from "$lib/components/avatar.svelte";
  import type { SubmitFunction } from "@sveltejs/kit";

  let { data, form } = $props();
  let { session, supabase, profile } = $derived(data);

  let loading = $state(false);
  let profileForm: HTMLFormElement;
  let name: string = $derived(profile?.name ?? "");
  let username: string = $derived(profile?.username ?? "");
  let website: string = $derived(profile?.website ?? "");
  let avatar_url: string = $derived(profile?.avatar_url ?? "");

  const submit: SubmitFunction = () => {
    loading = true;
    return async () => {
      loading = false;
    };
  };
</script>

<div>
  <form method="post" action="?/update" use:enhance={submit} bind:this={profileForm}>
    {form?.message}

    <div>
      <Avatar
        {supabase}
        bind:url={avatar_url}
        size={10}
        onupload={() => profileForm.requestSubmit()} />
      {form?.errors?.avatar_url}
    </div>

    <div>
      <label for="email">Email</label>
      <input name="email" type="text" value={session.user.email} disabled />
    </div>

    <div>
      <label for="name">Full Name</label>
      <input name="name" type="text" value={form?.name ?? name} />
      {form?.errors?.name}
    </div>

    <div>
      <label for="username">Username</label>
      <input name="username" type="text" value={form?.username ?? username} />
      {form?.errors?.username}
    </div>

    <div>
      <label for="website">Website</label>
      <input name="website" type="url" value={form?.website ?? website} />
      {form?.errors?.website}
    </div>

    <button type="submit" disabled={loading}>{loading ? "loading" : "update"}</button>
  </form>

  <a href="/signout" onclick={() => invalidate("supabase:auth")} data-sveltekit-preload-data="off"
    >/signout</a>
</div>
