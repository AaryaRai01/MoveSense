import { type ReactNode } from 'react';

// Lightweight, dependency-free Python syntax highlighter.
// Tokenizes a subset of Python for code-block display.

const KEYWORDS = new Set([
  'import', 'from', 'as', 'def', 'return', 'if', 'else', 'elif', 'for',
  'in', 'not', 'and', 'or', 'with', 'while', 'print', 'True', 'False',
  'None', 'class', 'lambda', 'try', 'except', 'finally', 'raise',
  'global', 'nonlocal', 'pass', 'break', 'continue',
]);

const BUILTINS = new Set([
  'range', 'len', 'list', 'dict', 'set', 'tuple', 'enumerate', 'zip',
  'int', 'float', 'str', 'bool', 'open', 'round', 'sum', 'min', 'max',
  'abs', 'map', 'filter', 'sorted',
]);

function tokenizeLine(line: string): ReactNode[] {
  const tokens: ReactNode[] = [];
  let i = 0;
  let buf = '';
  let key = 0;

  const flush = () => {
    if (!buf) return;
    if (KEYWORDS.has(buf)) {
      tokens.push(<span key={key++} className="code-token-kw">{buf}</span>);
    } else if (BUILTINS.has(buf)) {
      tokens.push(<span key={key++} className="code-token-fn">{buf}</span>);
    } else if (/^[A-Z_][A-Z0-9_]+$/.test(buf)) {
      tokens.push(<span key={key++} className="code-token-mod">{buf}</span>);
    } else {
      tokens.push(<span key={key++} className="code-token-var">{buf}</span>);
    }
    buf = '';
  };

  while (i < line.length) {
    const ch = line[i];

    // Comments
    if (ch === '#') {
      tokens.push(<span key={key++} className="code-token-com">{line.slice(i)}</span>);
      break;
    }

    // Strings (triple or single)
    if (ch === '"' || ch === "'") {
      const quote = ch;
      const triple = line.slice(i, i + 3) === quote.repeat(3);
      let end = i;
      if (triple) {
        end = line.indexOf(quote.repeat(3), i + 3);
        end = end === -1 ? line.length : end + 3;
      } else {
        end = line.indexOf(quote, i + 1);
        end = end === -1 ? line.length : end + 1;
      }
      tokens.push(<span key={key++} className="code-token-str">{line.slice(i, end)}</span>);
      i = end;
      continue;
    }

    // Numbers
    if (/[0-9]/.test(ch) && !buf) {
      let j = i;
      while (j < line.length && /[0-9.]/.test(line[j])) j++;
      tokens.push(<span key={key++} className="code-token-num">{line.slice(i, j)}</span>);
      i = j;
      continue;
    }

    // Identifiers
    if (/[A-Za-z_]/.test(ch)) {
      let j = i;
      while (j < line.length && /[A-Za-z0-9_]/.test(line[j])) j++;
      buf = line.slice(i, j);
      flush();
      i = j;
      continue;
    }

    // Operators / punctuation
    if (/[+\-*/=<>!%&|^~]/.test(ch)) {
      tokens.push(<span key={key++} className="code-token-op">{ch}</span>);
      i++;
      continue;
    }

    tokens.push(<span key={key++}>{ch}</span>);
    i++;
  }

  return tokens;
}

export function CodeBlock({ code }: { code: string }) {
  const lines = code.split('\n');
  return (
    <pre className="bg-ink/80 border border-border-soft rounded-md overflow-x-auto p-4 text-[13px] leading-relaxed font-mono">
      <code>
        {lines.map((line, idx) => (
          <div key={idx} className="flex">
            <span className="select-none text-sage-dim/40 w-8 shrink-0 text-right pr-3">{idx + 1}</span>
            <span className="flex-1 whitespace-pre">{tokenizeLine(line)}</span>
          </div>
        ))}
      </code>
    </pre>
  );
}
