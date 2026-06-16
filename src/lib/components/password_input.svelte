<script lang="ts">
  import Eye from "$lib/icons/eye.svelte";
  import EyeSlash from "$lib/icons/eye_slash.svelte";

  let { name, required }: { name: string; required?: boolean } = $props();
  let password_hidden = $state(true);

  // *removed from props* restricted?: boolean
  // const restricted_pattern = String.raw`^(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$`;
  // *removed from input* pattern={restricted_pattern}
</script>

<div class="relative block">
  <input {name} type={password_hidden ? "password" : "text"} {required} class="w-full py-1 pr-10" />
  <button
    type="button"
    class="absolute top-1/2 right-3 -translate-y-1/2 border-none stroke-black"
    onclick={() => (password_hidden = !password_hidden)}>
    {#if password_hidden}
      <EyeSlash />
    {:else}
      <Eye />
    {/if}
  </button>
</div>
