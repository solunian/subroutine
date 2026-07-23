import type { RootContent } from "hast";
import { all, createLowlight } from "lowlight";
import MarkdownIt from "markdown-it";

type MarkdownToken = ReturnType<MarkdownIt["parse"]>[number];

export type MarkdownNode =
  | { kind: "text"; content: string }
  | { kind: "void"; tag: string; attributes: Record<string, boolean | string> }
  | {
      kind: "element";
      tag: string;
      attributes: Record<string, boolean | string>;
      children: MarkdownNode[];
    };

const markdown = new MarkdownIt({
  breaks: true,
  html: false,
  linkify: true,
});
const syntax_highlighter = createLowlight(all);

const allowed_tags = new Set([
  "a",
  "blockquote",
  "code",
  "del",
  "em",
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "li",
  "ol",
  "p",
  "pre",
  "s",
  "strong",
  "span",
  "table",
  "tbody",
  "td",
  "th",
  "thead",
  "tr",
  "ul",
]);

function attributes_for(token: MarkdownToken): Record<string, boolean | string> {
  if (token.type === "link_open") {
    return {
      href: token.attrGet("href") ?? "",
      ...(token.attrGet("title") ? { title: token.attrGet("title")! } : {}),
    };
  }

  if (token.type === "ordered_list_open" && token.attrGet("start")) {
    return { start: token.attrGet("start")! };
  }

  return {};
}

function highlighted_node(node: RootContent): MarkdownNode[] {
  if (node.type === "text") {
    return [{ kind: "text", content: node.value }];
  }

  if (node.type !== "element" || node.tagName !== "span") {
    return "children" in node ? node.children.flatMap(highlighted_node) : [];
  }

  const class_names = node.properties.className;
  return [
    {
      kind: "element",
      tag: "span",
      attributes: {
        ...(Array.isArray(class_names) ? { class: class_names.join(" ") } : {}),
      },
      children: node.children.flatMap(highlighted_node),
    },
  ];
}

function highlight_code(source: string, language: string): MarkdownNode[] {
  try {
    const tree = language
      ? syntax_highlighter.highlight(language, source)
      : syntax_highlighter.highlightAuto(source);
    return tree.children.flatMap(highlighted_node);
  } catch {
    return [{ kind: "text", content: source }];
  }
}

function parse_tokens(tokens: MarkdownToken[], destination: MarkdownNode[], task_item = false) {
  const stack = [destination];
  const tag_stack: string[] = [];

  for (const token of tokens) {
    const current = stack.at(-1)!;

    if (token.type === "inline") {
      parse_tokens(token.children ?? [], current, tag_stack.includes("li"));
    } else if (token.type === "text") {
      const task = task_item && current.length === 0 ? /^\[([ xX])\]\s+/.exec(token.content) : null;

      if (task) {
        current.push({
          kind: "void",
          tag: "input",
          attributes: {
            checked: task[1].toLowerCase() === "x",
            disabled: true,
            type: "checkbox",
          },
        });
        current.push({ kind: "text", content: token.content.slice(task[0].length) });
      } else {
        current.push({ kind: "text", content: token.content });
      }
    } else if (token.type === "code_inline") {
      current.push({
        kind: "element",
        tag: "code",
        attributes: {},
        children: [{ kind: "text", content: token.content }],
      });
    } else if (token.type === "softbreak" || token.type === "hardbreak") {
      current.push({ kind: "void", tag: "br", attributes: {} });
    } else if (token.type === "hr") {
      current.push({ kind: "void", tag: "hr", attributes: {} });
    } else if (token.type === "image") {
      current.push({
        kind: "void",
        tag: "img",
        attributes: {
          src: token.attrGet("src") ?? "",
          alt: token.content,
          ...(token.attrGet("title") ? { title: token.attrGet("title")! } : {}),
        },
      });
    } else if (token.type === "fence" || token.type === "code_block") {
      const language = token.info.trim().split(/\s+/)[0];
      current.push({
        kind: "element",
        tag: "pre",
        attributes: {},
        children: [
          {
            kind: "element",
            tag: "code",
            attributes: {
              class: ["hljs", language && `language-${language}`].filter(Boolean).join(" "),
            },
            children: highlight_code(token.content, language),
          },
        ],
      });
    } else if (token.nesting === 1 && allowed_tags.has(token.tag)) {
      const node: MarkdownNode = {
        kind: "element",
        tag: token.tag,
        attributes: attributes_for(token),
        children: [],
      };
      current.push(node);
      stack.push(node.children);
      tag_stack.push(token.tag);
    } else if (token.nesting === -1 && stack.length > 1) {
      stack.pop();
      tag_stack.pop();
    } else if (token.content) {
      current.push({ kind: "text", content: token.content });
    }
  }
}

export function parse_markdown(source: string): MarkdownNode[] {
  const nodes: MarkdownNode[] = [];
  parse_tokens(markdown.parse(source, {}), nodes);
  return nodes;
}
