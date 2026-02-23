import React, { useState } from 'react';
import { User, Bot, Copy, Check, Download, FileDown } from 'lucide-react';
import { cn } from '../lib/utils';

const MessageBubble = ({ message }) => {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const renderInline = (text) => {
    const parts = String(text || "").split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, idx) => {
      const strongMatch = part.match(/^\*\*([^*]+)\*\*$/);
      if (strongMatch) {
        return <strong key={`${idx}-${strongMatch[1]}`} className="font-semibold">{strongMatch[1]}</strong>;
      }
      return <span key={`${idx}-${part}`}>{part}</span>;
    });
  };

  const renderTableBlock = (headerLine, separatorLine, bodyLines, keyPrefix) => {
    const headerCells = headerLine
      .split("|")
      .map((cell) => cell.trim())
      .filter(Boolean);
    if (!headerCells.length) return null;
    const rows = bodyLines.map((line) => line.split("|").map((cell) => cell.trim()).filter(Boolean));
    return (
      <div key={`${keyPrefix}-table`} className="my-1 overflow-x-auto rounded-lg border border-slate-300 bg-white/70">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/70">
              {headerCells.map((cell, idx) => (
                <th key={`${keyPrefix}-head-${idx}`} className="px-2 py-1.5 text-left font-semibold text-slate-700">
                  {renderInline(cell)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ridx) => (
              <tr key={`${keyPrefix}-row-${ridx}`} className="border-b last:border-b-0 border-slate-100">
                {row.map((cell, cidx) => (
                  <td key={`${keyPrefix}-cell-${ridx}-${cidx}`} className="px-2 py-1.5 text-slate-700">
                    {renderInline(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const renderBotText = (text) => {
    const lines = String(text || "").split("\n");
    const content = [];
    for (let idx = 0; idx < lines.length; idx += 1) {
      const line = lines[idx];
      const trimmed = line.trim();
      const nextLine = lines[idx + 1]?.trim() || "";

      const tableSeparator = /^(\|\s*-+[\s|:-]*\|?)$/.test(nextLine);
      const tableHeader = trimmed.includes("|") && trimmed.split("|").filter((cell) => cell.trim()).length >= 2;
      if (tableHeader && tableSeparator) {
        const bodyLines = [];
        let cursor = idx + 2;
        while (cursor < lines.length) {
          const candidate = lines[cursor].trim();
          if (!candidate || !candidate.includes("|")) break;
          bodyLines.push(candidate);
          cursor += 1;
        }
        const table = renderTableBlock(trimmed, nextLine, bodyLines, `line-${idx}`);
        if (table) content.push(table);
        idx = cursor - 1;
        continue;
      }

      const headingMatch = trimmed.match(/^(#{1,3})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const sizeClass = level === 1 ? "text-base" : level === 2 ? "text-sm" : "text-[13px]";
        content.push(
          <div key={`line-${idx}`} className={`${sizeClass} font-bold text-slate-800`}>
            {renderInline(headingMatch[2])}
          </div>
        );
        continue;
      }

      const orderedMatch = trimmed.match(/^(\d+)\.\s+(.+)$/);
      if (orderedMatch) {
        content.push(
          <div key={`line-${idx}`} className="flex gap-2">
            <span className="text-slate-500">{orderedMatch[1]}.</span>
            <span>{renderInline(orderedMatch[2])}</span>
          </div>
        );
        continue;
      }

      const bulletMatch = trimmed.match(/^[-*]\s+(.+)$/);
      if (bulletMatch) {
        content.push(
          <div key={`line-${idx}`} className="flex gap-2">
            <span className="mt-[2px] text-slate-500">•</span>
            <span>{renderInline(bulletMatch[1])}</span>
          </div>
        );
        continue;
      }

      if (!trimmed) {
        content.push(<div key={`line-${idx}`} className="h-2" />);
        continue;
      }

      content.push(<div key={`line-${idx}`}>{renderInline(line)}</div>);
    }
    return content;
  };

  const handleExportTxt = () => {
    const blob = new Blob([String(message.text || "")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `medassist-message-${message.id || Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintPdf = () => {
    const escaped = String(message.text || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    const html = `
      <html>
        <head><title>MedAssist Message</title></head>
        <body style="font-family:Segoe UI, Arial, sans-serif; padding:20px;">
          <h3>MedAssist Response</h3>
          <pre style="white-space:pre-wrap; font-family:Segoe UI, Arial, sans-serif;">${escaped}</pre>
        </body>
      </html>`;
    const printWindow = window.open("", "_blank", "width=900,height=700");
    if (!printWindow) return;
    printWindow.document.open();
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={cn(
      "group mb-6 flex w-full animate-in fade-in slide-in-from-bottom-2 duration-300",
      isUser ? "justify-end" : "justify-start"
    )}>
      <div className={cn(
        "flex max-w-[88%] gap-3 md:max-w-[78%]",
        isUser ? "flex-row-reverse" : "flex-row"
      )}>
        <div className={cn(
          "mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border shadow-sm",
          isUser ? "border-blue-500/40 bg-gradient-to-br from-blue-500 to-blue-600 text-white" : "border-emerald-500/40 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white"
        )}>
          {isUser ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
        </div>

        <div className="flex flex-col gap-1 min-w-0 relative">
          <div className={cn(
            "relative px-4.5 py-3.5 text-[14.5px] leading-relaxed shadow-sm",
            isUser 
              ? "rounded-2xl rounded-tr-sm bg-gradient-to-br from-blue-500 to-blue-600 text-white"
              : "rounded-2xl rounded-tl-sm border border-slate-300/55 bg-slate-100/82 text-slate-800 backdrop-blur"
          )}>
            <div className="whitespace-pre-wrap break-words font-normal">
              {isUser ? message.text : renderBotText(message.text)}
            </div>
          </div>

          <div className={cn(
            "flex items-center gap-2 mt-1 px-1",
            isUser ? "justify-end flex-row-reverse" : "justify-start"
          )}>
            <span className="text-[10px] text-slate-400 font-medium">
                {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            <button
              onClick={handleCopy}
              className={cn(
                "rounded-full p-1 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600",
                copied ? "text-green-500" : ""
              )}
              title="Copy message"
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            </button>
            {!isUser && (
              <>
                <button
                  onClick={handleExportTxt}
                  className="rounded-full p-1 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                  title="Export as text"
                >
                  <Download className="w-3 h-3" />
                </button>
                <button
                  onClick={handlePrintPdf}
                  className="rounded-full p-1 text-slate-400 opacity-0 transition-all duration-200 group-hover:opacity-100 hover:bg-slate-100 hover:text-slate-600"
                  title="Print / Save as PDF"
                >
                  <FileDown className="w-3 h-3" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessageBubble;
