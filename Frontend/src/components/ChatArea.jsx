import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Bot, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';
import TypingIndicator from './TypingIndicator';
import InputArea from './InputArea';
import { apiFetch, ApiError } from '../lib/api';

const ChatArea = ({ currentSessionId, setCurrentSessionId, setSessions }) => {
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isBotTyping, setIsBotTyping] = useState(false);
  const [voiceOutputEnabled, setVoiceOutputEnabled] = useState(true);
  const [error, setError] = useState(null);
  const messagesEndRef = useRef(null);
  const typingIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isBotTyping]);

  useEffect(() => {
    return () => {
      if (typingIntervalRef.current) {
        clearInterval(typingIntervalRef.current);
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const normalizeHistoryMessage = useCallback((msg, index) => ({
    id: msg.id || `${msg.created_at || Date.now()}-${index}`,
    text: msg.text ?? msg.message ?? '',
    sender: msg.sender,
    timestamp: msg.timestamp ?? msg.created_at ?? new Date().toISOString()
  }), []);

  const loadHistory = useCallback(async (sessionId) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch(`/api/history/${sessionId}/`);
      const rawMessages = response?.data?.messages || [];
      const normalized = rawMessages.map(normalizeHistoryMessage);
      setMessages(normalized);
    } catch (err) {
      console.error(err);
      setError(err instanceof ApiError ? err.message : 'Failed to load conversation.');
    } finally {
      setIsLoading(false);
    }
  }, [normalizeHistoryMessage]);

  useEffect(() => {
    if (currentSessionId) {
      loadHistory(currentSessionId);
    } else {
      setMessages([]);
      setError(null);
    }
  }, [currentSessionId, loadHistory]);

  const speakAssistantReply = useCallback((text) => {
    if (!voiceOutputEnabled || typeof window === 'undefined' || !window.speechSynthesis || !text) {
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1;
    utterance.pitch = 1;
    utterance.lang = 'en-US';
    window.speechSynthesis.speak(utterance);
  }, [voiceOutputEnabled]);

  const typeAssistantReply = (replyText, onComplete) => {
    const fullText = replyText || 'Response received.';
    const botMessageId = Date.now() + 1;
    const timestamp = new Date().toISOString();

    setMessages((prev) => [
      ...prev,
      {
        id: botMessageId,
        text: '',
        sender: 'bot',
        timestamp
      }
    ]);

    setIsBotTyping(true);

    let index = 0;
    const chunkSize = 2;

    typingIntervalRef.current = setInterval(() => {
      index += chunkSize;
      const nextText = fullText.slice(0, index);

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === botMessageId
            ? {
                ...msg,
                text: nextText
              }
            : msg
        )
      );

      if (index >= fullText.length) {
        clearInterval(typingIntervalRef.current);
        typingIntervalRef.current = null;
        setIsBotTyping(false);
        if (onComplete) {
          onComplete(fullText);
        }
      }
    }, 18);
  };

  const handleSend = async (text) => {
    const normalizedText = (text || '').trim();
    const userMessage = {
      id: Date.now(),
      text: normalizedText,
      sender: 'user',
      timestamp: new Date().toISOString()
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await apiFetch('/api/chat/', {
        method: 'POST',
        body: {
          message: normalizedText,
          session_id: currentSessionId,
        },
      });

      const data = response?.data || {};

      if (!currentSessionId && data.session_id) {
        setCurrentSessionId(data.session_id);

        const newSession = {
          id: data.session_id,
          title: data.session_title || text,
          timestamp: new Date().toISOString()
        };

        setSessions((prev) => {
          const exists = prev.find((s) => s.id === newSession.id);
          if (exists) return prev;
          return [newSession, ...prev];
        });
      } else if (currentSessionId && data.session_title) {
        setSessions((prev) =>
          prev.map((session) =>
            session.id === currentSessionId ? { ...session, title: data.session_title } : session
          )
        );
      }

      typeAssistantReply(data.reply, speakAssistantReply);
    } catch (err) {
      console.error('Failed to send message', err);
      setError(err instanceof ApiError ? err.message : 'Failed to send message. Please try again.');

      const shouldAddFallback = !(err instanceof ApiError) || err.status >= 500;
      if (shouldAddFallback) {
        setTimeout(() => {
          const botMessage = {
            id: Date.now() + 1,
            text: `I'm having trouble connecting to the server, but I received: ${text}`,
            sender: 'bot',
            timestamp: new Date().toISOString()
          };
          setMessages((prev) => [...prev, botMessage]);
        }, 600);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isBusy = isLoading || isBotTyping;

  return (
    <div className="relative flex h-full flex-col">
      {error && (
        <div className="absolute left-1/2 top-4 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full border border-red-200 bg-red-50/90 px-4 py-2 text-sm text-red-600 shadow-lg animate-in fade-in slide-in-from-top-2">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="ml-1 font-bold hover:text-red-800">&times;</button>
        </div>
      )}

      {/* <div className="border-b border-slate-300/40 px-4 py-3 md:px-8 md:py-4">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">Conversation</p>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">Patient Support Chat</h2>
          </div>
          <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-300/45 bg-slate-100/70 px-3 py-1.5 text-[11px] text-slate-600">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            <span className="font-semibold">Private session</span>
          </div>
        </div>
      </div> */}

      <div className="flex-1 overflow-y-auto px-4 py-5 md:px-8 md:py-8 scroll-smooth">
        {messages.length === 0 ? (
          <div className="mx-auto flex h-full w-full max-w-4xl flex-col items-center justify-center space-y-8 p-6 text-center animate-in fade-in duration-700">
            <div className="relative">
              <div className="relative z-10 mb-4 flex h-24 w-24 items-center justify-center rounded-3xl border border-slate-300/45 bg-slate-100/75 shadow-lg shadow-slate-900/5">
                <Bot className="h-12 w-12 text-blue-600" />
              </div>
              <div className="absolute inset-0 -z-10 scale-90 rotate-6 rounded-3xl bg-blue-300/35 blur-xl" />
            </div>

            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/45 bg-sky-50/70 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.15em] text-sky-700">
                <Sparkles className="h-3.5 w-3.5" />
                AI Guided Care
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-slate-800">How can I help you today?</h2>
              <p className="mx-auto max-w-md text-base leading-relaxed text-slate-500 md:text-lg">
                I'm your advanced medical assistant. Describe your symptoms or ask a health question.
              </p>
            </div>

            <div className="mt-4 grid w-full max-w-2xl grid-cols-1 gap-3 md:grid-cols-2">
              {[
                { text: 'I have a headache and fever', label: 'Symptom Check' },
                { text: 'What are symptoms of flu?', label: 'Information' },
                { text: 'My back hurts when I bend', label: 'Pain Analysis' },
                { text: 'Is it safe to take ibuprofen?', label: 'Medication' }
              ].map((item, i) => (
                <button
                  key={i}
                  onClick={() => handleSend(item.text)}
                  className="group flex flex-col rounded-2xl border border-slate-300/55 bg-slate-100/78 p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300/60 hover:shadow-md"
                >
                  <span className="mb-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">{item.label}</span>
                  <span className="text-sm font-medium text-slate-700 group-hover:text-blue-700">"{item.text}"</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="mx-auto w-full max-w-3xl space-y-6 pb-6">
            <div className="flex flex-col gap-6">
              {messages.map((msg) => (
                <MessageBubble key={msg.id} message={msg} />
              ))}
            </div>

            {isLoading && (
              <div className="flex w-full justify-start animate-in fade-in duration-300">
                <div className="flex max-w-[88%] flex-row gap-3 md:max-w-[78%]">
                  <div className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-emerald-500/40 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-sm">
                    <Bot className="h-5 w-5" />
                  </div>
                  <TypingIndicator />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      <div className="relative z-20">
        <InputArea
          onSend={handleSend}
          isLoading={isBusy}
          voiceOutputEnabled={voiceOutputEnabled}
          onToggleVoiceOutput={() => setVoiceOutputEnabled((prev) => !prev)}
        />
      </div>
    </div>
  );
};

export default ChatArea;
