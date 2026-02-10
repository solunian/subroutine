<script lang="ts">
  import { enhance } from "$app/forms";
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
      update({ reset: false, invalidateAll: true });
    };
  };
</script>

<svelte:head>
  <title>signin</title>
</svelte:head>

<form class="flex flex-col gap-2" method="POST" use:enhance={submit}>
  {form?.message}

  <div>
    <label for="email">email address</label>
    <input name="email" type="email" required />
    {form?.errors?.email}
  </div>

  <div>
    <label for="password">password</label>
    <PasswordInput name="password" required />
    {form?.errors?.password}
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
