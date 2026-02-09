<script lang="ts">
  import { enhance } from "$app/forms";
  import { invalidate } from "$app/navigation";
  import PasswordInput from "$lib/components/password_input.svelte";
  import type { PageProps, SubmitFunction } from "./$types";

  let { form }: PageProps = $props();

  let success = $state(false);
  let loading = $state(false);

  const submit: SubmitFunction = () => {
    loading = true;

    return async ({ update, result }) => {
      loading = false;
      success = result.type === "success";
      invalidate("supabase:auth");
      update({ reset: false });
    };
  };
</script>

<svelte:head>
  <title>signin</title>
</svelte:head>

<form class="flex flex-col gap-2" method="POST" use:enhance={submit}>
  {#if form?.message}
    {form.message}
  {/if}
  <div>
    <label for="email">email address</label>
    <input name="email" type="email" required />
  </div>
  {#if form?.errors?.email}
    <span>{form?.errors?.email}</span>
  {/if}
  <div>
    <label for="password">password</label>
    <PasswordInput name="password" required />
  </div>

  <button type="submit" disabled={loading}>
    {#if success}
      success
    {:else if loading}
      loading
    {:else}
      signin
    {/if}
  </button>
</form>
