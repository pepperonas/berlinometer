'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CheckboxOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

export interface CheckboxGroupProps {
  name: string;
  values: string[];
  onChange: (values: string[]) => void;
  options: CheckboxOption[];
  label?: string;
  description?: string;
  layout?: 'horizontal' | 'vertical' | 'grid';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  maxSelections?: number;
  minSelections?: number;
}

export function CheckboxGroup({
  name,
  values,
  onChange,
  options,
  label,
  description,
  layout = 'grid',
  size = 'md',
  disabled = false,
  className,
  maxSelections,
  minSelections = 0
}: CheckboxGroupProps) {
  const handleToggle = (optionValue: string) => {
    if (disabled) return;

    const isSelected = values.includes(optionValue);
    let newValues: string[];

    if (isSelected) {
      // Don't allow deselection if it would go below minimum
      if (minSelections > 0 && values.length <= minSelections) {
        return;
      }
      newValues = values.filter(v => v !== optionValue);
    } else {
      // Don't allow selection if it would exceed maximum
      if (maxSelections && values.length >= maxSelections) {
        return;
      }
      newValues = [...values, optionValue];
    }

    onChange(newValues);
  };

  const containerClasses = cn(
    'space-y-4',
    className
  );

  const gridClasses = cn(
    'gap-4',
    layout === 'horizontal' && 'flex flex-wrap',
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
    const isSelected = values.includes(optionValue);
    const canToggle = !disabled && (
      !isSelected || (isSelected && (minSelections === 0 || values.length > minSelections))
    ) && (
      isSelected || (!isSelected && (!maxSelections || values.length < maxSelections))
    );
    
    return cn(
      optionClasses,
      isSelected
        ? 'border-green-400 bg-green-50 shadow-green-200/50 shadow-lg'
        : 'border-gray-200 bg-white hover:border-green-200 hover:bg-green-25',
      !canToggle && 'opacity-60 cursor-not-allowed',
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
          {(maxSelections || minSelections > 0) && (
            <p className="text-xs text-gray-500">
              {minSelections > 0 && maxSelections ? (
                `Wähle ${minSelections}-${maxSelections} Optionen`
              ) : maxSelections ? (
                `Maximal ${maxSelections} Optionen`
              ) : minSelections > 0 ? (
                `Mindestens ${minSelections} Optionen`
              ) : null}
              {' '}({values.length} gewählt)
            </p>
          )}
        </div>
      )}
      
      <div className={gridClasses}>
        {options.map((option, index) => {
          const isSelected = values.includes(option.value);
          const canToggle = !disabled && (
            isSelected ? (minSelections === 0 || values.length > minSelections) : (!maxSelections || values.length < maxSelections)
          );

          return (
            <motion.div
              key={option.value}
              className={getOptionStyles(option.value)}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              whileHover={canToggle ? { y: -2 } : {}}
              whileTap={canToggle ? { scale: 0.98 } : {}}
              onClick={() => canToggle && handleToggle(option.value)}
              role="checkbox"
              aria-checked={isSelected}
              tabIndex={0}
              onKeyDown={(e) => {
                if ((e.key === 'Enter' || e.key === ' ') && canToggle) {
                  e.preventDefault();
                  handleToggle(option.value);
                }
              }}
            >
              <input
                type="checkbox"
                name={name}
                value={option.value}
                checked={isSelected}
                onChange={() => {}} // Controlled by handleToggle
                className="sr-only"
                disabled={!canToggle}
              />
              
              <div className="flex items-center justify-between w-full">
                <div className="flex items-center gap-3">
                  {option.icon && (
                    <span className="text-2xl">{option.icon}</span>
                  )}
                  <div>
                    <div className={cn(
                      'font-medium transition-colors',
                      isSelected 
                        ? 'text-green-800' 
                        : 'text-gray-900 group-hover:text-green-700'
                    )}>
                      {option.label}
                    </div>
                    {option.description && (
                      <div className={cn(
                        'text-sm mt-1 transition-colors',
                        isSelected 
                          ? 'text-green-600' 
                          : 'text-gray-500 group-hover:text-green-600'
                      )}>
                        {option.description}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Checkbox indicator */}
                <div className={cn(
                  'w-6 h-6 rounded-lg border-2 transition-all duration-200',
                  'flex items-center justify-center',
                  isSelected
                    ? 'border-green-400 bg-green-400'
                    : 'border-gray-300 group-hover:border-green-300'
                )}>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ 
                        type: "spring", 
                        stiffness: 500, 
                        damping: 30 
                      }}
                    >
                      <svg 
                        className="w-4 h-4 text-white" 
                        fill="none" 
                        viewBox="0 0 24 24" 
                        stroke="currentColor"
                        strokeWidth={3}
                      >
                        <path 
                          strokeLinecap="round" 
                          strokeLinejoin="round" 
                          d="M5 13l4 4L19 7" 
                        />
                      </svg>
                    </motion.div>
                  )}
                </div>
              </div>
              
              {/* Hover/Selected overlay */}
              <div className={cn(
                'absolute inset-0 rounded-2xl transition-all duration-300',
                'bg-gradient-to-r from-green-50/50 to-emerald-50/50',
                isSelected
                  ? 'opacity-100'
                  : 'opacity-0 group-hover:opacity-100'
              )} />
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export default CheckboxGroup;