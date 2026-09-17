import React from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  trailingElement?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  trailingElement,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className="w-full flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="text-xs font-medium text-neutral-600 dark:text-neutral-400 select-none"
        >
          {label}
        </label>
      )}
      <div className="relative flex items-center w-full">
        {icon && (
          <div className="absolute left-3 flex items-center pointer-events-none text-neutral-400 dark:text-neutral-500">
            {icon}
          </div>
        )}
        <input
          id={inputId}
          className={`w-full bg-white dark:bg-[#151619] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm rounded-xl border border-neutral-200/80 dark:border-neutral-800/80 focus:outline-none focus:ring-2 focus:ring-neutral-400/40 dark:focus:ring-neutral-600/40 focus:border-neutral-400 dark:focus:border-neutral-600 transition-all py-2.5 ${
            icon ? 'pl-10' : 'pl-3.5'
          } ${trailingElement ? 'pr-10' : 'pr-3.5'} ${
            error ? 'border-red-500 focus:ring-red-400' : ''
          } ${className}`}
          {...props}
        />
        {trailingElement && (
          <div className="absolute right-2.5 flex items-center text-neutral-400">
            {trailingElement}
          </div>
        )}
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
