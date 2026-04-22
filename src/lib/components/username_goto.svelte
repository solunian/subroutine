<script lang="ts">
  import { goto } from "$app/navigation";

  let username_goto = $state("");
</script>

<form
  onsubmit={(e) => {
    e.preventDefault();
    goto(`/@${username_goto}`);
  }}>
  <input type="text" placeholder="username" bind:value={username_goto} required />
  <button type="submit" class="px-1">goto</button>
</form>
