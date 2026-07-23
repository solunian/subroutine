<script lang="ts">
  import { onMount } from "svelte";
  import ComputerDesktop from "$lib/icons/computer_desktop.svelte";
  import Moon from "$lib/icons/moon.svelte";
  import Sun from "$lib/icons/sun.svelte";

  type Theme = "system" | "light" | "dark";

  const themes = [
    { value: "system", icon: ComputerDesktop },
    { value: "light", icon: Sun },
    { value: "dark", icon: Moon },
  ] as const;

  let theme = $state<Theme>("system");
  let prefers_dark: MediaQueryList;

  const set_theme = (next_theme: Theme, save = true) => {
    theme = next_theme;
    if (save) localStorage.setItem("subroutine-theme", theme);

    const is_dark = theme === "dark" || (theme === "system" && prefers_dark.matches);
    document.documentElement.classList.toggle("dark", is_dark);
    document.documentElement.style.colorScheme = is_dark ? "dark" : "light";
  };

  onMount(() => {
    prefers_dark = window.matchMedia("(prefers-color-scheme: dark)");

    const saved_theme = localStorage.getItem("subroutine-theme");
    if (saved_theme === "light" || saved_theme === "dark") {
      theme = saved_theme;
    }

    set_theme(theme, false);

    const follow_device_theme = () => theme === "system" && set_theme(theme, false);

    prefers_dark.addEventListener("change", follow_device_theme);

    return () => prefers_dark.removeEventListener("change", follow_device_theme);
  });
</script>

<div
  class="flex overflow-hidden border border-neutral-500/50"
  role="group"
  aria-label="color theme">
  {#each themes as option (option.value)}
    <button
      type="button"
      class={[
        "h-8 border-0! stroke-1 p-1.5 text-neutral-500 transition-colors",
        theme === option.value ? "bg-neutral-500/25" : "hover:bg-neutral-500/10",
      ]}
      aria-label="use {option.value} theme"
      aria-pressed={theme === option.value}
      onclick={() => set_theme(option.value)}><option.icon /></button>
  {/each}
</div>
