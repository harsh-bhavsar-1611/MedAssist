import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, Mic, Volume2, VolumeX } from 'lucide-react';
import { cn } from '../lib/utils';

const InputArea = ({ onSend, isLoading, voiceOutputEnabled, onToggleVoiceOutput }) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [micError, setMicError] = useState(null);
  const textareaRef = useRef(null);
  const recognitionRef = useRef(null);
  const baseInputRef = useRef('');

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    onSend(input);
    setInput('');
    setMicError(null);
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    setMicError(null);
    e.target.style.height = 'auto'; 
    e.target.style.height = `${e.target.scrollHeight}px`;
  };

  const handleMicClick = () => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
          setMicError("Speech recognition is not supported in this browser.");
          return;
      }

      if (isRecording && recognitionRef.current) {
          recognitionRef.current.stop();
          return;
      }

      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US';
      recognition.interimResults = true;
      recognition.continuous = true;
      baseInputRef.current = input ? `${input} ` : '';

      recognition.onstart = () => {
          setMicError(null);
          setIsRecording(true);
      };

      recognition.onresult = (event) => {
          let transcript = '';
          for (let i = event.resultIndex; i < event.results.length; i += 1) {
              transcript += event.results[i][0].transcript;
          }
          setInput(`${baseInputRef.current}${transcript.trimStart()}`);

          if (textareaRef.current) {
              textareaRef.current.style.height = 'auto';
              textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
          }
      };

      recognition.onerror = (event) => {
          if (event.error !== 'no-speech') {
              setMicError("Couldn't capture voice clearly. Please try again.");
          }
      };

      recognition.onend = () => {
          setIsRecording(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
  };

  return (
    <div className="sticky bottom-0 z-20 border-t border-slate-300/30 bg-transparent px-4 py-2 md:px-8">
      <div className="mx-auto max-w-3xl">
        <div className={cn(
            "relative flex items-end gap-1.5 rounded-[20px] border p-1.5 shadow-sm transition-all duration-200",
            "border-slate-300/40 bg-transparent hover:border-slate-400/45",
            "focus-within:border-blue-300 focus-within:bg-transparent focus-within:ring-4 focus-within:ring-blue-200/35"
        )}>
            <textarea
                ref={textareaRef}
                value={input}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                placeholder={isRecording ? "Listening..." : "Message MedAssist..."}
                className="max-h-24 min-h-[38px] w-full resize-none overflow-y-auto border-none bg-transparent px-1.5 py-2 text-sm leading-relaxed text-slate-800 outline-none focus:outline-none focus:ring-0 placeholder:text-slate-500"
                rows={1}
                disabled={isLoading}
                style={{ height: 'auto', minHeight: '38px' }}
            />

            <div className="mb-0.5 flex items-center gap-0.5">
                 <button
                    onClick={onToggleVoiceOutput}
                    className={cn(
                        "flex-shrink-0 rounded-full p-2 transition-all duration-200",
                        voiceOutputEnabled
                            ? "text-emerald-600 hover:bg-emerald-100/60"
                            : "text-slate-400 hover:bg-slate-200/55 hover:text-slate-600"
                    )}
                    title={voiceOutputEnabled ? "Voice reply on" : "Voice reply off"}
                 >
                    {voiceOutputEnabled ? <Volume2 className="h-4.5 w-4.5" /> : <VolumeX className="h-4.5 w-4.5" />}
                 </button>

                 {(!input.trim() && !isLoading) ? (
                     <button
                        onClick={handleMicClick}
                        className={cn(
                            "flex-shrink-0 rounded-full p-2 transition-all duration-200",
                            isRecording 
                                ? "bg-red-50 text-red-500 animate-pulse ring-2 ring-red-100" 
                                : "text-slate-400 hover:bg-slate-200/55 hover:text-slate-600"
                        )}
                        title="Voice Input"
                     >
                        <Mic className="h-4.5 w-4.5" />
                     </button>
                 ) : (
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || isLoading}
                        className={cn(
                            "flex h-8.5 w-8.5 flex-shrink-0 items-center justify-center rounded-full transition-all duration-200 shadow-sm",
                            (!input.trim() || isLoading)
                            ? "cursor-not-allowed bg-slate-200/70 text-slate-400"
                            : "bg-gradient-to-br from-sky-500 to-blue-600 text-white shadow-blue-500/30 hover:scale-105 hover:brightness-105 active:scale-95"
                        )}
                    >
                        {isLoading ? <Loader2 className="h-4.5 w-4.5 animate-spin" /> : <Send className="ml-0.5 h-4.5 w-4.5" />}
                    </button>
                 )}
            </div>
        </div>
        
        <div className="mt-1.5 text-center">
            <p className="text-[11px] text-slate-500/85">
            {micError || "MedAssist can make mistakes. Consider checking important information."}
            </p>
        </div>
      </div>
    </div>
  );
};

export default InputArea;
