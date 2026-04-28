<script lang="ts">
  import { time } from "$lib/state/time.svelte";
</script>

<div class="flex from-white/50 to-black/50 text-right font-mono text-base">
  <span class="border bg-transparent px-2 py-1">
    {time.now.getFullYear()}-{(time.now.getMonth() + 1).toString().padStart(2, "0")}-{time.now
      .getDate()
      .toString()
      .padStart(2, "0")}
  </span>
  <span class="border border-l-0 bg-transparent px-2 py-1">
    {time.now.getHours().toString().padStart(2, "0")}:{time.now
      .getMinutes()
      .toString()
      .padStart(2, "0")}:{time.now.getSeconds().toString().padStart(2, "0")}
  </span>
</div>
