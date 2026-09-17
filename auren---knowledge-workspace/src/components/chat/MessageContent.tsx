import React, { useState } from 'react';
import { FileText, Copy, Check, ExternalLink } from 'lucide-react';
import { SourceCitation } from '../../types';

interface MessageContentProps {
  content: string;
  sources?: SourceCitation[];
  onCitationClick?: (citation: SourceCitation | string) => void;
}

export const MessageContent: React.FC<MessageContentProps> = ({
  content,
  sources = [],
  onCitationClick,
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = (code: string, idx: number) => {
    navigator.clipboard.writeText(code);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Extract blocks (code vs markdown text)
  const renderFormattedText = (text: string) => {
    // Check if bracketed source like [Product Requirements.pdf] or [AUREN System Architecture]
    const parts = text.split(/(\[[^\]]+\])/g);

    return parts.map((part, pIdx) => {
      const isBracketed = part.startsWith('[') && part.endsWith(']');
      if (isBracketed) {
        const sourceName = part.slice(1, -1);
        const matchedCitation = sources.find(
          (s) =>
            s.title.toLowerCase().includes(sourceName.toLowerCase()) ||
            sourceName.toLowerCase().includes(s.title.toLowerCase())
        );

        return (
          <button
            key={pIdx}
            type="button"
            onClick={() => onCitationClick?.(matchedCitation || sourceName)}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 my-0.5 rounded-md text-xs font-medium bg-neutral-100 hover:bg-blue-50/80 dark:bg-[#1C1E23] dark:hover:bg-blue-950/40 text-neutral-800 dark:text-neutral-200 hover:text-blue-600 dark:hover:text-blue-400 border border-neutral-200/80 dark:border-neutral-700 hover:border-blue-300 dark:hover:border-blue-700 transition-all cursor-pointer align-baseline"
            title={`View grounded source: ${sourceName}`}
          >
            <FileText className="w-3 h-3 text-neutral-500 dark:text-neutral-400 group-hover:text-blue-500 shrink-0" />
            <span className="truncate max-w-[200px]">{sourceName}</span>
          </button>
        );
      }

      // Format bold and inline code
      return renderInlineMarkdown(part, pIdx);
    });
  };

  const renderInlineMarkdown = (text: string, keyPrefix: string | number) => {
    // Handle inline code: `code`
    const codeSegments = text.split(/(`[^`]+`)/g);

    return (
      <React.Fragment key={keyPrefix}>
        {codeSegments.map((segment, cIdx) => {
          if (segment.startsWith('`') && segment.endsWith('`')) {
            return (
              <code
                key={cIdx}
                className="px-1.5 py-0.5 mx-0.5 text-[12px] font-mono rounded bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200/60 dark:border-neutral-700/60"
              >
                {segment.slice(1, -1)}
              </code>
            );
          }

          // Handle bold: **bold**
          const boldSegments = segment.split(/(\*\*[^*]+\*\*)/g);
          return boldSegments.map((bSegment, bIdx) => {
            if (bSegment.startsWith('**') && bSegment.endsWith('**')) {
              return (
                <strong key={bIdx} className="font-semibold text-neutral-900 dark:text-neutral-100">
                  {bSegment.slice(2, -2)}
                </strong>
              );
            }
            return <span key={bIdx}>{bSegment}</span>;
          });
        })}
      </React.Fragment>
    );
  };

  // Parse lines into paragraphs, headings, bullet lists, numbered lists, and code blocks
  const lines = content.split('\n');
  const elements: React.ReactNode[] = [];
  let inCodeBlock = false;
  let codeBlockLanguage = '';
  let codeBlockLines: string[] = [];
  let codeBlockCounter = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    if (line.startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        const codeText = codeBlockLines.join('\n');
        const currentCounter = codeBlockCounter++;
        elements.push(
          <div
            key={`code-${i}`}
            className="my-4 rounded-xl overflow-hidden border border-neutral-200/80 dark:border-neutral-800 bg-[#F6F6F6] dark:bg-[#121316]"
          >
            <div className="flex items-center justify-between px-3.5 py-2 border-b border-neutral-200/60 dark:border-neutral-800 text-[11px] font-mono text-neutral-500">
              <span>{codeBlockLanguage || 'code'}</span>
              <button
                type="button"
                onClick={() => handleCopyCode(codeText, currentCounter)}
                className="flex items-center gap-1 text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200 transition-colors cursor-pointer"
              >
                {copiedIndex === currentCounter ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span className="text-emerald-500">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3 h-3" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="p-3.5 text-xs font-mono overflow-x-auto text-neutral-800 dark:text-neutral-200 leading-relaxed">
              <code>{codeText}</code>
            </pre>
          </div>
        );
        inCodeBlock = false;
        codeBlockLines = [];
        codeBlockLanguage = '';
      } else {
        inCodeBlock = true;
        codeBlockLanguage = line.slice(3).trim();
        codeBlockLines = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      continue;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3
          key={`h3-${i}`}
          className="text-[15px] font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mt-5 mb-2"
        >
          {renderFormattedText(line.slice(4))}
        </h3>
      );
      continue;
    }

    if (line.startsWith('## ')) {
      elements.push(
        <h2
          key={`h2-${i}`}
          className="text-base font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mt-6 mb-2.5 pb-1 border-b border-neutral-100 dark:border-neutral-800"
        >
          {renderFormattedText(line.slice(3))}
        </h2>
      );
      continue;
    }

    if (line.startsWith('# ')) {
      elements.push(
        <h1
          key={`h1-${i}`}
          className="text-lg font-semibold tracking-tight text-neutral-900 dark:text-neutral-100 mt-6 mb-3"
        >
          {renderFormattedText(line.slice(2))}
        </h1>
      );
      continue;
    }

    // Numbered list item: e.g. "1. "
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)/);
    if (numberedMatch) {
      const num = numberedMatch[1];
      const rest = numberedMatch[2];
      elements.push(
        <div key={`num-${i}`} className="flex items-start gap-2.5 my-1.5 pl-1">
          <span className="text-xs font-mono font-medium text-neutral-400 dark:text-neutral-500 pt-0.5 shrink-0 select-none">
            {num}.
          </span>
          <div className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {renderFormattedText(rest)}
          </div>
        </div>
      );
      continue;
    }

    // Bullet list item: e.g. "- " or "   - "
    const bulletMatch = line.match(/^(\s*)[-*]\s+(.*)/);
    if (bulletMatch) {
      const indentLevel = Math.floor(bulletMatch[1].length / 2);
      const rest = bulletMatch[2];
      elements.push(
        <div
          key={`bullet-${i}`}
          className="flex items-start gap-2.5 my-1.5"
          style={{ paddingLeft: `${indentLevel * 16 + 4}px` }}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-neutral-400 dark:bg-neutral-500 mt-2 shrink-0 select-none" />
          <div className="flex-1 text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed">
            {renderFormattedText(rest)}
          </div>
        </div>
      );
      continue;
    }

    // Empty lines
    if (!line.trim()) {
      elements.push(<div key={`empty-${i}`} className="h-2" />);
      continue;
    }

    // Standard paragraph
    elements.push(
      <p key={`p-${i}`} className="text-sm text-neutral-700 dark:text-neutral-300 leading-relaxed my-1.5">
        {renderFormattedText(line)}
      </p>
    );
  }

  return <div className="space-y-0.5">{elements}</div>;
};
