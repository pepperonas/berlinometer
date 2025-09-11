'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface RadioOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface RadioGroupProps {
  name: string;
  value: string;
  onChange: (value: string) => void;
  options: RadioOption[];
  label?: string;
  description?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
}

export function RadioGroup({
  name,
  value,
  onChange,
  options,
  label,
  description,
  layout = 'horizontal',
  size = 'md',
  disabled = false,
  className
}: RadioGroupProps) {
  const containerClasses = cn(
    'space-y-4',
    className
  );

  const gridClasses = cn(
    'gap-4',
    layout === 'horizontal' && 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    layout === 'vertical' && 'flex flex-col',
    layout === 'grid' && 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3'
  );

  const optionClasses = cn(
    'group relative cursor-pointer',
    'border-2 rounded-2xl transition-all duration-300',
    'hover:shadow-lg hover:scale-[1.02]',
    size === 'sm' && 'p-4',
    size === 'md' && 'p-6',
    size === 'lg' && 'p-8',
    disabled && 'opacity-50 cursor-not-allowed'
  );

  const getOptionStyles = (optionValue: string) => {
    const isSelected = value === optionValue;
    
    return cn(
      optionClasses,
      isSelected
        ? 'border-amber-400 bg-amber-50 shadow-amber-200/50 shadow-lg'
        : 'border-gray-200 bg-white hover:border-amber-200 hover:bg-amber-25',
      disabled && 'hover:scale-100 hover:shadow-none'
    );
  };

  return (
    <div className={containerClasses}>
      {label && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            {label}
          </h3>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      
      <div className={gridClasses}>
        {options.map((option, index) => (
          <motion.label
            key={option.value}
            className={getOptionStyles(option.value)}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileHover={!disabled ? { y: -2 } : {}}
            whileTap={!disabled ? { scale: 0.98 } : {}}
          >
            <input
              type="radio"
              name={name}
              value={option.value}
              checked={value === option.value}
              onChange={(e) => !disabled && onChange(e.target.value)}
              className="sr-only"
              disabled={disabled}
            />
            
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                {option.icon && (
                  <span className="text-2xl">{option.icon}</span>
                )}
                <div>
                  <div className={cn(
                    'font-medium transition-colors',
                    value === option.value 
                      ? 'text-amber-800' 
                      : 'text-gray-900 group-hover:text-amber-700'
                  )}>
                    {option.label}
                  </div>
                  {option.description && (
                    <div className={cn(
                      'text-sm mt-1 transition-colors',
                      value === option.value 
                        ? 'text-amber-600' 
                        : 'text-gray-500 group-hover:text-amber-600'
                    )}>
                      {option.description}
                    </div>
                  )}
                </div>
              </div>
              
              {/* Selection indicator */}
              <div className={cn(
                'w-5 h-5 rounded-full border-2 transition-all duration-200',
                'flex items-center justify-center',
                value === option.value
                  ? 'border-amber-400 bg-amber-400'
                  : 'border-gray-300 group-hover:border-amber-300'
              )}>
                {value === option.value && (
                  <motion.div
                    className="w-2 h-2 rounded-full bg-white"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 500, 
                      damping: 30 
                    }}
                  />
                )}
              </div>
            </div>
            
            {/* Hover/Selected overlay */}
            <div className={cn(
              'absolute inset-0 rounded-2xl transition-all duration-300',
              'bg-gradient-to-r from-amber-50/50 to-yellow-50/50',
              value === option.value
                ? 'opacity-100'
                : 'opacity-0 group-hover:opacity-100'
            )} />
          </motion.label>
        ))}
      </div>
    </div>
  );
}

export default RadioGroup;