<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import PasswordInput from "$lib/components/password_input.svelte";
  import SuccessCheckmark from "$lib/components/success_checkmark.svelte";
  import type { PageProps, SubmitFunction } from "./$types";

  let { data, form }: PageProps = $props();

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

<div class="flex w-full justify-center py-16">
  <div class="flex w-md flex-col items-center gap-2 border border-neutral-500/50 p-8">
    <h1 class="flex items-center gap-1 py-2 font-nova text-3xl">/signin</h1>
    <form class="flex flex-col gap-4" method="POST" use:enhance={submit}>
      {data.message}
      {form?.message}

      <div>
        <label for="email">email address</label>
        <input name="email" type="email" required />
        {form?.errors?.email}
      </div>

      <div>
        <div class="flex justify-between">
          <label for="password">password</label><a
            href="/forgot-password"
            class="text-neutral-500/80">forgot password?</a>
        </div>
        <PasswordInput name="password" required />
        {form?.errors?.password}
      </div>

      <button
        type="submit"
        disabled={loading}
        class="flex h-8 w-full items-center justify-center border-0! bg-black/10 px-4 py-1 text-center dark:bg-white/10">
        {#if success}
          <SuccessCheckmark />
          <span class="sr-only">signed in!</span>
        {:else if loading}
          <CircularSpinner />
          <span class="sr-only">signing in...</span>
        {:else}
          signin
        {/if}
      </button>

      <div class="flex justify-center">
        <a href="/signup" class="text-neutral-500/80">need an account? signup</a>
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
