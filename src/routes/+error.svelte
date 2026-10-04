<script lang="ts">
  let { error } = $props();
</script>

<div class="flex w-full justify-center py-16">
  <div
    class="flex aspect-video w-md flex-col items-center gap-2 border border-neutral-500/50 p-16 text-center font-mono">
    <div>{error.status} error</div>
    <div>{`<"${error.message}">`}</div>
    <div>._.</div>
  </div>
</div>
