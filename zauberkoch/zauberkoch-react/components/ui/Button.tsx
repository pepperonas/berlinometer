'use client';

import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success' | 'minimal' | 'floating';
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  animate?: boolean;
  href?: string;
  external?: boolean;
  glow?: boolean;
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
      glow = false,
      children,
      disabled,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'btn';

    // Size variants
    const sizeClasses = {
      xs: 'btn-xs',
      sm: 'btn-sm',
      md: '', // Default size
      lg: 'btn-lg',
      xl: 'btn-xl',
    };

    // Variant classes using new CSS system
    const variantClasses = {
      primary: 'btn-primary',
      secondary: 'btn-secondary',
      outline: 'btn-outline',
      ghost: 'btn-ghost',
      danger: 'btn-danger',
      success: 'btn-success',
      minimal: 'btn-minimal',
      floating: 'btn-floating',
    };

    const classes = cn(
      baseClasses,
      sizeClasses[size],
      variantClasses[variant],
      fullWidth && 'btn-full',
      glow && 'shadow-[0_0_30px_rgba(99,102,241,0.4)]',
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