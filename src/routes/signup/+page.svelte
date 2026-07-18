<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import PasswordInput from "$lib/components/password_input.svelte";
  import SuccessCheckmark from "$lib/components/success_checkmark.svelte";
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
  <div class="flex w-md flex-col items-center gap-2 border border-neutral-500/50 p-8">
    <h1 class="flex items-center gap-1 py-2 font-nova text-3xl">/signup</h1>
    <form class="flex flex-col gap-4" method="POST" use:enhance={submit}>
      {form?.message}
      <div>
        <label for="name">name</label>
        <input name="name" type="text" required />
        {form?.errors?.name}
      </div>

      <div>
        <label for="username">username</label>
        <input name="username" type="username" required />
        {form?.errors?.username}
      </div>

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

      <button
        type="submit"
        disabled={loading}
        class="flex h-8 w-full items-center justify-center border-0! bg-black/10 px-4 py-1 text-center dark:bg-white/10">
        {#if success}
          <SuccessCheckmark />
          <span class="sr-only">signed up!</span>
        {:else if loading}
          <CircularSpinner />
          <span class="sr-only">signing up...</span>
        {:else}
          signup
        {/if}
      </button>
    </form>
  </div>
</div>

<style>
  @reference "tailwindcss";

  input {
    @apply w-full border border-neutral-400 bg-transparent p-2 outline-none focus:border-current dark:border-neutral-600;
  }
</style>
