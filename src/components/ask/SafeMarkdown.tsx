import React from 'react';

interface SafeMarkdownProps {
  content: string;
  className?: string;
}

// Inline token types
type InlineToken =
  | { type: 'bold'; text: string }
  | { type: 'italic'; text: string }
  | { type: 'code'; text: string }
  | { type: 'link'; text: string; url: string }
  | { type: 'text'; text: string };

function parseInline(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  let remaining = text;

  // Regex to match inline markdown constructs
  // 1: `code`
  // 2: **bold**
  // 3: *italic*
  // 4: [text](url)
  // 5: raw http(s) url
  const inlineRegex = /(`([^`]+)`)|(\*\*([^*]+)\*\*)|(\*([^*]+)\*)|(\[([^\]]+)\]\((https?:\/\/[^\s)]+)\))|(https?:\/\/[^\s<)]+)/;

  while (remaining) {
    const match = remaining.match(inlineRegex);
    if (!match || match.index === undefined) {
      tokens.push({ type: 'text', text: remaining });
      break;
    }

    if (match.index > 0) {
      tokens.push({ type: 'text', text: remaining.slice(0, match.index) });
    }

    const fullMatch = match[0];
    if (match[2]) {
      // `code`
      tokens.push({ type: 'code', text: match[2] });
    } else if (match[4]) {
      // **bold**
      tokens.push({ type: 'bold', text: match[4] });
    } else if (match[6]) {
      // *italic*
      tokens.push({ type: 'italic', text: match[6] });
    } else if (match[8] && match[9]) {
      // [text](url)
      const url = match[9];
      if (url.startsWith('http://') || url.startsWith('https://')) {
        tokens.push({ type: 'link', text: match[8], url });
      } else {
        tokens.push({ type: 'text', text: fullMatch });
      }
    } else if (match[10]) {
      // raw url
      const url = match[10];
      tokens.push({ type: 'link', text: url, url });
    } else {
      tokens.push({ type: 'text', text: fullMatch });
    }

    remaining = remaining.slice(match.index + fullMatch.length);
  }

  return tokens;
}

function renderInlineTokens(tokens: InlineToken[], keyPrefix: string): React.ReactNode {
  return tokens.map((token, i) => {
    const key = `${keyPrefix}-${i}`;
    switch (token.type) {
      case 'bold':
        return (
          <strong key={key} className="font-semibold text-white">
            {token.text}
          </strong>
        );
      case 'italic':
        return (
          <em key={key} className="italic text-slate-200">
            {token.text}
          </em>
        );
      case 'code':
        return (
          <code
            key={key}
            className="font-mono text-xs px-1.5 py-0.5 rounded bg-white/10 text-cyan-300 border border-white/10"
          >
            {token.text}
          </code>
        );
      case 'link':
        return (
          <a
            key={key}
            href={token.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-cyan-400 hover:text-cyan-300 underline underline-offset-2 transition-colors cursor-pointer"
          >
            {token.text}
          </a>
        );
      case 'text':
      default:
        return <React.Fragment key={key}>{token.text}</React.Fragment>;
    }
  });
}

export const SafeMarkdown: React.FC<SafeMarkdownProps> = ({ content, className = '' }) => {
  if (!content) return null;

  // Split into block sections separated by 2 or more newlines
  const rawBlocks = content.split(/\n\s*\n/);

  return (
    <div className={`space-y-3 ${className}`}>
      {rawBlocks.map((block, blockIndex) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const lines = trimmed.split('\n').map((l) => l.trimEnd());

        // Check if all or first lines are bullet items (- or *)
        const isBulletList = lines.every((line) => /^[-*]\s+/.test(line));
        if (isBulletList) {
          return (
            <ul key={`block-${blockIndex}`} className="space-y-1.5 my-1.5 pl-1">
              {lines.map((line, liIndex) => {
                const text = line.replace(/^[-*]\s+/, '');
                const inlineTokens = parseInline(text);
                return (
                  <li key={`li-${blockIndex}-${liIndex}`} className="flex items-start gap-2.5 text-sm leading-relaxed">
                    <span className="text-cyan-400 mt-1 select-none text-xs shrink-0">•</span>
                    <span className="flex-1">{renderInlineTokens(inlineTokens, `b-${blockIndex}-${liIndex}`)}</span>
                  </li>
                );
              })}
            </ul>
          );
        }

        // Check if all lines are numbered items (1. 2. etc.)
        const isNumberedList = lines.every((line) => /^\d+\.\s+/.test(line));
        if (isNumberedList) {
          return (
            <ol key={`block-${blockIndex}`} className="space-y-1.5 my-1.5 pl-1">
              {lines.map((line, liIndex) => {
                const match = line.match(/^(\d+)\.\s+(.*)$/);
                const num = match ? match[1] : `${liIndex + 1}`;
                const text = match ? match[2] : line;
                const inlineTokens = parseInline(text);
                return (
                  <li key={`ol-${blockIndex}-${liIndex}`} className="flex items-start gap-2 text-sm leading-relaxed">
                    <span className="text-cyan-400 font-mono text-xs mt-0.5 select-none shrink-0">{num}.</span>
                    <span className="flex-1">{renderInlineTokens(inlineTokens, `o-${blockIndex}-${liIndex}`)}</span>
                  </li>
                );
              })}
            </ol>
          );
        }

        // Mixed block or single paragraph with line breaks
        return (
          <p key={`p-${blockIndex}`} className="text-sm leading-relaxed text-slate-100">
            {lines.map((line, lineIndex) => {
              const inlineTokens = parseInline(line);
              return (
                <React.Fragment key={`line-${blockIndex}-${lineIndex}`}>
                  {renderInlineTokens(inlineTokens, `p-${blockIndex}-${lineIndex}`)}
                  {lineIndex < lines.length - 1 && <br />}
                </React.Fragment>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};
