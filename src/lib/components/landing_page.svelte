<script lang="ts">
  const app_features = [
    {
      label: "create",
      text: "create subroutines for habits, action counters, streaks, check-ins, and time-based records.",
    },
    {
      label: "update & view",
      text: "update entries for each subroutine easily and view your data as a charts, grids, trends, etc.",
    },
    {
      label: "share",
      text: "keep things private by default, then use profiles and friends when you want accountability.",
    },
  ];

  const subroutine_types = [
    ["dot", "simple increment by one for marking done/not-done routines"],
    ["semaphore", "value tracker for something that can fluctuate up and down"],
    ["torch", "clocking hours (any duration) for practice, work, anything"],
    ["journal", "clean markdown editor for journaling or notes; any writing, any time"],
    ["...", "more in development"],
  ];

  const workflow = ["define a routine", "log entries", "review the trend", "adjust self"];
</script>

<section class="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-4 sm:px-6">
  <!-- <nav class="flex flex-wrap items-center justify-end gap-3 border-b border-neutral-500/50 pb-3">
    <a href="/signin">/signin</a>
    <a href="/signup">/signup</a>
  </nav> -->

  <div class="grid gap-6 border-b border-neutral-500/50 pt-4 pb-8">
    <div class="flex flex-col gap-5">
      <p class="text-xs sm:text-sm">goals & habits / time tracking / stats & trends</p>
      <h1 class="max-w-3xl font-nova text-4xl sm:text-5xl">a tracker for routines</h1>
      <p class="max-w-2xl text-sm sm:text-base">
        subroutine helps define the things you care about, record what happened, and review the
        signal over time. counts, durations, charts, trends, journals, profiles, friends. simple
        stuff.
      </p>
      <div class="flex flex-wrap gap-2 text-sm">
        <a href="/signin" class="border border-neutral-500/50 px-3 py-2">signin</a>
        <a href="/signup" class="border border-neutral-500/50 px-3 py-2"> signup </a>
      </div>
    </div>

    <!-- <div class="grid border text-sm">
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
        </div> -->
  </div>

  <div class="grid gap-3 md:grid-cols-3">
    {#each app_features as feature (feature.label)}
      <article class="border border-neutral-500/50 p-4">
        <h2 class="mb-3 font-nova text-2xl">{feature.label}</h2>
        <p class="text-sm">{feature.text}</p>
      </article>
    {/each}
  </div>

  <div class="grid gap-6 border-t border-neutral-500/50 py-6 lg:grid-cols-2">
    <section>
      <h2 class="mb-3 font-nova text-2xl">subroutine types</h2>
      <div class="grid border border-neutral-500/50 text-sm">
        {#each subroutine_types as [type, description] (type)}
          <div class="grid grid-cols-[7rem_1fr] border-b border-neutral-500/50 last:border-b-0">
            <div class="flex items-center justify-center border-r border-neutral-500/50 p-3">
              {type}
            </div>
            <div class="p-3">{description}</div>
          </div>
        {/each}
      </div>
    </section>

    <section>
      <h2 class="mb-3 font-nova text-2xl">workflow loop</h2>
      <ol class="grid border border-neutral-500/50 text-sm">
        {#each workflow as item, index (item)}
          <li class="grid grid-cols-[3rem_1fr] border-b border-neutral-500/50 last:border-b-0">
            <span class="flex items-center justify-center border-r border-neutral-500/50 p-3">
              {index}
            </span>
            <span class="p-3">{item}</span>
          </li>
        {/each}
      </ol>
    </section>
  </div>
</section>
