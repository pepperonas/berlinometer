'use client';

import React, { useState, KeyboardEvent, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface TagInputProps {
  label: string;
  icon?: string;
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  description?: string;
  maxTags?: number;
  disabled?: boolean;
  className?: string;
  suggestions?: string[];
}

export function TagInput({
  label,
  icon,
  value,
  onChange,
  placeholder = 'Tag eingeben...',
  description,
  maxTags,
  disabled = false,
  className,
  suggestions = []
}: TagInputProps) {
  const [inputValue, setInputValue] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const filteredSuggestions = suggestions.filter(
    suggestion =>
      suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
      !value.includes(suggestion) &&
      inputValue.length > 0
  );

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Backspace' && inputValue === '' && value.length > 0) {
      // Remove last tag when backspace is pressed on empty input
      removeTag(value.length - 1);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  };

  const addTag = (tagToAdd?: string) => {
    const newTag = (tagToAdd || inputValue.trim()).toLowerCase();
    
    if (
      newTag &&
      !value.map(tag => tag.toLowerCase()).includes(newTag) &&
      (!maxTags || value.length < maxTags)
    ) {
      onChange([...value, tagToAdd || inputValue.trim()]);
      setInputValue('');
      setShowSuggestions(false);
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(value.filter((_, index) => index !== indexToRemove));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setShowSuggestions(newValue.length > 0 && filteredSuggestions.length > 0);
  };

  const handleSuggestionClick = (suggestion: string) => {
    addTag(suggestion);
    inputRef.current?.focus();
  };

  return (
    <div className={cn('space-y-3', className)}>
      {/* Label */}
      <div className="flex items-center gap-3">
        {icon && <span className="text-xl">{icon}</span>}
        <div>
          <label className="text-sm font-semibold text-gray-900 block">
            {label}
          </label>
          {description && (
            <p className="text-xs text-gray-600 mt-1">{description}</p>
          )}
          {maxTags && (
            <p className="text-xs text-gray-500">
              {value.length}/{maxTags} Tags
            </p>
          )}
        </div>
      </div>

      {/* Input Container */}
      <div className="relative">
        <div
          className={cn(
            'min-h-[60px] w-full px-4 py-3 border-2 rounded-2xl transition-all duration-200',
            'bg-white focus-within:border-orange-400 focus-within:shadow-lg focus-within:shadow-orange-200/50',
            'flex flex-wrap items-center gap-2',
            disabled ? 'bg-gray-50 border-gray-200 cursor-not-allowed' : 'border-gray-200 hover:border-orange-200'
          )}
          onClick={() => !disabled && inputRef.current?.focus()}
        >
          {/* Existing Tags */}
          <AnimatePresence>
            {value.map((tag, index) => (
              <motion.span
                key={`${tag}-${index}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.2 }}
                className="inline-flex items-center gap-2 bg-orange-100 text-orange-800 px-3 py-1.5 rounded-full text-sm font-medium"
              >
                <span>{tag}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeTag(index);
                    }}
                    className="text-orange-600 hover:text-orange-800 transition-colors ml-1"
                  >
                    <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </motion.span>
            ))}
          </AnimatePresence>

          {/* Input Field */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(inputValue.length > 0 && filteredSuggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
            placeholder={value.length === 0 ? placeholder : ''}
            disabled={disabled || (maxTags ? value.length >= maxTags : false)}
            className={cn(
              'flex-1 min-w-[120px] outline-none bg-transparent',
              'placeholder:text-gray-400',
              disabled && 'cursor-not-allowed'
            )}
          />
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {showSuggestions && filteredSuggestions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-xl shadow-lg z-50 max-h-40 overflow-y-auto"
            >
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSuggestionClick(suggestion)}
                  className={cn(
                    'w-full px-4 py-3 text-left hover:bg-orange-50 transition-colors',
                    'text-sm text-gray-700 hover:text-orange-800',
                    index === 0 && 'rounded-t-xl',
                    index === filteredSuggestions.length - 1 && 'rounded-b-xl'
                  )}
                >
                  {suggestion}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Helper Text */}
      <div className="flex justify-between items-center text-xs text-gray-500">
        <span>
          {inputValue && (
            <>
              Drücke <kbd className="px-1 py-0.5 bg-gray-100 rounded">Enter</kbd> oder{' '}
              <kbd className="px-1 py-0.5 bg-gray-100 rounded">,</kbd> zum Hinzufügen
            </>
          )}
        </span>
        <span>
          {maxTags && `${value.length}/${maxTags}`}
        </span>
      </div>
    </div>
  );
}

export default TagInput;