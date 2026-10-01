import React, { useRef, useEffect, useState } from 'react';
import {
  ArrowUp,
  Square,
  Globe,
  FileText,
  X,
  Mic,
  MicOff,
  AlertCircle,
} from 'lucide-react';
import type { AurenDocument, KnowledgeScope } from '../../types';

interface ChatComposerProps {
  inputMessage: string;
  onInputChange: (val: string) => void;
  onSend: (text?: string) => void;
  onStop?: () => void;
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
  onStop,
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
          const trimmed = inputMessage.trim();
          onInputChange(trimmed ? `${trimmed} ${transcript}` : transcript);
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

      <div
        className={`bg-white dark:bg-neutral-900 border rounded-xl p-3.5 sm:p-4 transition-colors ${
          isListening
            ? 'border-red-500 dark:border-red-500 ring-1 ring-red-500/30'
            : 'border-neutral-200 dark:border-neutral-800 focus-within:border-neutral-400 dark:focus-within:border-neutral-600'
        }`}
      >
        {/* Attached context chips */}
        {attachedDocs.length > 0 && (
          <div className="flex flex-wrap items-center gap-1.5 mb-2.5 pb-2 border-b border-neutral-100 dark:border-neutral-800">
            <span className="text-xs text-neutral-400 font-medium select-none">Context:</span>
            {attachedDocs.map((doc) => (
              <span
                key={doc.id}
                className="inline-flex items-center gap-1.5 text-xs px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-neutral-800 text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700"
              >
                <FileText className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                <span className="truncate max-w-[180px]">{doc.title}</span>
                <button
                  type="button"
                  onClick={() => onRemoveAttachedDoc(doc.id)}
                  className="p-0.5 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer rounded"
                  title="Remove attachment"
                >
                  <X className="w-3.5 h-3.5" />
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
          className="w-full bg-transparent text-sm text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 resize-none outline-none leading-relaxed min-h-[38px] px-0.5"
        />

        {/* Controls Footer: Scope Selector, Speech-to-Text & Send */}
        <div className="flex items-center justify-between pt-2.5 mt-1 border-t border-neutral-100 dark:border-neutral-800/60">
          {/* Scope Selector */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => onChangeScope('personal')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeScope === 'personal'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="AUREN searches your private personal vault"
            >
              Personal
            </button>

            <button
              type="button"
              onClick={() => onChangeScope('organization')}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                activeScope === 'organization'
                  ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="AUREN searches organization knowledge and repositories"
            >
              Organization
            </button>

            <button
              type="button"
              onClick={onToggleSearchWeb}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors cursor-pointer border ${
                searchWeb
                  ? 'bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-200 border-transparent hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title="AUREN also verifies and cites live technical web indices"
            >
              <Globe className="w-3.5 h-3.5" />
              <span>Web</span>
            </button>
          </div>

          {/* Right Action Buttons: Speech-to-Text & Send */}
          <div className="flex items-center gap-1.5">
            {/* Speech-to-Text Button */}
            <button
              type="button"
              onClick={handleToggleSpeech}
              className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                isListening
                  ? 'bg-red-500 text-white'
                  : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
              }`}
              title={isListening ? 'Click to stop listening' : 'Voice input (Speech to text)'}
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>

            {/* Send or Stop Button */}
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="p-1.5 rounded-md transition-colors cursor-pointer bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200"
                title="Stop generating response"
              >
                <Square className="w-4 h-4 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => onSend()}
                disabled={!inputMessage.trim()}
                className={`p-1.5 rounded-md transition-colors cursor-pointer ${
                  inputMessage.trim()
                    ? 'bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 hover:bg-neutral-800 dark:hover:bg-neutral-200'
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-400 dark:text-neutral-600 cursor-not-allowed'
                }`}
                title="Send prompt to AUREN"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
