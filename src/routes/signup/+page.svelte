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
      update({ reset: false });
    };
  };
</script>

<svelte:head>
  <title>signup</title>
</svelte:head>

<div class="flex w-full justify-center py-16">
  <div class="flex aspect-video w-md flex-col items-center gap-2 border p-8">
    <h1 class="flex items-center gap-1 py-2 font-nova text-3xl">signup</h1>
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
          signup
        {/if}
      </button>
    </form>
  </div>
</div>

<style>
  @reference "tailwindcss";

  input,
  button {
    @apply w-full py-1;
  }
</style>
