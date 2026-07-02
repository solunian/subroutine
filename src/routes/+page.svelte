<script lang="ts">
  import DotSemaphore from "$lib/components/dot_semaphore.svelte";
  import Torch from "$lib/components/torch.svelte";
  import TypeIdenticon from "$lib/components/type_identicon.svelte";
  import UsernameGoto from "$lib/components/username_goto.svelte";
  import type { PageProps } from "./$types";
  import type { Database } from "$lib/types/database.types";

  let { data }: PageProps = $props();

  const subtype_display_order: Database["public"]["Enums"]["subroutine_type"][] = [
    "torch",
    "dot",
    "semaphore",
  ];
  const app_features = [
    {
      label: "track",
      text: "Create small subroutines for habits, counters, streaks, check-ins, and time-based records.",
    },
    {
      label: "read",
      text: "See entries as charts, grids, trends, and recent activity without turning the page into a spreadsheet.",
    },
    {
      label: "share",
      text: "Keep things personal by default, then use profiles and friends when you want lightweight accountability.",
    },
  ];
  const subroutine_types = [
    ["dot", "binary check-ins for done/not-done routines"],
    ["semaphore", "status-style entries for things that move between states"],
    ["torch", "ongoing streaks and activity that should stay lit"],
  ];
  const workflow = ["define a routine", "log entries", "review the trend", "adjust the system"];
  let grouped_subroutines = $derived(Map.groupBy(data.subroutines ?? [], (r) => r.type));
</script>

<svelte:head>
  <title>subroutine</title>
</svelte:head>

<main class="flex flex-col gap-2">
  {#if data.session}
    <nav class="flex flex-wrap items-center justify-center gap-2 p-2 sm:justify-start">
      <UsernameGoto />
      {#if data.username}<a href="/@{data.username}">[profile]</a>{/if}
      <a href="/create">/create</a>
      <a href="/settings">/settings</a>
      <a href="/signout" data-sveltekit-reload>/signout</a>
    </nav>

    {#each subtype_display_order as subtype (subtype)}
      <h2 class="flex items-center gap-1 p-2 text-xl">
        <TypeIdenticon type={subtype} /><span>{subtype}</span>
      </h2>
      <div class="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {#each grouped_subroutines.get(subtype) as sub (sub.id)}
          {#if sub.type === "dot" || sub.type === "semaphore"}
            <DotSemaphore
              subroutine={sub}
              entries={data.entries_map?.get(sub.id)}
              href="/@{data.username}/{sub.id}"
              editable />
          {:else if sub.type === "torch"}
            <Torch
              subroutine={sub}
              entries={data.entries_map?.get(sub.id)}
              href="/@{data.username}/{sub.id}"
              editable />
          {:else}
            {`<${sub.type}>`} not implemented yet
          {/if}
        {/each}
      </div>
    {/each}
  {:else}
    <section class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-4 font-mono sm:px-6">
      <nav class="flex flex-wrap items-center justify-between gap-3 border-b pb-3 text-sm">
        <a href="/" class="font-semibold tracking-normal">subroutine</a>
        <div class="flex flex-wrap gap-3">
          <a href="/signin">/signin</a>
          <a href="/signup">/signup</a>
          <a href="/magiclink">/magiclink</a>
        </div>
      </nav>

      <div class="grid gap-6 border-b pb-8 lg:grid-cols-[1.2fr_0.8fr]">
        <div class="flex flex-col gap-5">
          <p class="text-xs uppercase">personal systems / activity logs / small feedback loops</p>
          <h1 class="max-w-3xl text-3xl leading-tight font-semibold sm:text-5xl">
            a minimal life tracker for routines that do not need a whole productivity suite
          </h1>
          <p class="max-w-2xl text-sm leading-6 sm:text-base">
            subroutine helps you define the things you care about, record what happened, and
            review the signal over time. counts, statuses, streaks, notes, charts, profiles,
            friends. simple stuff.
          </p>
          <div class="flex flex-wrap gap-2 text-sm">
            <a href="/signup" class="border px-3 py-2 font-semibold">create account</a>
            <a href="/magiclink" class="border px-3 py-2">email link</a>
            <a href="/signin" class="border px-3 py-2">sign in</a>
          </div>
        </div>

        <div class="grid border text-sm">
          <div class="border-b p-3">system preview</div>
          <div class="grid grid-cols-[7rem_1fr] border-b">
            <div class="border-r p-3">today</div>
            <div class="p-3">log the tiny thing before it becomes vague</div>
          </div>
          <div class="grid grid-cols-[7rem_1fr] border-b">
            <div class="border-r p-3">week</div>
            <div class="p-3">spot drift, gaps, streaks, and momentum</div>
          </div>
          <div class="grid grid-cols-[7rem_1fr]">
            <div class="border-r p-3">profile</div>
            <div class="p-3">share the routines that should be visible</div>
          </div>
        </div>
      </div>

      <div class="grid gap-3 md:grid-cols-3">
        {#each app_features as feature (feature.label)}
          <article class="border p-4">
            <h2 class="mb-3 text-lg font-semibold">/{feature.label}</h2>
            <p class="text-sm leading-6">{feature.text}</p>
          </article>
        {/each}
      </div>

      <div class="grid gap-6 border-y py-6 lg:grid-cols-2">
        <section>
          <h2 class="mb-3 text-lg font-semibold">subroutine types</h2>
          <div class="grid border text-sm">
            {#each subroutine_types as [type, description] (type)}
              <div class="grid grid-cols-[7rem_1fr] border-b last:border-b-0">
                <div class="border-r p-3">/{type}</div>
                <div class="p-3">{description}</div>
              </div>
            {/each}
          </div>
        </section>

        <section>
          <h2 class="mb-3 text-lg font-semibold">loop</h2>
          <ol class="grid border text-sm">
            {#each workflow as item, index (item)}
              <li class="grid grid-cols-[3rem_1fr] border-b last:border-b-0">
                <span class="border-r p-3">{index + 1}</span>
                <span class="p-3">{item}</span>
              </li>
            {/each}
          </ol>
        </section>
      </div>
    </section>
  {/if}
</main>
