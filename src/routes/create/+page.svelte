<script lang="ts">
  import { enhance } from "$app/forms";
  import type { PageProps, SubmitFunction } from "./$types";

  let { form }: PageProps = $props();

  let success = $state(false);
  let loading = $state(false);

  const submit: SubmitFunction = () => {
    loading = true;

    return async ({ update, result }) => {
      loading = false;
      success = result.type === "redirect";
      update({ reset: false, invalidateAll: false });
    };
  };
</script>

<form class="flex flex-col gap-2" method="POST" use:enhance={submit}>
  {form?.message}

  <div>
    <label for="type">type</label>

    <select name="type" required>
      <option value="dot">dot</option>
      <option value="semaphore">semaphore</option>
    </select>
    {form?.errors?.type}
  </div>

  <div>
    <label for="title">title</label>
    <input name="title" type="text" required />
    {form?.errors?.title}
  </div>

  <div>
    <label for="description">description</label>
    <textarea name="description"></textarea>
    {form?.errors?.description}
  </div>

  <div>
    <label for="deadline">deadline</label>
    <input name="deadline" type="datetime-local" />
    {form?.errors?.deadline}
  </div>

  <button type="submit" disabled={loading}>
    {#if success}
      success
    {:else if loading}
      loading
    {:else}
      create
    {/if}
  </button>
</form>
