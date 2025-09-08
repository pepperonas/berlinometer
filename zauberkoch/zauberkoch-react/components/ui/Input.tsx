'use client';

import React, { InputHTMLAttributes, forwardRef, useState, useId } from 'react';
import { cn } from '@/lib/utils';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';
import { motion } from 'framer-motion';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = 'text',
      label,
      error,
      helperText,
      leftIcon,
      rightIcon,
      fullWidth = true,
      id,
      ...props
    },
    ref
  ) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const generatedId = useId();
    
    const inputId = id || generatedId;
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    
    const inputClasses = cn(
      // Base dark theme styles
      'w-full',
      'px-4',
      'py-3',
      'text-base',
      'text-text-primary',
      'bg-background-darker',
      'border',
      'rounded-lg',
      'transition-all',
      'duration-300',
      'placeholder:text-on-surface-variant',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-1',
      'focus:ring-offset-background-dark',
      
      // Hover state
      'hover:bg-surface hover:border-outline-variant',
      
      // States
      error 
        ? 'border-accent-red focus:ring-accent-red focus:border-accent-red bg-red-950/20' 
        : 'border-outline focus:ring-accent-blue focus:border-accent-blue',
      
      isFocused && !error && 'bg-surface ring-2 ring-accent-blue/30 border-accent-blue',
      
      // Icon spacing
      leftIcon && 'pl-12',
      (rightIcon || isPassword) && 'pr-12',
      
      // Disabled state
      props.disabled && 'opacity-50 cursor-not-allowed bg-surface-variant',
      
      !fullWidth && 'w-auto',
      
      className
    );

    const containerClasses = cn(
      'relative',
      fullWidth ? 'w-full' : 'w-auto'
    );

    return (
      <div className={containerClasses}>
        {label && (
          <motion.label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2 transition-colors',
              error ? 'text-accent-red' : 'text-text-primary'
            )}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {label}
            {props.required && <span className="text-accent-red ml-1">*</span>}
          </motion.label>
        )}
        
        <div className="relative group">
          {leftIcon && (
            <div className={cn(
              "absolute left-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-300",
              isFocused ? "text-accent-blue" : "text-on-surface-variant",
              error && "text-accent-red"
            )}>
              {leftIcon}
            </div>
          )}
          
          <input
            ref={ref}
            id={inputId}
            type={inputType}
            className={inputClasses}
            onFocus={(e) => {
              setIsFocused(true);
              props.onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              props.onBlur?.(e);
            }}
            {...props}
            style={{
              ...props.style,
              // Custom CSS properties for fine control
              '--tw-ring-offset-color': 'var(--background-dark)',
            } as React.CSSProperties}
          />
          
          {/* Gradient border effect on focus */}
          <div className={cn(
            "absolute inset-0 rounded-lg pointer-events-none transition-opacity duration-300",
            "bg-gradient-to-r from-accent-blue via-primary-light to-accent-blue",
            "opacity-0",
            isFocused && !error && "opacity-20"
          )} />
          
          {isPassword && (
            <button
              type="button"
              className={cn(
                "absolute right-4 top-1/2 transform -translate-y-1/2 transition-all duration-300",
                "text-on-surface-variant hover:text-accent-blue",
                "hover:scale-110"
              )}
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          )}
          
          {rightIcon && !isPassword && (
            <div className={cn(
              "absolute right-4 top-1/2 transform -translate-y-1/2 pointer-events-none transition-colors duration-300",
              isFocused ? "text-accent-blue" : "text-on-surface-variant",
              error && "text-accent-red"
            )}>
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <motion.div 
            className="mt-2 flex items-start gap-1"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error && (
              <FiAlertCircle className="text-accent-red flex-shrink-0 mt-0.5 animate-pulse" size={16} />
            )}
            <p className={cn(
              'text-sm transition-colors',
              error ? 'text-accent-red' : 'text-text-secondary'
            )}>
              {error || helperText}
            </p>
          </motion.div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;