<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageProps, SubmitFunction } from "./$types";

  let { form }: PageProps = $props();

  let loading = $state(false);

  const handleSubmit: SubmitFunction = () => {
    loading = true;
    return async ({ update }) => {
      update();
      loading = false;
    };
  };
</script>

<svelte:head>
  <title>signup</title>
</svelte:head>

<form class="flex flex-col gap-2" method="POST" use:enhance={handleSubmit}>
  {#if form?.message !== undefined}
    <div class="success {form?.success ? '' : 'fail'}">
      {form?.message}
    </div>
  {/if}
  <div>
    <label for="email">email address</label>
    <input name="email" type="email" />
  </div>
  {#if form?.errors?.email}
    <span class="error flex items-center text-sm">
      {form?.errors?.email}
    </span>
  {/if}
  <div>
    <label for="password">password</label>
    <input name="password" type="password" />
  </div>
  {#if form?.errors?.password}
    <span class="error flex items-center text-sm">
      {form?.errors?.password}
    </span>
  {/if}
  <button class="button primary block" type="submit">
    {loading ? "loading" : "signup"}
  </button>
</form>
