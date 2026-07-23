<script lang="ts">
  import "$lib/styles/markdown.css";
  import { parse_markdown, type MarkdownNode } from "$lib/markdown";

  interface Props {
    text: string;
  }

  let { text }: Props = $props();
  let rendered_markdown = $derived(parse_markdown(text));
</script>

{#snippet render_nodes(nodes: MarkdownNode[])}
  {#each nodes as node (node)}
    {#if node.kind === "text"}
      {node.content}
    {:else if node.kind === "void"}
      <svelte:element this={node.tag} {...node.attributes} />
    {:else}
      <svelte:element this={node.tag} {...node.attributes}>
        {@render render_nodes(node.children)}
      </svelte:element>
    {/if}
  {/each}
{/snippet}

<div class="markdown">
  {@render render_nodes(rendered_markdown)}
</div>
