<script module lang="ts">
  import { emojiToName, gemoji } from "gemoji";

  interface EmojiSuggestion {
    emoji: string;
    name: string;
    search_names: string[];
  }

  const emoji_catalog: EmojiSuggestion[] = gemoji.map((entry) => ({
    emoji: entry.emoji,
    name: emojiToName[entry.emoji] ?? entry.names[0],
    search_names: [...entry.names, ...entry.tags, entry.description].map((name) =>
      name.toLowerCase()
    ),
  }));

  function search_emojis(query: string): EmojiSuggestion[] {
    if (!query) return [];

    return emoji_catalog
      .map((suggestion) => {
        const name_starts_with_query = suggestion.name.startsWith(query);
        const alternate_name_starts_with_query = suggestion.search_names.some((name) =>
          name.startsWith(query)
        );
        const alternate_name_includes_query = suggestion.search_names.some((name) =>
          name.includes(query)
        );

        return {
          suggestion,
          score: name_starts_with_query
            ? 0
            : alternate_name_starts_with_query
              ? 1
              : alternate_name_includes_query
                ? 2
                : 3,
        };
      })
      .filter(({ score }) => score < 3)
      .sort((a, b) => a.score - b.score || a.suggestion.name.localeCompare(b.suggestion.name))
      .slice(0, 8)
      .map(({ suggestion }) => suggestion);
  }
</script>

