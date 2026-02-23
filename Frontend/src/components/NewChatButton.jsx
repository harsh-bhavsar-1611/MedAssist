import React from 'react';
import { Plus } from 'lucide-react';

const NewChatButton = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-sky-500 to-blue-600 px-4 py-3 text-white shadow-lg shadow-blue-500/25 transition-all duration-200 hover:-translate-y-0.5 hover:brightness-105 active:translate-y-0 focus:outline-none focus:ring-4 focus:ring-blue-200/60"
    >
      <div className="rounded-full bg-white/20 p-1.5">
         <Plus className="h-4.5 w-4.5 text-white" />
      </div>
      <span className="font-semibold tracking-wide">Start New Chat</span>
    </button>
  );
};

export default NewChatButton;
