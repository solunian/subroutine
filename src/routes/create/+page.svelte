<script lang="ts">
  import { enhance } from "$app/forms";
  import CircularSpinner from "$lib/components/circular_spinner.svelte";
  import SuccessCheckmark from "$lib/components/success_checkmark.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import { Constants } from "$lib/types/database.types";
  import type { Database } from "$lib/types/database.types";
  import type { PageProps, SubmitFunction } from "./$types";

  let { form }: PageProps = $props();

  let success = $state(false);
  let loading = $state(false);
  let selected_type = $state<Database["public"]["Enums"]["subroutine_type"] | "">("");

  const submit: SubmitFunction = () => {
    loading = true;

    return async ({ update, result }) => {
      loading = false;
      success = result.type === "redirect";
      update({ reset: false, invalidateAll: false });
    };
  };
</script>

<main class="mx-auto w-full max-w-3xl py-8 sm:py-14">
  <section class="border border-current">
    <header class="flex items-start justify-between gap-6 border-b border-current p-5 sm:p-7">
      <div>
        <h1 class="font-nova text-3xl sm:text-4xl">/create</h1>
        <p class="mt-2 max-w-lg text-neutral-500">
          create a subroutine to track anything. you can start adding entries as soon as it is
          created.
        </p>
      </div>
    </header>

    {#if form?.message}
      <p
        class="border-b border-current bg-red-500/10 px-5 py-3 text-sm text-red-700 dark:text-red-300">
        {form.message}
      </p>
    {/if}

    <form method="POST" use:enhance={submit}>
      <div
        class="grid gap-3 border-b border-current px-5 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:px-7">
        <div>
          <label for="type">type</label>
          <p class="text-sm text-neutral-500">tracking mode</p>
        </div>
        <div class="flex gap-2">
          <select
            name="type"
            bind:value={selected_type}
            required
            class="w-full border border-neutral-400 bg-transparent p-2 outline-none focus:border-current dark:border-neutral-600">
            <option value="" class="">--- select type ---</option>
            {#each Constants.public.Enums.subroutine_type as sub_type (sub_type)}
              <option value={sub_type}>{sub_type}</option>
            {/each}
          </select>
          {#if form?.errors?.type}
            <p class="mt-2 font-mono text-xs text-red-600 dark:text-red-400">{form.errors.type}</p>
          {/if}
          <span class="inline-flex aspect-square h-full items-center justify-center border p-2">
            <TypeIdenticon type={selected_type} />
          </span>
        </div>
      </div>

      <div
        class="grid gap-3 border-b border-current px-5 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:px-7">
        <div>
          <label for="title">title</label>
          <p class="text-sm text-neutral-500">required</p>
        </div>
        <div>
          <input
            name="title"
            type="text"
            required
            class="w-full border border-neutral-400 bg-transparent p-2 outline-none placeholder:text-neutral-400 focus:border-current dark:border-neutral-600" />
          {#if form?.errors?.title}
            <p class="mt-2 font-mono text-xs text-red-600 dark:text-red-400">
              {form.errors.title}
            </p>
          {/if}
        </div>
      </div>

      <div
        class="grid gap-3 border-b border-current px-5 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:px-7">
        <div>
          <label for="description">description</label>
          <p class="text-sm text-neutral-500">optional</p>
        </div>
        <div>
          <textarea
            name="description"
            rows="4"
            class="w-full resize-y border border-neutral-400 bg-transparent p-2 outline-none placeholder:text-neutral-400 focus:border-current dark:border-neutral-600"
          ></textarea>
          {#if form?.errors?.description}
            <p class="mt-2 font-mono text-xs text-red-600 dark:text-red-400">
              {form.errors.description}
            </p>
          {/if}
        </div>
      </div>

      <div class="grid gap-3 px-5 py-5 sm:grid-cols-[9rem_1fr] sm:gap-6 sm:px-7">
        <div>
          <label for="deadline">deadline</label>
          <p class="text-sm text-neutral-500">optional · local time</p>
        </div>
        <div>
          <input
            id="deadline"
            name="deadline"
            type="datetime-local"
            class="w-full border border-neutral-400 bg-transparent p-2 outline-none focus:border-current dark:border-neutral-600" />
          {#if form?.errors?.deadline}
            <p class="mt-2 font-mono text-xs text-red-600 dark:text-red-400">
              {form.errors.deadline}
            </p>
          {/if}
        </div>
      </div>

      <footer
        class="flex items-center justify-end gap-2 border-t border-current bg-neutral-500/5 p-4 sm:px-7">
        <button
          type="submit"
          disabled={loading}
          class="inline-flex min-h-9 min-w-42 items-center justify-center bg-black px-4 py-2 text-sm text-white disabled:cursor-wait disabled:opacity-50 dark:bg-white dark:text-black">
          {#if success}
            <SuccessCheckmark />
            <span class="sr-only">created</span>
          {:else if loading}
            <CircularSpinner />
            <span class="sr-only">creating...</span>
          {:else}
            create subroutine
          {/if}
        </button>
      </footer>
    </form>
  </section>
</main>
