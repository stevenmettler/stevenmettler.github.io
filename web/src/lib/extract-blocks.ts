import { parseHTML } from "linkedom";

export type ArticleBlock =
  | { type: "heading"; text: string }
  | { type: "paragraph"; text: string }
  | { type: "quote"; text: string }
  | { type: "listitem"; text: string }
  | { type: "code"; text: string };

const HEADING_TAGS = new Set(["H1", "H2", "H3", "H4", "H5", "H6"]);
const BLOCK_TAGS = new Set([...HEADING_TAGS, "P", "BLOCKQUOTE", "LI", "PRE"]);

function toBlock(tagName: string, text: string): ArticleBlock | null {
  if (!text) return null;
  if (HEADING_TAGS.has(tagName)) return { type: "heading", text };

  switch (tagName) {
    case "P":
      return { type: "paragraph", text };
    case "BLOCKQUOTE":
      return { type: "quote", text };
    case "LI":
      return { type: "listitem", text };
    case "PRE":
      return { type: "code", text };
    default:
      return null;
  }
}

// Walks Readability's cleaned article HTML and pulls out block-level
// elements as plain text, tagged by type, so the page can render proper
// paragraph/heading/quote/list structure without ever passing raw HTML
// to the client (no dangerouslySetInnerHTML anywhere in this feature).
export function extractBlocks(contentHtml: string): ArticleBlock[] {
  const { document } = parseHTML(contentHtml);
  const blocks: ArticleBlock[] = [];

  function walk(node: typeof document.documentElement) {
    for (const child of Array.from(node.children)) {
      const tag = child.tagName;

      if (tag === "HEAD") continue; // defensive: never surface head content

      if (BLOCK_TAGS.has(tag)) {
        const text = (child.textContent ?? "").replace(/\s+/g, " ").trim();
        const block = toBlock(tag, text);
        if (block) blocks.push(block);
        continue; // don't descend into a block already captured as one unit
      }

      walk(child as typeof document.documentElement);
    }
  }

  // Walk from documentElement rather than document.body: some source
  // pages contain markup invalid outside its original context (e.g. a
  // stray <tr>/<td> left over after Readability strips the surrounding
  // <table>), and linkedom's lenient HTML parser can end up placing that
  // content as a sibling of <body> instead of inside it.
  walk(document.documentElement);
  return blocks;
}
