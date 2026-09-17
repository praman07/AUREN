import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface EmptyChatProps {
  onSelectSuggestion: (query: string) => void;
  children: React.ReactNode;
}

export const EmptyChat: React.FC<EmptyChatProps> = ({
  onSelectSuggestion,
  children,
}) => {
  const { user } = useAuth();

  // Dynamic time of day greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const userName = user?.name ? user.name.split(' ')[0] : 'Praman';

  const suggestions = [
    'Review my recent architecture documents',
    'Search our engineering knowledge',
    'Summarize the latest project decisions',
    'Research this topic on the web',
  ];

  return (
    <div className="flex-1 flex flex-col justify-center items-center px-4 sm:px-6 py-12 max-w-2xl mx-auto w-full text-center select-none">
      {/* Greeting */}
      <div className="mb-8 space-y-1.5">
        <h2 className="text-2xl sm:text-3xl font-normal tracking-tight text-neutral-900 dark:text-neutral-100 font-sans">
          {getGreeting()}, {userName}.
        </h2>
        <p className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 font-normal">
          What would you like to explore?
        </p>
      </div>

      {/* Centered Composer */}
      <div className="w-full mb-6 text-left">{children}</div>

      {/* 4 Understated Suggestions */}
      <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
        {suggestions.map((item, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => onSelectSuggestion(item)}
            className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white bg-neutral-100/70 hover:bg-neutral-200/70 dark:bg-[#141518] dark:hover:bg-neutral-800/90 border border-neutral-200/60 dark:border-neutral-800/80 px-3 py-1.5 rounded-full transition-all cursor-pointer"
          >
            {item}
          </button>
        ))}
      </div>
    </div>
  );
};
