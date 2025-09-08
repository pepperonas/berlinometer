'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animate?: boolean;
  href?: string;
  external?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      loading = false,
      leftIcon,
      rightIcon,
      fullWidth = false,
      animate = true,
      href,
      external = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      inline-flex items-center justify-center gap-2
      font-medium rounded-lg border-none
      cursor-pointer transition-all duration-300
      text-decoration-none whitespace-nowrap select-none
      relative overflow-hidden
      focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
    `;

    // Size variants
    const sizeClasses = {
      sm: 'px-4 py-2 text-sm',
      md: 'px-6 py-3 text-base',
      lg: 'px-8 py-4 text-lg',
    };

    // Color variants using CSS variables from globals.css
    const variantClasses = {
      primary: `
        bg-gradient-to-r from-accent-blue to-primary-dark
        text-white shadow-lg
        hover:shadow-xl hover:from-primary-light hover:to-accent-blue
        focus-visible:ring-accent-blue
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/10 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%]
        before:transition-transform before:duration-700
      `,
      secondary: `
        bg-gradient-to-r from-accent-green to-secondary-dark
        text-white shadow-lg
        hover:shadow-xl hover:from-secondary-light hover:to-accent-green
        focus-visible:ring-accent-green
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/10 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%]
        before:transition-transform before:duration-700
      `,
      outline: `
        bg-transparent border-2 border-accent-blue
        text-accent-blue hover:bg-accent-blue hover:text-white
        hover:shadow-lg focus-visible:ring-accent-blue
      `,
      ghost: `
        bg-transparent text-text-primary
        hover:bg-white/5 focus-visible:ring-accent-blue
      `,
      danger: `
        bg-gradient-to-r from-accent-red to-red-700
        text-white shadow-lg
        hover:shadow-xl hover:from-red-400 hover:to-accent-red
        focus-visible:ring-accent-red
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/10 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%]
        before:transition-transform before:duration-700
      `,
      success: `
        bg-gradient-to-r from-accent-green to-green-700
        text-white shadow-lg
        hover:shadow-xl hover:from-green-400 hover:to-accent-green
        focus-visible:ring-accent-green
        before:absolute before:inset-0 before:bg-gradient-to-r 
        before:from-transparent before:via-white/10 before:to-transparent
        before:translate-x-[-100%] hover:before:translate-x-[100%]
        before:transition-transform before:duration-700
      `,
    };

    const classes = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      fullWidth && 'w-full',
      'group', // For hover effects on children
      className
    );

    const motionProps: HTMLMotionProps<'button'> = animate
      ? {
          whileHover: { scale: 1.02, y: -2 },
          whileTap: { scale: 0.98 },
          transition: { 
            type: "spring",
            stiffness: 400,
            damping: 17
          },
        }
      : {};

    const ButtonComponent = animate ? motion.button : 'button';

    return (
      <ButtonComponent
        ref={ref}
        className={classes}
        disabled={disabled || loading}
        {...(animate ? motionProps : {})}
        {...props}
      >
        {loading ? (
          <>
            <svg
              className="animate-spin h-5 w-5"
              xmlns="http://www.w3.org/2000/svg"
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
            <span>Lädt...</span>
          </>
        ) : (
          <>
            {leftIcon && (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                {leftIcon}
              </span>
            )}
            {children && <span>{children}</span>}
            {rightIcon && (
              <span className="flex-shrink-0 transition-transform duration-300 group-hover:scale-110">
                {rightIcon}
              </span>
            )}
          </>
        )}
      </ButtonComponent>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;