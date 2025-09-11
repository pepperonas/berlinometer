'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface SliderWithValueProps {
  id: string;
  label: string;
  icon?: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  formatValue?: (value: number) => string;
  minLabel?: string;
  maxLabel?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function SliderWithValue({
  id,
  label,
  icon,
  value,
  onChange,
  min,
  max,
  step = 1,
  unit,
  formatValue,
  minLabel,
  maxLabel,
  description,
  disabled = false,
  className
}: SliderWithValueProps) {
  const percentage = ((value - min) / (max - min)) * 100;
  
  const displayValue = formatValue ? formatValue(value) : `${value}${unit ? ` ${unit}` : ''}`;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!disabled) {
      onChange(Number(e.target.value));
    }
  };

  return (
    <motion.div
      className={cn('space-y-4', className)}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {icon && <span className="text-xl">{icon}</span>}
          <div>
            <label 
              htmlFor={id}
              className="text-sm font-semibold text-gray-900 block"
            >
              {label}
            </label>
            {description && (
              <p className="text-xs text-gray-600 mt-1">{description}</p>
            )}
          </div>
        </div>
        
        {/* Current Value Display */}
        <motion.div
          className="bg-amber-100 text-amber-800 px-4 py-2 rounded-full text-sm font-bold"
          key={value} // Re-animate when value changes
          initial={{ scale: 1.1 }}
          animate={{ scale: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        >
          {displayValue}
        </motion.div>
      </div>

      {/* Slider Container - Enhanced for mobile */}
      <div className="relative py-2">
        {/* Slider Track - Larger for touch */}
        <div className="relative h-4 md:h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          {/* Progress Track */}
          <motion.div
            className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 to-yellow-400 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${percentage}%` }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          />
          
          {/* Enhanced Slider Input for Mobile */}
          <input
            type="range"
            id={id}
            min={min}
            max={max}
            step={step}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            className={cn(
              'absolute top-0 left-0 w-full h-full appearance-none bg-transparent cursor-pointer',
              'focus:outline-none focus:ring-4 focus:ring-amber-500 focus:ring-opacity-30 rounded-full',
              'transition-all duration-200',
              disabled && 'cursor-not-allowed opacity-50',
              // Enhanced mobile-friendly slider styling
              '[&::-webkit-slider-thumb]:appearance-none',
              '[&::-webkit-slider-thumb]:w-8 [&::-webkit-slider-thumb]:h-8 md:[&::-webkit-slider-thumb]:w-6 md:[&::-webkit-slider-thumb]:h-6',
              '[&::-webkit-slider-thumb]:rounded-full',
              '[&::-webkit-slider-thumb]:bg-white',
              '[&::-webkit-slider-thumb]:border-4 [&::-webkit-slider-thumb]:border-amber-400',
              '[&::-webkit-slider-thumb]:shadow-xl',
              '[&::-webkit-slider-thumb]:cursor-pointer',
              '[&::-webkit-slider-thumb]:hover:bg-amber-50',
              '[&::-webkit-slider-thumb]:hover:border-amber-500',
              '[&::-webkit-slider-thumb]:hover:shadow-2xl',
              '[&::-webkit-slider-thumb]:active:scale-110',
              '[&::-webkit-slider-thumb]:transition-all [&::-webkit-slider-thumb]:duration-150',
              // Enhanced Firefox support
              '[&::-moz-range-thumb]:w-8 [&::-moz-range-thumb]:h-8 md:[&::-moz-range-thumb]:w-6 md:[&::-moz-range-thumb]:h-6',
              '[&::-moz-range-thumb]:rounded-full',
              '[&::-moz-range-thumb]:bg-white',
              '[&::-moz-range-thumb]:border-4 [&::-moz-range-thumb]:border-amber-400',
              '[&::-moz-range-thumb]:shadow-xl',
              '[&::-moz-range-thumb]:cursor-pointer',
              '[&::-moz-range-thumb]:border-none [&::-moz-range-thumb]:appearance-none',
              '[&::-moz-range-track]:bg-transparent'
            )}
          />
        </div>

        {/* Enhanced Value Indicator for Mobile */}
        <motion.div
          className="absolute top-1/2 transform -translate-y-1/2 w-8 h-8 md:w-6 md:h-6 bg-white border-4 border-amber-400 rounded-full shadow-xl pointer-events-none"
          animate={{ 
            left: `calc(${percentage}% - 16px)`,
            scale: [1, 1.1, 1]
          }}
          transition={{ 
            left: { duration: 0.3, ease: "easeOut" },
            scale: { duration: 0.6, ease: "easeInOut" }
          }}
        >
          {/* Pulse effect when dragging */}
          <motion.div
            className="absolute inset-0 bg-amber-400 rounded-full opacity-30"
            animate={{
              scale: [1, 1.5, 1],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />
        </motion.div>
      </div>

      {/* Min/Max Labels */}
      {(minLabel || maxLabel) && (
        <div className="flex justify-between text-xs text-gray-500 px-1">
          <span>{minLabel || min}</span>
          <span>{maxLabel || max}</span>
        </div>
      )}

      {/* Refined Value Steps Indicators - only show reasonable amount */}
      <div className="relative flex justify-between px-1">
        {Array.from({ length: Math.min(8, Math.floor((max - min) / step) + 1) }, (_, i) => {
          const totalSteps = Math.min(8, Math.floor((max - min) / step) + 1);
          const stepValue = min + (i * (max - min) / (totalSteps - 1));
          const isActive = stepValue <= value;
          
          return (
            <motion.div
              key={i}
              className={cn(
                'w-2 h-2 rounded-full transition-colors duration-200 cursor-pointer',
                isActive ? 'bg-amber-400 shadow-lg' : 'bg-gray-300 hover:bg-gray-400'
              )}
              animate={{
                scale: isActive ? 1.3 : 1,
                backgroundColor: isActive ? '#f59e0b' : '#d1d5db'
              }}
              whileHover={{ scale: 1.2 }}
              whileTap={{ scale: 0.9 }}
              transition={{ duration: 0.2 }}
              onClick={() => !disabled && onChange(Math.round(stepValue))}
            />
          );
        })}
      </div>
    </motion.div>
  );
}

export default SliderWithValue;