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
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'font-medium',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'rounded-lg',
      'border',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed',
      'disabled:pointer-events-none',
      'select-none',
      'whitespace-nowrap',
    ];

    // Size variants
    const sizeClasses = {
      sm: ['px-3', 'py-1.5', 'text-sm', 'gap-1.5'],
      md: ['px-4', 'py-2', 'text-base', 'gap-2'],
      lg: ['px-6', 'py-3', 'text-lg', 'gap-2.5'],
    };

    // Color variants
    const variantClasses = {
      primary: [
        'bg-primary',
        'border-primary',
        'text-white',
        'hover:bg-primary-dark',
        'hover:border-primary-dark',
        'focus:ring-primary',
        'active:bg-primary-dark',
      ],
      secondary: [
        'bg-secondary',
        'border-secondary',
        'text-white',
        'hover:bg-secondary-dark',
        'hover:border-secondary-dark',
        'focus:ring-secondary',
        'active:bg-secondary-dark',
      ],
      outline: [
        'bg-transparent',
        'border-primary',
        'text-primary',
        'hover:bg-primary',
        'hover:text-white',
        'focus:ring-primary',
        'active:bg-primary',
      ],
      ghost: [
        'bg-transparent',
        'border-transparent',
        'text-on-surface',
        'hover:bg-surface-variant',
        'focus:ring-primary',
        'active:bg-surface-variant',
      ],
      danger: [
        'bg-error',
        'border-error',
        'text-white',
        'hover:bg-red-700',
        'hover:border-red-700',
        'focus:ring-error',
        'active:bg-red-700',
      ],
      success: [
        'bg-success',
        'border-success',
        'text-white',
        'hover:bg-green-600',
        'hover:border-green-600',
        'focus:ring-success',
        'active:bg-green-600',
      ],
    };

    const classes = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      fullWidth && 'w-full',
      className
    );

    const motionProps: HTMLMotionProps<'button'> = animate
      ? {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.98 },
          transition: { duration: 0.1 },
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
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
            <span>Loading...</span>
          </>
        ) : (
          <>
            {leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
            {children && <span>{children}</span>}
            {rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
          </>
        )}
      </ButtonComponent>
    );
  }
);

Button.displayName = 'Button';

export { Button };
export default Button;