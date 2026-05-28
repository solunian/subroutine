<script lang="ts">
  import { now } from "$lib/state/time.svelte";
  import NumberFlow, { NumberFlowGroup } from "@number-flow/svelte";
</script>

<div class="flex from-white/50 to-black/50 text-right font-mono text-base">
  <NumberFlowGroup>
    <span class="border bg-transparent px-2 py-1">
      <NumberFlow
        trend={+1}
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        value={now.getFullYear()} />-<NumberFlow
        trend={+1}
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        value={now.getMonth() + 1} />-<NumberFlow
        trend={+1}
        format={{ minimumIntegerDigits: 2, useGrouping: false }}
        value={now.getDate()} />
    </span>
    <span class="border border-l-0 bg-transparent px-2 py-1">
      <NumberFlow
        trend={+1}
        digits={{ 1: { max: 2 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={now.getHours()} />:<NumberFlow
        trend={+1}
        digits={{ 1: { max: 5 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={now.getMinutes()} />:<NumberFlow
        trend={+1}
        digits={{ 1: { max: 5 } }}
        format={{ minimumIntegerDigits: 2 }}
        value={now.getSeconds()} />
    </span>
  </NumberFlowGroup>
</div>
