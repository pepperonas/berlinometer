'use client';

import { useState, useCallback, ChangeEvent, FormEvent } from 'react';

export interface ValidationRule<T = any> {
  required?: boolean | string;
  minLength?: number | { value: number; message: string };
  maxLength?: number | { value: number; message: string };
  pattern?: RegExp | { value: RegExp; message: string };
  validate?: (value: T) => string | boolean;
  custom?: (value: T, allValues: Record<string, any>) => string | boolean;
}

export interface FieldConfig {
  [key: string]: ValidationRule;
}

export interface FormState<T = Record<string, any>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
}

export interface UseFormOptions<T = Record<string, any>> {
  initialValues: T;
  validationSchema?: FieldConfig;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  onSubmit?: (values: T) => Promise<void> | void;
}

export interface UseFormReturn<T = Record<string, any>> {
  values: T;
  errors: Record<string, string>;
  touched: Record<string, boolean>;
  isSubmitting: boolean;
  isValid: boolean;
  handleChange: (name: keyof T) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string) => void;
  handleBlur: (name: keyof T) => () => void;
  handleSubmit: (e: FormEvent<HTMLFormElement>) => void;
  setFieldValue: (name: keyof T, value: any) => void;
  setFieldError: (name: keyof T, error: string) => void;
  setFieldTouched: (name: keyof T, touched?: boolean) => void;
  validateField: (name: keyof T) => void;
  validateForm: () => boolean;
  resetForm: () => void;
  resetField: (name: keyof T) => void;
}

export function useForm<T extends Record<string, any>>({
  initialValues,
  validationSchema = {},
  validateOnChange = true,
  validateOnBlur = true,
  onSubmit,
}: UseFormOptions<T>): UseFormReturn<T> {
  const [state, setState] = useState<FormState<T>>({
    values: initialValues,
    errors: {},
    touched: {},
    isSubmitting: false,
    isValid: true,
  });

  // Validate a single field
  const validateField = useCallback((name: keyof T): string => {
    const value = state.values[name];
    const rules = validationSchema[name as string];
    
    if (!rules) return '';

    // Required validation
    if (rules.required) {
      const message = typeof rules.required === 'string' ? rules.required : `${String(name)} ist erforderlich`;
      if (value === undefined || value === null || value === '') {
        return message;
      }
    }

    // Skip other validations if value is empty and not required
    if (value === undefined || value === null || value === '') {
      return '';
    }

    // MinLength validation
    if (rules.minLength) {
      const config = typeof rules.minLength === 'number' 
        ? { value: rules.minLength, message: `${String(name)} muss mindestens ${rules.minLength} Zeichen lang sein` }
        : rules.minLength;
      
      if (String(value).length < config.value) {
        return config.message;
      }
    }

    // MaxLength validation
    if (rules.maxLength) {
      const config = typeof rules.maxLength === 'number'
        ? { value: rules.maxLength, message: `${String(name)} darf maximal ${rules.maxLength} Zeichen lang sein` }
        : rules.maxLength;
      
      if (String(value).length > config.value) {
        return config.message;
      }
    }

    // Pattern validation
    if (rules.pattern) {
      const config = rules.pattern instanceof RegExp
        ? { value: rules.pattern, message: `${String(name)} hat ein ungültiges Format` }
        : rules.pattern;
      
      if (!config.value.test(String(value))) {
        return config.message;
      }
    }

    // Custom validation function
    if (rules.validate) {
      const result = rules.validate(value);
      if (typeof result === 'string') {
        return result;
      } else if (result === false) {
        return `${String(name)} ist ungültig`;
      }
    }

    // Cross-field validation
    if (rules.custom) {
      const result = rules.custom(value, state.values);
      if (typeof result === 'string') {
        return result;
      } else if (result === false) {
        return `${String(name)} ist ungültig`;
      }
    }

    return '';
  }, [state.values, validationSchema]);

  // Validate all fields
  const validateForm = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    let isFormValid = true;

    Object.keys(validationSchema).forEach((fieldName) => {
      const error = validateField(fieldName as keyof T);
      if (error) {
        newErrors[fieldName] = error;
        isFormValid = false;
      }
    });

    setState(prev => ({
      ...prev,
      errors: newErrors,
      isValid: isFormValid,
    }));

    return isFormValid;
  }, [validateField, validationSchema]);

  // Handle input change
  const handleChange = useCallback((name: keyof T) => {
    return (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement> | string) => {
      const value = typeof e === 'string' ? e : e.target.value;
      
      setState(prev => {
        const newValues = { ...prev.values, [name]: value };
        const newState = { ...prev, values: newValues };
        
        if (validateOnChange && validationSchema[name as string]) {
          const error = validateField(name);
          newState.errors = { ...prev.errors, [name]: error };
          
          // Update isValid based on all errors
          const allErrors = { ...newState.errors };
          newState.isValid = Object.values(allErrors).every(err => !err);
        }
        
        return newState;
      });
    };
  }, [validateField, validateOnChange, validationSchema]);

  // Handle input blur
  const handleBlur = useCallback((name: keyof T) => {
    return () => {
      setState(prev => {
        const newTouched = { ...prev.touched, [name]: true };
        let newErrors = prev.errors;
        let newIsValid = prev.isValid;
        
        if (validateOnBlur && validationSchema[name as string]) {
          const error = validateField(name);
          newErrors = { ...prev.errors, [name]: error };
          newIsValid = Object.values(newErrors).every(err => !err);
        }
        
        return {
          ...prev,
          touched: newTouched,
          errors: newErrors,
          isValid: newIsValid,
        };
      });
    };
  }, [validateField, validateOnBlur, validationSchema]);

  // Handle form submission
  const handleSubmit = useCallback((e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!onSubmit) return;
    
    setState(prev => ({ ...prev, isSubmitting: true }));
    
    const isValid = validateForm();
    if (!isValid) {
      setState(prev => ({ ...prev, isSubmitting: false }));
      return;
    }
    
    Promise.resolve(onSubmit(state.values))
      .finally(() => {
        setState(prev => ({ ...prev, isSubmitting: false }));
      });
  }, [onSubmit, state.values, validateForm]);

  // Set field value programmatically
  const setFieldValue = useCallback((name: keyof T, value: any) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: value },
    }));
  }, []);

  // Set field error programmatically
  const setFieldError = useCallback((name: keyof T, error: string) => {
    setState(prev => ({
      ...prev,
      errors: { ...prev.errors, [name]: error },
      isValid: error ? false : Object.values({ ...prev.errors, [name]: error }).every(err => !err),
    }));
  }, []);

  // Set field touched programmatically
  const setFieldTouched = useCallback((name: keyof T, touched: boolean = true) => {
    setState(prev => ({
      ...prev,
      touched: { ...prev.touched, [name]: touched },
    }));
  }, []);

  // Reset entire form
  const resetForm = useCallback(() => {
    setState({
      values: initialValues,
      errors: {},
      touched: {},
      isSubmitting: false,
      isValid: true,
    });
  }, [initialValues]);

  // Reset single field
  const resetField = useCallback((name: keyof T) => {
    setState(prev => ({
      ...prev,
      values: { ...prev.values, [name]: initialValues[name] },
      errors: { ...prev.errors, [name]: '' },
      touched: { ...prev.touched, [name]: false },
    }));
  }, [initialValues]);

  return {
    values: state.values,
    errors: state.errors,
    touched: state.touched,
    isSubmitting: state.isSubmitting,
    isValid: state.isValid,
    handleChange,
    handleBlur,
    handleSubmit,
    setFieldValue,
    setFieldError,
    setFieldTouched,
    validateField: (name: keyof T) => {
      const error = validateField(name);
      setState(prev => ({
        ...prev,
        errors: { ...prev.errors, [name]: error },
        isValid: error ? false : Object.values({ ...prev.errors, [name]: error }).every(err => !err),
      }));
    },
    validateForm,
    resetForm,
    resetField,
  };
}

