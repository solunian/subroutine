<script lang="ts">
  import { local_datetime } from "$lib/entry_helpers";
  import { DateField } from "bits-ui";
  import { parseDateTime } from "@internationalized/date";

  let {
    value = $bindable(""),
    label,
    name,
    required = false,
    disabled = false,
  }: {
    value?: string;
    label: string;
    name: string;
    required?: boolean;
    disabled?: boolean;
  } = $props();
  const placeholder = parseDateTime(local_datetime(new Date().toISOString()));
  let date = $derived(value ? parseDateTime(value) : undefined);
</script>

<DateField.Root
  value={date}
  onValueChange={(next) => (value = next?.toString() ?? "")}
  {placeholder}
  {required}
  {disabled}
  granularity="second"
  hourCycle={24}>
  <DateField.Label class="mb-1.5 block text-sm text-neutral-500">{label}</DateField.Label>
  <DateField.Input
    {name}
    class="flex min-h-10 w-full flex-wrap items-center border border-neutral-500/50 bg-transparent px-2 py-1.5 font-mono text-sm focus-within:border-current data-disabled:opacity-50 data-invalid:border-red-500">
    {#snippet children({ segments })}
      {#each segments as segment, index (segment.part + index)}
        <DateField.Segment
          part={segment.part}
          class={segment.part === "literal"
            ? "whitespace-pre text-neutral-500"
            : "rounded-sm px-0.5 py-0.5 outline-none hover:bg-neutral-500/10 focus:bg-neutral-500/20 data-placeholder:text-neutral-500"}>
          {segment.value}
        </DateField.Segment>
      {/each}
    {/snippet}
  </DateField.Input>
</DateField.Root>
