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
          className={`w-full bg-white dark:bg-[#151619] text-neutral-900 dark:text-neutral-100 placeholder-neutral-400 dark:placeholder-neutral-500 text-sm rounded-lg border border-neutral-200 dark:border-neutral-800 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-600 focus:border-neutral-400 dark:focus:border-neutral-600 transition-colors py-2 ${
            icon ? 'pl-9' : 'pl-3'
          } ${trailingElement ? 'pr-9' : 'pr-3'} ${error ? 'border-red-400 dark:border-red-800' : ''} ${className}`}
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
