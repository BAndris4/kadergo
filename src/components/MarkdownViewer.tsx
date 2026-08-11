import React from "react";

interface MarkdownViewerProps {
  content: string;
  className?: string;
}

/**
 * A rich, modern Markdown renderer for Release Notes with GitHub-style alerts,
 * feature badges, code blocks, callouts, and clean Tailwind typography.
 */
export const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, className = "" }) => {
  const parseMarkdown = (rawText: string) => {
    const lines = rawText.split("\n");
    const elements: React.ReactNode[] = [];
    let inCodeBlock = false;
    let codeBlockLanguage = "";
    let codeBlockLines: string[] = [];
    let listItems: string[] = [];

    const flushList = (keyPrefix: string) => {
      if (listItems.length > 0) {
        elements.push(
          <ul key={`ul-${keyPrefix}-${elements.length}`} className="space-y-2 my-3 pl-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs text-[#2d4a52] font-semibold leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f8a44c] mt-1.5 shrink-0 shadow-xs" />
                <span className="flex-1">{formatInline(item)}</span>
              </li>
            ))}
          </ul>
        );
        listItems = [];
      }
    };

    const formatInline = (text: string): React.ReactNode[] => {
      const parts: React.ReactNode[] = [];
      let currentStr = "";
      let i = 0;

      while (i < text.length) {
        if (text.substring(i, i + 2) === "**") {
          if (currentStr) {
            parts.push(currentStr);
            currentStr = "";
          }
          let endIdx = text.indexOf("**", i + 2);
          if (endIdx !== -1) {
            parts.push(
              <strong key={`b-${i}`} className="font-black text-[#133b47]">
                {text.substring(i + 2, endIdx)}
              </strong>
            );
            i = endIdx + 2;
            continue;
          }
        } else if (text[i] === "`") {
          if (currentStr) {
            parts.push(currentStr);
            currentStr = "";
          }
          let endIdx = text.indexOf("`", i + 1);
          if (endIdx !== -1) {
            parts.push(
              <code
                key={`c-${i}`}
                className="px-2 py-0.5 rounded-lg bg-[#e3eeeb] text-[#0f2e38] font-mono text-[11px] font-bold border border-[#c6d7d4] shadow-2xs"
              >
                {text.substring(i + 1, endIdx)}
              </code>
            );
            i = endIdx + 1;
            continue;
          }
        } else if (text[i] === "*" && text[i + 1] !== " ") {
          if (currentStr) {
            parts.push(currentStr);
            currentStr = "";
          }
          let endIdx = text.indexOf("*", i + 1);
          if (endIdx !== -1) {
            parts.push(
              <em key={`i-${i}`} className="italic font-bold text-[#35535c]">
                {text.substring(i + 1, endIdx)}
              </em>
            );
            i = endIdx + 1;
            continue;
          }
        }
        currentStr += text[i];
        i++;
      }
      if (currentStr) parts.push(currentStr);
      return parts;
    };

    lines.forEach((line, lineIdx) => {
      const trimmed = line.trim();

      // Fenced Code Blocks ```
      if (trimmed.startsWith("```")) {
        if (inCodeBlock) {
          elements.push(
            <div key={`code-box-${lineIdx}`} className="my-3 rounded-2xl overflow-hidden border border-[#0f2e38] shadow-md bg-[#0a2027]">
              {codeBlockLanguage && (
                <div className="px-3.5 py-1.5 bg-[#0f2e38] text-[#f8a44c] font-mono text-[10px] font-black uppercase tracking-wider border-b border-white/10 flex items-center justify-between">
                  <span>{codeBlockLanguage}</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              )}
              <pre className="p-4 text-[#e6f1ef] font-mono text-[11px] overflow-x-auto leading-relaxed">
                <code>{codeBlockLines.join("\n")}</code>
              </pre>
            </div>
          );
          codeBlockLines = [];
          inCodeBlock = false;
        } else {
          flushList(`${lineIdx}`);
          inCodeBlock = true;
          codeBlockLanguage = trimmed.substring(3).trim();
        }
        return;
      }

      if (inCodeBlock) {
        codeBlockLines.push(line);
        return;
      }

      // GitHub-style Alerts > [!NOTE], > [!TIP], > [!IMPORTANT], > [!WARNING]
      if (trimmed.startsWith("> [!NOTE]") || trimmed.startsWith("> [!TIP]")) {
        flushList(`${lineIdx}`);
        elements.push(
          <div key={`alert-note-${lineIdx}`} className="p-3.5 my-3 rounded-2xl bg-sky-50 border-l-4 border-sky-500 text-sky-950 text-xs font-semibold shadow-2xs flex gap-2.5 items-start">
            <span className="px-2 py-0.5 rounded-md bg-sky-200 text-sky-900 font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
              ПРИМІТКА
            </span>
            <div className="flex-1">{formatInline(trimmed.replace(/> \[!(NOTE|TIP)\]/, "").trim())}</div>
          </div>
        );
        return;
      } else if (trimmed.startsWith("> [!IMPORTANT]") || trimmed.startsWith("> [!WARNING]")) {
        flushList(`${lineIdx}`);
        elements.push(
          <div key={`alert-warn-${lineIdx}`} className="p-3.5 my-3 rounded-2xl bg-amber-50 border-l-4 border-amber-500 text-amber-950 text-xs font-semibold shadow-2xs flex gap-2.5 items-start">
            <span className="px-2 py-0.5 rounded-md bg-amber-200 text-amber-900 font-black text-[10px] uppercase tracking-wider shrink-0 mt-0.5">
              ВАЖЛИВО
            </span>
            <div className="flex-1">{formatInline(trimmed.replace(/> \[!(IMPORTANT|WARNING)\]/, "").trim())}</div>
          </div>
        );
        return;
      } else if (trimmed.startsWith("> ")) {
        flushList(`${lineIdx}`);
        elements.push(
          <blockquote key={`bq-${lineIdx}`} className="p-3 my-2.5 bg-[#f0f7f6] rounded-2xl border-l-4 border-[#133b47] text-xs font-semibold text-[#133b47]">
            {formatInline(trimmed.substring(2))}
          </blockquote>
        );
        return;
      }

      // List Items (- or *)
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        listItems.push(trimmed.substring(2).trim());
        return;
      } else {
        flushList(`${lineIdx}`);
      }

      // Headings
      if (trimmed.startsWith("# ")) {
        elements.push(
          <h1 key={`h1-${lineIdx}`} className="text-base font-black text-[#133b47] font-heading mt-4 mb-2 pb-1.5 border-b border-[#cbd8d6] flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#f8a44c]" />
            {formatInline(trimmed.substring(2))}
          </h1>
        );
      } else if (trimmed.startsWith("## ")) {
        elements.push(
          <h2 key={`h2-${lineIdx}`} className="text-sm font-black text-[#133b47] font-heading mt-3.5 mb-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#1c4e5c]" />
            {formatInline(trimmed.substring(3))}
          </h2>
        );
      } else if (trimmed.startsWith("### ")) {
        elements.push(
          <h3 key={`h3-${lineIdx}`} className="text-xs font-black text-[#1c4e5c] font-heading mt-3 mb-1">
            {formatInline(trimmed.substring(4))}
          </h3>
        );
      } else if (trimmed === "") {
        elements.push(<div key={`space-${lineIdx}`} className="h-1" />);
      } else {
        elements.push(
          <p key={`p-${lineIdx}`} className="text-xs leading-relaxed text-[#2d4a52] font-semibold my-1">
            {formatInline(line)}
          </p>
        );
      }
    });

    flushList("end");
    return elements;
  };

  return <div className={`space-y-1 ${className}`}>{parseMarkdown(content)}</div>;
};
