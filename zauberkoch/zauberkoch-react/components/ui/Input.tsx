'use client';

import React, { InputHTMLAttributes, forwardRef, useState } from 'react';
import { cn } from '@/lib/utils';
import { FiEye, FiEyeOff, FiAlertCircle } from 'react-icons/fi';

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
    
    const inputId = id || `input-${Math.random().toString(36).substr(2, 9)}`;
    const isPassword = type === 'password';
    const inputType = isPassword ? (showPassword ? 'text' : 'password') : type;
    
    const inputClasses = cn(
      // Base styles
      'w-full',
      'px-4',
      'py-3',
      'text-base',
      'bg-background',
      'border',
      'rounded-lg',
      'transition-all',
      'duration-200',
      'placeholder:text-on-surface-variant',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-1',
      
      // States
      error 
        ? 'border-error focus:ring-error focus:border-error' 
        : 'border-outline focus:ring-primary focus:border-primary',
      
      isFocused && !error && 'ring-2 ring-primary border-primary',
      
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
          <label 
            htmlFor={inputId}
            className={cn(
              'block text-sm font-medium mb-2 transition-colors',
              error ? 'text-error' : 'text-on-surface'
            )}
          >
            {label}
            {props.required && <span className="text-error ml-1">*</span>}
          </label>
        )}
        
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant pointer-events-none">
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
          />
          
          {isPassword && (
            <button
              type="button"
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant hover:text-on-surface transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              tabIndex={-1}
            >
              {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
            </button>
          )}
          
          {rightIcon && !isPassword && (
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-on-surface-variant pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        
        {(error || helperText) && (
          <div className="mt-2 flex items-start gap-1">
            {error && <FiAlertCircle className="text-error flex-shrink-0 mt-0.5" size={16} />}
            <p className={cn(
              'text-sm',
              error ? 'text-error' : 'text-on-surface-variant'
            )}>
              {error || helperText}
            </p>
          </div>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

export { Input };
export default Input;