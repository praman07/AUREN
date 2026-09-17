import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseClasses =
    'inline-flex items-center justify-center font-medium transition-all duration-150 rounded-lg select-none whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer active:scale-[0.985]';

  const sizeClasses = {
    sm: 'text-xs h-7 px-2.5 gap-1.5',
    md: 'text-sm h-9 px-3.5 gap-2',
    lg: 'text-base h-11 px-5 gap-2.5',
  };

  const variantClasses = {
    primary:
      'bg-[#18181B] text-white hover:bg-[#27272A] dark:bg-[#F4F4F5] dark:text-[#18181B] dark:hover:bg-[#E4E4E7] shadow-xs',
    secondary:
      'bg-[#F4F4F5] text-[#18181B] hover:bg-[#E4E4E7] dark:bg-[#202124] dark:text-[#F4F4F5] dark:hover:bg-[#2A2B2F] border border-neutral-200/60 dark:border-neutral-800/80',
    ghost:
      'bg-transparent text-[#3F3F46] hover:text-[#18181B] hover:bg-neutral-100 dark:text-[#A1A1AA] dark:hover:text-[#F4F4F5] dark:hover:bg-[#1E1F23]',
    outline:
      'bg-transparent border border-neutral-200 dark:border-neutral-800 text-[#18181B] dark:text-[#E4E4E7] hover:bg-neutral-50 dark:hover:bg-[#1A1B1E]',
    danger:
      'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400 dark:hover:bg-red-950/70 border border-red-200 dark:border-red-900/50',
  };

  return (
    <button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg
          className="animate-spin -ml-0.5 mr-1.5 h-3.5 w-3.5 text-current"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
      {!isLoading && icon && iconPosition === 'left' && <span className="shrink-0">{icon}</span>}
      <span>{children}</span>
      {!isLoading && icon && iconPosition === 'right' && <span className="shrink-0">{icon}</span>}
    </button>
  );
};
