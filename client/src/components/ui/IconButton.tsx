import React from 'react';

export interface IconButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'ghost' | 'secondary' | 'outline' | 'primary';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  ariaLabel: string;
}

export const IconButton: React.FC<IconButtonProps> = ({
  children,
  variant = 'ghost',
  size = 'md',
  ariaLabel,
  className = '',
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-7 h-7 p-1 text-xs rounded-lg',
    sm: 'w-8.5 h-8.5 p-1.5 text-sm rounded-xl',
    md: 'w-10 h-10 p-2 text-sm rounded-xl',
    lg: 'w-11 h-11 p-2.5 text-base rounded-2xl',
  };

  const variantClasses = {
    ghost:
      'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:text-neutral-100 dark:hover:bg-[#202124]',
    secondary:
      'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 dark:bg-[#202124] dark:text-neutral-200 dark:hover:bg-[#2A2B2F] border border-neutral-200/50 dark:border-neutral-800/80',
    outline:
      'border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 dark:border-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 dark:hover:bg-[#1C1D20]',
    primary:
      'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-white',
  };

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      title={ariaLabel}
      className={`inline-flex items-center justify-center transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-400 dark:focus-visible:ring-neutral-500 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};