<script lang="ts">
  import { parse_markdown, type MarkdownNode } from "$lib/markdown";
  import "$lib/styles/markdown.css";
  import { tick } from "svelte";
  import type { Attachment } from "svelte/attachments";

  interface Props {
    id?: string;
    name: string;
    value?: string;
    rows?: number;
    placeholder?: string;
  }

  const component_id = $props.id();
  const emoji_listbox_id = `${component_id}-emoji-listbox`;
  const character_segmenter = new Intl.Segmenter(undefined, { granularity: "grapheme" });

  let {
    id = component_id,
    name,
    value = $bindable(""),
    rows,
    placeholder = "write markdown...",
  }: Props = $props();

  let active_tab = $state<"write" | "preview">("write");
  let rendered_markdown = $derived(parse_markdown(value));
  let caret_position = $state(0);
  let textarea_element = $state<HTMLTextAreaElement>();
  let emoji_listbox_element = $state<HTMLDivElement>();
  let emoji_menu_dismissed = $state(false);
  let selected_emoji_index = $state(0);
  let character_count = $derived(Array.from(character_segmenter.segment(value)).length);
  let word_count = $derived(value.match(/\S+/gu)?.length ?? 0);
  let current_line = $derived(
    value.slice(0, Math.min(caret_position, value.length)).split("\n").length
  );
  let emoji_search = $derived.by(() => {
    const content_before_caret = value.slice(0, caret_position);
    const match = /(^|[\s([{])(:([a-z0-9_+-]+))$/iu.exec(content_before_caret);

    if (!match) return null;

    return {
      query: match[3].toLowerCase(),
      start: content_before_caret.length - match[2].length,
    };
  });
  let emoji_suggestions = $derived(
    emoji_search && !emoji_menu_dismissed ? search_emojis(emoji_search.query) : []
  );
  let emoji_menu_open = $derived(emoji_suggestions.length > 0);
  let active_emoji_index = $derived(
    Math.min(selected_emoji_index, Math.max(emoji_suggestions.length - 1, 0))
  );

  function update_editor_state(event: Event) {
    caret_position = (event.currentTarget as HTMLTextAreaElement).selectionStart;

    if (event.type === "input") {
      emoji_menu_dismissed = false;
      selected_emoji_index = 0;
    }
  }

  async function insert_emoji(suggestion: EmojiSuggestion) {
    if (!emoji_search || !textarea_element) return;

    const next_caret_position = emoji_search.start + suggestion.emoji.length;
    value = `${value.slice(0, emoji_search.start)}${suggestion.emoji}${value.slice(caret_position)}`;
    caret_position = next_caret_position;
    emoji_menu_dismissed = true;
    selected_emoji_index = 0;

    await tick();
    textarea_element.focus();
    textarea_element.setSelectionRange(next_caret_position, next_caret_position);
    textarea_element.dispatchEvent(new InputEvent("input", { bubbles: true }));
  }

  function scroll_active_emoji_into_view() {
    const listbox = emoji_listbox_element;
    const option = listbox?.querySelector<HTMLElement>(
      `#${CSS.escape(`${emoji_listbox_id}-option-${active_emoji_index}`)}`
    );

    if (!listbox || !option) return;

    const listbox_bounds = listbox.getBoundingClientRect();
    const option_bounds = option.getBoundingClientRect();

    if (option_bounds.top < listbox_bounds.top) {
      listbox.scrollTop -= listbox_bounds.top - option_bounds.top;
    } else if (option_bounds.bottom > listbox_bounds.bottom) {
      listbox.scrollTop += option_bounds.bottom - listbox_bounds.bottom;
    }
  }

  async function select_emoji(index: number) {
    selected_emoji_index = index;
    await tick();
    scroll_active_emoji_into_view();
  }

  function handle_editor_keydown(event: KeyboardEvent) {
    if (!emoji_menu_open) return;

    if (event.key === "ArrowDown") {
      event.preventDefault();
      void select_emoji((active_emoji_index + 1) % emoji_suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      void select_emoji(
        (active_emoji_index - 1 + emoji_suggestions.length) % emoji_suggestions.length
      );
    } else if (event.key === "Enter" || event.key === "Tab") {
      event.preventDefault();
      void insert_emoji(emoji_suggestions[active_emoji_index]);
    } else if (event.key === "Escape") {
      event.preventDefault();
      emoji_menu_dismissed = true;
    }
  }

  const auto_resize: Attachment<HTMLTextAreaElement> = (textarea) => {
    textarea_element = textarea;

    const mirror = document.createElement("div");
    const mirror_text = document.createTextNode("");
    const caret_marker = document.createElement("span");
    const mirrored_properties = [
      "border-bottom-width",
      "border-left-width",
      "border-right-width",
      "border-top-width",
      "box-sizing",
      "direction",
      "font-family",
      "font-size",
      "font-style",
      "font-variant",
      "font-weight",
      "letter-spacing",
      "line-height",
      "overflow-wrap",
      "padding-bottom",
      "padding-left",
      "padding-right",
      "padding-top",
      "tab-size",
      "text-align",
      "text-indent",
      "text-transform",
      "white-space",
      "word-break",
      "word-spacing",
    ];

    mirror.ariaHidden = "true";
    mirror.style.position = "fixed";
    mirror.style.top = "0";
    mirror.style.left = "0";
    mirror.style.height = "auto";
    mirror.style.visibility = "hidden";
    mirror.style.pointerEvents = "none";
    caret_marker.textContent = "\u200b";
    caret_marker.style.display = "inline-block";
    mirror.append(mirror_text, caret_marker);
    document.body.append(mirror);

    const sync_mirror = () => {
      const styles = getComputedStyle(textarea);

      for (const property of mirrored_properties) {
        mirror.style.setProperty(property, styles.getPropertyValue(property));
      }

      mirror.style.width = `${textarea.offsetWidth}px`;
    };

    const caret_bounds = () => {
      mirror_text.data = textarea.value.slice(0, textarea.selectionStart);

      const textarea_bounds = textarea.getBoundingClientRect();
      const mirror_bounds = mirror.getBoundingClientRect();
      const marker_bounds = caret_marker.getBoundingClientRect();
      const top = textarea_bounds.top + marker_bounds.top - mirror_bounds.top - textarea.scrollTop;

      return { top, bottom: top + marker_bounds.height };
    };

    const resize = (keep_caret_visible = false) => {
      const scroll_x = window.scrollX;
      const scroll_y = window.scrollY;
      const viewport = window.visualViewport;
      const viewport_offset = viewport?.offsetTop ?? 0;
      const viewport_height = viewport?.height ?? window.innerHeight;

      textarea.style.height = "auto";
      textarea.style.height = `${textarea.scrollHeight}px`;
      textarea.getBoundingClientRect();

      let next_scroll_y = scroll_y;

      if (keep_caret_visible && document.activeElement === textarea) {
        const caret = caret_bounds();
        const caret_top = caret.top + window.scrollY;
        const caret_bottom = caret.bottom + window.scrollY;
        const viewport_top = scroll_y + viewport_offset;
        const viewport_bottom = viewport_top + viewport_height;

        if (caret_top < viewport_top) {
          next_scroll_y -= viewport_top - caret_top;
        } else if (caret_bottom > viewport_bottom) {
          next_scroll_y += caret_bottom - viewport_bottom;
        }
      }

      window.scrollTo(scroll_x, next_scroll_y);
    };

    const resize_for_input = () => resize(true);

    sync_mirror();
    let previous_width = textarea.clientWidth;
    const resize_observer = new ResizeObserver(() => {
      if (textarea.clientWidth !== previous_width) {
        previous_width = textarea.clientWidth;
        sync_mirror();
        resize();
      }
    });

    resize();
    resize_observer.observe(textarea);
    textarea.addEventListener("input", resize_for_input);

    return () => {
      resize_observer.disconnect();
      textarea.removeEventListener("input", resize_for_input);
      mirror.remove();
      if (textarea_element === textarea) textarea_element = undefined;
    };
  };

  const track_emoji_listbox: Attachment<HTMLDivElement> = (listbox) => {
    emoji_listbox_element = listbox;

    return () => {
      if (emoji_listbox_element === listbox) emoji_listbox_element = undefined;
    };
  };
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

<div
  class="relative flex min-h-60 max-w-full min-w-0 flex-col border border-neutral-500/50 focus-within:border-current">
  <input type="hidden" {name} {value} />

  <div class="flex border-b border-neutral-500/50" aria-label="Markdown editor views">
    <button
      type="button"
      class={[
        "w-full border-0! border-r! border-neutral-500/50 px-3 py-2 text-sm",
        active_tab === "write" ? "bg-black/10 dark:bg-white/10" : "text-neutral-500",
      ]}
      aria-pressed={active_tab === "write"}
      onclick={() => (active_tab = "write")}>write</button>
    <button
      type="button"
      class={[
        "w-full border-0! border-neutral-500/50 px-3 py-2 text-sm",
        active_tab === "preview" ? "bg-black/10 dark:bg-white/10" : "text-neutral-500",
      ]}
      aria-pressed={active_tab === "preview"}
      onclick={() => (active_tab = "preview")}>preview</button>
  </div>

  {#if active_tab === "write"}
    <textarea
      {id}
      {rows}
      {placeholder}
      bind:value
      {@attach auto_resize}
      aria-activedescendant={emoji_menu_open
        ? `${emoji_listbox_id}-option-${active_emoji_index}`
        : undefined}
      aria-autocomplete="list"
      aria-controls={emoji_menu_open ? emoji_listbox_id : undefined}
      onfocus={update_editor_state}
      oninput={update_editor_state}
      onkeydown={handle_editor_keydown}
      onkeyup={update_editor_state}
      onpointerup={update_editor_state}
      onselect={update_editor_state}
      class="block w-full grow resize-none overflow-hidden border-0! bg-transparent p-3 font-mono outline-none"
    ></textarea>
    {#if emoji_menu_open}
      <div
        id={emoji_listbox_id}
        {@attach track_emoji_listbox}
        role="listbox"
        aria-label="Emoji suggestions"
        class="absolute top-full right-0 left-0 z-20 mt-1 max-h-56 overflow-y-auto border border-neutral-500/50 bg-white py-1 shadow-lg dark:bg-black">
        {#each emoji_suggestions as suggestion, index (suggestion.emoji)}
          <button
            id={`${emoji_listbox_id}-option-${index}`}
            type="button"
            role="option"
            aria-selected={index === active_emoji_index}
            tabindex="-1"
            class={[
              "flex w-full items-center gap-2 border-0! px-3 py-1.5 text-left text-sm",
              index === active_emoji_index && "bg-black/10 dark:bg-white/10",
            ]}
            onpointerdown={(event) => event.preventDefault()}
            onclick={() => insert_emoji(suggestion)}>
            <span class="text-lg" aria-hidden="true">{suggestion.emoji}</span>
            <span class="font-mono">:{suggestion.name}:</span>
          </button>
        {/each}
      </div>
    {/if}
    <div
      class="flex shrink justify-end gap-3 border-t border-neutral-500/50 px-3 py-1.5 font-mono text-xs text-neutral-500">
      <span class="mr-auto">line {current_line}</span>
      <span>{word_count} {word_count === 1 ? "word" : "words"}</span>
      <span>{character_count} {character_count === 1 ? "char" : "chars"}</span>
    </div>
  {:else}
    <div class="markdown min-h-32 w-full max-w-full min-w-0 overflow-hidden p-3">
      {#if value.trim()}
        {@render render_nodes(rendered_markdown)}
      {:else}
        <p class="text-neutral-500">nothing to preview</p>
      {/if}
    </div>
  {/if}
</div>
