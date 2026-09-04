import * as React from 'react';
import { cn } from '../../lib/utils';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'secondary' | 'subtle' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-xl text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400 disabled:pointer-events-none disabled:opacity-50 active:scale-98 select-none',
          variant === 'default' &&
            'bg-slate-900 text-white hover:bg-slate-800 shadow-xs border border-slate-800',
          variant === 'secondary' &&
            'bg-blue-600 text-white hover:bg-blue-500 shadow-sm shadow-blue-600/20',
          variant === 'outline' &&
            'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:text-slate-900 shadow-2xs',
          variant === 'ghost' &&
            'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
          variant === 'subtle' &&
            'bg-slate-100 text-slate-700 hover:bg-slate-200/80 hover:text-slate-900',
          variant === 'destructive' &&
            'bg-rose-600 text-white hover:bg-rose-500 shadow-xs',
          size === 'default' && 'h-9 px-4 py-2',
          size === 'sm' && 'h-8 rounded-lg px-3 text-xs',
          size === 'lg' && 'h-10 rounded-xl px-8',
          size === 'icon' && 'h-9 w-9 p-0 rounded-full',
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

