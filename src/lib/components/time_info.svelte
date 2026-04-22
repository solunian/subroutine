<script lang="ts">
  let time = $state(new Date());

  $effect(() => {
    const i = setInterval(() => {
      time = new Date();
    }, 200);

    return () => clearInterval(i);
  });
</script>

<div class="flex from-white/50 to-black/50 text-right font-mono text-base">
  <span class="border bg-transparent px-2 py-1">
    {time.getFullYear()}-{time.getMonth().toString().padStart(2, "0")}-{time
      .getDay()
      .toString()
      .padStart(2, "0")}
  </span>
  <span class="border border-l-0 bg-transparent px-2 py-1">
    {time.getHours().toString().padStart(2, "0")}:{time
      .getMinutes()
      .toString()
      .padStart(2, "0")}:{time.getSeconds().toString().padStart(2, "0")}
  </span>
</div>
