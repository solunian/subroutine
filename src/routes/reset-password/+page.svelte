<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import PasswordInput from "$lib/components/password_input.svelte";
  import type { PageProps, SubmitFunction } from "./$types";

  let { form }: PageProps = $props();

  let loading = $state(false);

  const submit: SubmitFunction = () => {
    loading = true;

    return async ({ update }) => {
      loading = false;
      update({ reset: false });
    };
  };
</script>

<div class="flex w-full justify-center py-16">
  <div class="flex w-md flex-col items-center gap-2 border border-neutral-500/50 p-8">
    <h1 class="flex items-center gap-1 py-2 font-nova text-3xl">/reset-password</h1>
    <form class="flex w-full flex-col gap-4" method="POST" use:enhance={submit}>
      {form?.message}

      <div>
        <label for="password">new password</label>
        <PasswordInput name="password" required />
        {form?.errors?.password}
      </div>

      <div>
        <label for="confirm_password">confirm new password</label>
        <PasswordInput name="confirm_password" required />
        {form?.errors?.confirm_password}
      </div>

      <button
        type="submit"
        disabled={loading}
        class="flex h-8 w-full items-center justify-center border-0! bg-black/10 px-4 py-1 text-center dark:bg-white/10">
        {#if loading}
          <CircularSpinner />
          <span class="sr-only">resetting password...</span>
        {:else}
          reset password
        {/if}
      </button>
    </form>
  </div>
</div>
