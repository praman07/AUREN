import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Globe,
  FileText,
  X,
  Mic,
  MicOff,
  Radio,
  AlertCircle,
} from 'lucide-react';
import { AurenDocument, KnowledgeScope } from '../../types';

interface ChatComposerProps {
  inputMessage: string;
  onInputChange: (val: string) => void;
  onSend: (text?: string) => void;
  isStreaming: boolean;
  activeScope: KnowledgeScope;
  onChangeScope: (scope: KnowledgeScope) => void;
  searchWeb: boolean;
  onToggleSearchWeb: () => void;
  attachedDocs: AurenDocument[];
  onRemoveAttachedDoc: (id: string) => void;
}

export const ChatComposer: React.FC<ChatComposerProps> = ({
  inputMessage,
  onInputChange,
  onSend,
  isStreaming,
  activeScope,
  onChangeScope,
  searchWeb,
  onToggleSearchWeb,
  attachedDocs,
  onRemoveAttachedDoc,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [isListening, setIsListening] = useState(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto resize textarea height based on content
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(textareaRef.current.scrollHeight, 180);
      textareaRef.current.style.height = `${Math.max(newHeight, 36)}px`;
    }
  }, [inputMessage]);

  // Initialize and manage Speech-to-Text
  const handleToggleSpeech = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError('Speech recognition is not supported in this browser.');
      setTimeout(() => setSpeechError(null), 4000);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }

        if (transcript) {
          onInputChange((prev) => {
            const trimmed = prev.trim();
            return trimmed ? `${trimmed} ${transcript}` : transcript;
          });
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          setSpeechError('Microphone permission was denied. Please allow microphone access.');
        } else {
          setSpeechError(`Speech recognition error: ${event.error}`);
        }
        setIsListening(false);
        setTimeout(() => setSpeechError(null), 4000);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      console.warn('Failed to start speech recognition:', err);
      setSpeechError('Unable to access microphone.');
      setIsListening(false);
      setTimeout(() => setSpeechError(null), 4000);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (inputMessage.trim() && !isStreaming) {
        if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
        }
        onSend();
      }
    }
  };

  return (
    <div className="w-full max-w-3xl lg:max-w-3.5xl mx-auto px-4 sm:px-6 pb-5 pt-2">
      {/* Speech error or active speech status banner */}
      {speechError && (
        <div className="mb-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-xs text-red-600 dark:text-red-300 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{speechError}</span>
          </div>
          <button
            type="button"
            onClick={() => setSpeechError(null)}
            className="text-red-500 hover:text-red-700 cursor-pointer"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      )}

      {isListening && (
        <div className="mb-2 px-3 py-1.5 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 flex items-center justify-between animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
            </span>
            <span className="text-xs font-medium text-red-700 dark:text-red-300">
              Listening to voice input... speak into your microphone
            </span>
          </div>
          <button
            type="button"
            onClick={handleToggleSpeech}
            className="text-xs font-semibold text-red-600 dark:text-red-400 hover:underline cursor-pointer"
          >
            Stop
          </button>
        </div>
      )}

      <div className={`bg-[#F8F8F9] dark:bg-[#131417] border rounded-2xl p-3 sm:p-3.5 shadow-xs transition-all duration-150 ${
        isListening
          ? 'border-red-400 dark:border-red-600 ring-2 ring-red-400/20'
          : 'border-neutral-200/80 dark:border-neutral-800 focus-within:border-neutral-400 dark:focus-within:border-neutral-600'
      }`}>
        {/* Attached context chips */}
        {attachedDocs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2 border-b border-neutral-200/50 dark:border-neutral-800">
            <span className="text-[11px] text-neutral-400 font-medium">Context:</span>
            {attachedDocs.map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-md bg-white dark:bg-[#1E2026] text-neutral-800 dark:text-neutral-200 border border-neutral-200/70 dark:border-neutral-700/70"
              >
                <FileText className="w-3 h-3 text-neutral-400" />
                <span className="truncate max-w-[180px]">{doc.title}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachedDoc(doc.id)}
                  className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Text Area */}
        <textarea
          ref={textareaRef}
          value={inputMessage}
          onChange={(e) => onInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder={isListening ? 'Transcribing your voice...' : 'Ask AUREN anything...'}
          className="w-full bg-transparent text-sm sm:text-[14.5px] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 resize-none outline-none leading-relaxed min-h-[36px]"
        />

        {/* Controls Footer: Scope Selector, Speech-to-Text & Send */}
        <div className="flex items-center justify-between pt-2 mt-1">
          {/* Scope Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeScope('personal')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeScope === 'personal'
                  ? 'bg-white dark:bg-[#202228] text-neutral-900 dark:text-white shadow-2xs border border-neutral-200/80 dark:border-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
              }`}
              title="AUREN searches your private personal vault"
            >
              Personal
            </button>

            <button
              type="button"
              onClick={() => onChangeScope('organization')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                activeScope === 'organization'
                  ? 'bg-white dark:bg-[#202228] text-neutral-900 dark:text-white shadow-2xs border border-neutral-200/80 dark:border-neutral-700'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
              }`}
              title="AUREN searches organization knowledge and repositories"
            >
              Organization
            </button>

            <button
              type="button"
              onClick={onToggleSearchWeb}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
                searchWeb
                  ? 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50'
              }`}
              title="AUREN also verifies and cites live technical web indices"
            >
              <Globe className="w-3 h-3" />
              <span>Web</span>
            </button>
          </div>

          {/* Right Action Buttons: Speech-to-Text & Send */}
          <div className="flex items-center gap-1.5">
            {/* Speech-to-Text Button */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white shadow-md animate-pulse ring-2 ring-red-400/40'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-200/60 dark:hover:bg-neutral-800/60'
              }`}
              title={isListening ? 'Click to stop listening' : 'Voice input (Speech to text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send Button */}
            <button
              type="button"
              onClick={() => onSend()}
              disabled={!inputMessage.trim() || isStreaming}
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                inputMessage.trim() && !isStreaming
                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:scale-105 active:scale-95 shadow-2xs'
                  : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed opacity-60'
              }`}
              title="Send prompt to AUREN"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
