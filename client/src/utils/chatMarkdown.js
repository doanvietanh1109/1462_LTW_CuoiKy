const splitTableRow = (line) => line.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((cell) => cell.trim());
const isTableDivider = (line) => {
  const cells = splitTableRow(line);
  return cells.length > 0 && cells.every((cell) => /^:?-{3,}:?$/.test(cell));
};

const parseInline = (source) => {
  const tokens = [];
  const tokenPattern = /(`[^`]*`|\[[^\]]+\]\([^\s)]+(?:\s+"[^"]*")?\)|\*\*[^*]+\*\*|__[^_]+__|~~[^~]+~~|\*(?!\s)[^*]+\*|_(?!\s)[^_]+_)/g;
  let lastIndex = 0;
  for (const match of source.matchAll(tokenPattern)) {
    const index = match.index;
    if (index > lastIndex) tokens.push({ type: "text", value: source.slice(lastIndex, index) });
    const raw = match[0];
    if (raw.startsWith("`")) tokens.push({ type: "code", value: raw.slice(1, -1) });
    else if (raw.startsWith("**") || raw.startsWith("__")) tokens.push({ type: "strong", children: parseInline(raw.slice(2, -2)) });
    else if (raw.startsWith("~~")) tokens.push({ type: "del", children: parseInline(raw.slice(2, -2)) });
    else if (raw.startsWith("[")) {
      const linkMatch = raw.match(/^\[([^\]]+)\]\(([^\s)]+)(?:\s+"[^"]*")?\)$/);
      tokens.push(linkMatch ? { type: "link", label: linkMatch[1], href: linkMatch[2] } : { type: "text", value: raw });
    } else tokens.push({ type: "em", children: parseInline(raw.slice(1, -1)) });
    lastIndex = index + raw.length;
  }
  if (lastIndex < source.length) tokens.push({ type: "text", value: source.slice(lastIndex) });
  return tokens;
};

const isFence = (line) => /^\s{0,3}```/.test(line);
const isHeading = (line) => /^\s{0,3}#{1,3}\s+/.test(line);
const isUnordered = (line) => /^\s{0,3}[-*+]\s+/.test(line);
const isOrdered = (line) => /^\s{0,3}\d+[.)]\s+/.test(line);
const isBlockStart = (line, next = "") => !line.trim() || isFence(line) || isHeading(line) || isUnordered(line) || isOrdered(line) || /^\s{0,3}>\s?/.test(line) || (line.includes("|") && next.includes("|") && isTableDivider(next));

export const parseChatMarkdown = (markdown = "") => {
  const lines = String(markdown).replace(/\r\n?/g, "\n").split("\n");
  const blocks = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    if (!line.trim()) { index += 1; continue; }

    if (isFence(line)) {
      const language = line.trim().slice(3).trim().split(/\s/)[0] || "";
      const codeLines = [];
      index += 1;
      while (index < lines.length && !isFence(lines[index])) codeLines.push(lines[index++]);
      if (index < lines.length) index += 1;
      blocks.push({ type: "codeBlock", language, value: codeLines.join("\n") });
      continue;
    }

    const heading = line.match(/^\s{0,3}(#{1,3})\s+(.+?)\s*#*\s*$/);
    if (heading) {
      blocks.push({ type: heading[1].length === 1 ? "h2" : heading[1].length === 2 ? "h2" : "h3", children: parseInline(heading[2]) });
      index += 1;
      continue;
    }

    if (line.includes("|") && index + 1 < lines.length && lines[index + 1].includes("|") && isTableDivider(lines[index + 1])) {
      const headers = splitTableRow(line).map(parseInline);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].includes("|") && lines[index].trim()) {
        rows.push(splitTableRow(lines[index]).map(parseInline));
        index += 1;
      }
      blocks.push({ type: "table", headers, rows });
      continue;
    }

    if (isUnordered(line) || isOrdered(line)) {
      const ordered = isOrdered(line);
      const items = [];
      const marker = ordered ? /^\s{0,3}\d+[.)]\s+/ : /^\s{0,3}[-*+]\s+/;
      while (index < lines.length && (ordered ? isOrdered(lines[index]) : isUnordered(lines[index]))) {
        items.push(parseInline(lines[index].replace(marker, "")));
        index += 1;
      }
      blocks.push({ type: ordered ? "ol" : "ul", items });
      continue;
    }

    if (/^\s{0,3}>\s?/.test(line)) {
      const quote = [];
      while (index < lines.length && /^\s{0,3}>\s?/.test(lines[index])) quote.push(lines[index++].replace(/^\s{0,3}>\s?/, ""));
      blocks.push({ type: "blockquote", children: parseInline(quote.join(" ")) });
      continue;
    }

    const paragraph = [line.trim()];
    index += 1;
    while (index < lines.length && !isBlockStart(lines[index], lines[index + 1] || "")) paragraph.push(lines[index++].trim());
    blocks.push({ type: "p", children: parseInline(paragraph.join("\n")) });
  }
  return blocks;
};

export const isSafeChatLink = (href = "") => {
  const value = String(href).trim();
  if (/^(https?:|mailto:)/i.test(value)) return true;
  return value.startsWith("/") && !value.startsWith("//") || value.startsWith("#");
};
