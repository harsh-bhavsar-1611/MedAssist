import React from 'react';

const TypingIndicator = () => (
  <div className="w-fit rounded-2xl rounded-tl-sm border border-slate-300/45 bg-slate-100/80 px-4 py-3">
    <div className="flex items-center gap-1.5">
      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.3s]" />
      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce [animation-delay:-0.15s]" />
      <div className="h-2 w-2 rounded-full bg-slate-400 animate-bounce" />
    </div>
  </div>
);

export default TypingIndicator;
