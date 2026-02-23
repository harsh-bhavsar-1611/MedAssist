import React, { useState } from 'react';
import { Check, MessageSquare, Pencil, X, Clock4, Trash2 } from 'lucide-react';
import { cn } from '../lib/utils';
import NewChatButton from './NewChatButton';

const Sidebar = ({ sessions, currentSessionId, onNewChat, onSelectSession, onRenameSession, onDeleteSession }) => {
  const [editingSessionId, setEditingSessionId] = useState(null);
  const [draftTitle, setDraftTitle] = useState('');
  const [renameError, setRenameError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const startEditing = (session) => {
    setRenameError('');
    setEditingSessionId(session.id);
    setDraftTitle((session.title || '').trim() || `Session ${session.id}`);
  };

  const cancelEditing = () => {
    setEditingSessionId(null);
    setDraftTitle('');
    setRenameError('');
  };

  const saveTitle = async (sessionId) => {
    const normalizedTitle = draftTitle.trim();
    if (!normalizedTitle) {
      setRenameError('Title cannot be empty.');
      return;
    }

    setIsSaving(true);
    setRenameError('');
    try {
      await onRenameSession(sessionId, normalizedTitle);
      cancelEditing();
    } catch (err) {
      setRenameError(err?.message || 'Could not update title.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteSession = async (session) => {
    const confirmed = window.confirm(`Delete chat "${session.title || `Session ${session.id}`}"? This cannot be undone.`);
    if (!confirmed) return;

    setRenameError('');
    try {
      await onDeleteSession(session.id);
      if (editingSessionId === session.id) {
        cancelEditing();
      }
    } catch (err) {
      setRenameError(err?.message || 'Could not delete chat.');
    }
  };

  return (
    <div className="flex h-full flex-col">
      <div className="p-4 pb-3">
        <NewChatButton onClick={onNewChat} />
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-2 scroll-smooth">
        <div className="mb-2 flex items-center justify-between px-2">
          <h3 className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
            History
          </h3>
          <span className="rounded-full bg-slate-100/60 px-2 py-1 text-[10px] font-semibold text-slate-500">
            {sessions.length}
          </span>
        </div>

        {sessions.length === 0 ? (
          <div className="mx-2 rounded-2xl border border-dashed border-slate-300/60 bg-slate-100/35 px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-200/55 text-slate-400">
              <MessageSquare className="h-5 w-5" />
            </div>
            <p className="text-sm font-medium text-slate-500">No chat history yet</p>
            <p className="mt-1 text-xs text-slate-400">Start a conversation to create your first record</p>
          </div>
        ) : (
          <ul className="space-y-1">
            {sessions.map((session) => (
              <li key={session.id}>
                <div
                  onClick={() => editingSessionId !== session.id && onSelectSession(session.id)}
                  className={cn(
                    "group relative flex w-full cursor-pointer items-center gap-3 overflow-hidden rounded-xl px-3 py-3 text-left text-sm transition-all duration-200",
                    currentSessionId === session.id
                      ? "bg-slate-100/78 text-blue-700 shadow-sm ring-1 ring-blue-300/45"
                      : "text-slate-600 hover:bg-slate-100/65 hover:text-slate-900"
                  )}
                >
                  <MessageSquare className={cn(
                    "h-4 w-4 flex-shrink-0 transition-colors",
                    currentSessionId === session.id ? "text-blue-500" : "text-slate-400 group-hover:text-slate-500"
                  )} />
                  {editingSessionId === session.id ? (
                    <span className="flex-1 z-10 flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <input
                        value={draftTitle}
                        onChange={(e) => setDraftTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            saveTitle(session.id);
                          } else if (e.key === 'Escape') {
                            e.preventDefault();
                            cancelEditing();
                          }
                        }}
                        className="w-full rounded-md border border-slate-300 bg-slate-100/90 px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                        maxLength={120}
                        autoFocus
                      />
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          saveTitle(session.id);
                        }}
                        disabled={isSaving}
                        className="rounded-md p-1 text-emerald-600 hover:bg-emerald-50 disabled:opacity-60"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cancelEditing();
                        }}
                        disabled={isSaving}
                        className="rounded-md p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-60"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                  ) : (
                    <span className="truncate flex-1 z-10">{session.title || `Session ${session.id}`}</span>
                  )}

                  {editingSessionId !== session.id && (
                    <div className="flex items-center gap-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          startEditing(session);
                        }}
                        className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-blue-50 hover:text-blue-600"
                        title="Rename chat"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session);
                        }}
                        className="rounded-md p-1 text-slate-400 opacity-0 transition group-hover:opacity-100 hover:bg-red-50 hover:text-red-600"
                        title="Delete chat"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {currentSessionId === session.id && (
                    <div className="absolute inset-y-1 left-0 w-1 rounded-r-full bg-gradient-to-b from-sky-400 to-blue-600" />
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}

        {renameError && (
          <p className="mt-2 px-4 text-xs text-red-600">{renameError}</p>
        )}
      </div>

      <div className="mt-auto border-none border-slate-300/40 p-4">
        <div className="flex items-center gap-2 rounded-xl bg-slate-100/60 px-3 py-2 text-[11px] text-slate-500">
          <Clock4 className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-medium">Auto-saved conversation history</span>
        </div>
        <p className="mt-3 text-center text-[10px] text-slate-400/85">
          MedAssist Workspace
        </p>
      </div>
    </div>
  );
};

export default Sidebar;
