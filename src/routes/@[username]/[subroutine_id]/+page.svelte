<script lang="ts">
  let { data } = $props();
</script>

{#if data.subroutine}
  {data.subroutine.title}
{/if}