// Validation helpers
export const validationRules = {
  required: (message?: string) => ({
    required: message || 'Dieses Feld ist erforderlich',
  }),
  
  email: (message?: string) => ({
    pattern: {
      value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      message: message || 'Bitte gib eine gültige E-Mail-Adresse ein',
    },
  }),
  
  minLength: (length: number, message?: string) => ({
    minLength: {
      value: length,
      message: message || `Mindestens ${length} Zeichen erforderlich`,
    },
  }),
  
  maxLength: (length: number, message?: string) => ({
    maxLength: {
      value: length,
      message: message || `Maximal ${length} Zeichen erlaubt`,
    },
  }),
  
  password: (message?: string) => ({
    minLength: 8,
    validate: (value: string) => {
      if (!/(?=.*[a-z])/.test(value)) {
        return message || 'Passwort muss mindestens einen Kleinbuchstaben enthalten';
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        return message || 'Passwort muss mindestens einen Großbuchstaben enthalten';
      }
      if (!/(?=.*\d)/.test(value)) {
        return message || 'Passwort muss mindestens eine Zahl enthalten';
      }
      if (!/(?=.*[!@#$%^&*])/.test(value)) {
        return message || 'Passwort muss mindestens ein Sonderzeichen enthalten (!@#$%^&*)';
      }
      return true;
    },
  }),
  
  confirmPassword: (passwordField: string = 'password', message?: string) => ({
    custom: (value: string, allValues: Record<string, any>) => {
      if (value !== allValues[passwordField]) {
        return message || 'Passwörter stimmen nicht überein';
      }
      return true;
    },
  }),
  
  username: (message?: string) => ({
    minLength: 3,
    maxLength: 20,
    pattern: {
      value: /^[a-zA-Z0-9_]+$/,
      message: message || 'Benutzername darf nur Buchstaben, Zahlen und Unterstriche enthalten',
    },
  }),
  
  custom: (validator: (value: any, allValues?: Record<string, any>) => string | boolean) => ({
    validate: validator,
  }),
  
  number: (min?: number, max?: number, message?: string) => ({
    validate: (value: string | number) => {
      const num = typeof value === 'string' ? parseFloat(value) : value;
      if (isNaN(num)) {
        return message || 'Bitte gib eine gültige Zahl ein';
      }
      if (min !== undefined && num < min) {
        return `Der Wert muss mindestens ${min} sein`;
      }
      if (max !== undefined && num > max) {
        return `Der Wert darf maximal ${max} sein`;
      }
      return true;
    },
  }),
};

export default useForm;