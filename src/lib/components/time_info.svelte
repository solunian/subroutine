<script lang="ts">
  import { time } from "$lib/state/time.svelte";
  import NumberFlow from "@number-flow/svelte";
</script>

<div class="flex from-white/50 to-black/50 text-right font-mono text-base">
  <span class="border bg-transparent px-2 py-1">
    <NumberFlow
      trend={+1}
      format={{ minimumIntegerDigits: 2, useGrouping: false }}
      value={time.now.getFullYear()} />-<NumberFlow
      trend={+1}
      format={{ minimumIntegerDigits: 2, useGrouping: false }}
      value={time.now.getMonth() + 1} />-<NumberFlow
      trend={+1}
      format={{ minimumIntegerDigits: 2, useGrouping: false }}
      value={time.now.getDate()} />
  </span>
  <span class="border border-l-0 bg-transparent px-2 py-1">
    <NumberFlow
      trend={+1}
      digits={{ 1: { max: 2 } }}
      format={{ minimumIntegerDigits: 2 }}
      value={time.now.getHours()} />:<NumberFlow
      trend={+1}
      digits={{ 1: { max: 5 } }}
      format={{ minimumIntegerDigits: 2 }}
      value={time.now.getMinutes()} />:<NumberFlow
      trend={+1}
      digits={{ 1: { max: 5 } }}
      format={{ minimumIntegerDigits: 2 }}
      value={time.now.getSeconds()} />
  </span>
</div>
