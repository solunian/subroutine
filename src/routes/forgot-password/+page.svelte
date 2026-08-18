<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
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
  <title>forgot password</title>
</svelte:head>

<div class="flex w-full justify-center py-16">
  <div class="flex w-md flex-col items-center gap-2 border border-neutral-500/50 p-8">
    <h1 class="flex items-center gap-1 py-2 font-nova text-3xl">/forgot-password</h1>
    <form class="flex w-full flex-col gap-4" method="POST" use:enhance={submit}>
      {form?.message}

      <div>
        <label for="email">email address</label>
        <input id="email" name="email" type="email" required />
        {form?.errors?.email}
      </div>

      <button
        type="submit"
        disabled={loading || success}
        class="flex h-8 w-full items-center justify-center border-0! bg-black/10 px-4 py-1 text-center dark:bg-white/10">
        {#if success}
          <SuccessCheckmark />
          <span class="sr-only">reset email sent!</span>
        {:else if loading}
          <CircularSpinner />
          <span class="sr-only">sending reset email...</span>
        {:else}
          send reset email
        {/if}
      </button>

      <div class="flex justify-center">
        <a href="/signin" class="text-neutral-500/80">back to signin</a>
      </div>
    </form>
  </div>
</div>

<style>
  @reference "tailwindcss";

  input {
    @apply w-full border border-neutral-500/50 bg-transparent p-2 outline-none focus:border-current;
  }
</style>
