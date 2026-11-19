import React from "react";
import { isSafeChatLink, parseChatMarkdown } from "../../utils/chatMarkdown";

const InlineContent = ({ tokens }) => tokens.map((token, index) => {
  if (token.type === "text") return <React.Fragment key={index}>{token.value}</React.Fragment>;
  if (token.type === "code") return <code key={index}>{token.value}</code>;
  if (token.type === "strong") return <strong key={index}><InlineContent tokens={token.children}/></strong>;
  if (token.type === "em") return <em key={index}><InlineContent tokens={token.children}/></em>;
  if (token.type === "del") return <del key={index}><InlineContent tokens={token.children}/></del>;
  if (token.type === "link") {
    if (!isSafeChatLink(token.href)) return <React.Fragment key={index}>{token.label}</React.Fragment>;
    const external = /^https?:/i.test(token.href);
    return <a key={index} href={token.href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}>{token.label}</a>;
  }
  return null;
});

export const ChatMarkdown = ({ content }) => (
  <div className="chat-markdown">
    {parseChatMarkdown(content).map((block, index) => {
      if (block.type === "p") return <p key={index}><InlineContent tokens={block.children}/></p>;
      if (block.type === "h2") return <h2 key={index}><InlineContent tokens={block.children}/></h2>;
      if (block.type === "h3") return <h3 key={index}><InlineContent tokens={block.children}/></h3>;
      if (block.type === "blockquote") return <blockquote key={index}><InlineContent tokens={block.children}/></blockquote>;
      if (block.type === "ul" || block.type === "ol") {
        const List = block.type;
        return <List key={index}>{block.items.map((item, itemIndex) => <li key={itemIndex}><InlineContent tokens={item}/></li>)}</List>;
      }
      if (block.type === "codeBlock") return <pre key={index}><code className={block.language ? `language-${block.language}` : undefined}>{block.value}</code></pre>;
      if (block.type === "table") return (
        <div className="chat-table-scroll" key={index} role="region" aria-label="Bảng trong câu trả lời" tabIndex="0">
          <table><thead><tr>{block.headers.map((cell, cellIndex) => <th key={cellIndex}><InlineContent tokens={cell}/></th>)}</tr></thead>
            <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{block.headers.map((_, cellIndex) => <td key={cellIndex}><InlineContent tokens={row[cellIndex] || []}/></td>)}</tr>)}</tbody>
          </table>
        </div>
      );
      return null;
    })}
  </div>
);
