<script lang="ts">
  import { page } from "$app/state";
</script>

<div class="flex w-full justify-center py-16">
  <div
    class="flex aspect-video max-w-lg flex-col items-center gap-2 border p-16 text-center font-mono">
    <div>{page.status} error</div>
    <div>{'<"'}{page.error?.message}{'">'}</div>
    <div>._.</div>
  </div>
</div>
