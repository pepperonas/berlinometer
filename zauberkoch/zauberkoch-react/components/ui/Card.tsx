'use client';

import React, { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  animate?: boolean;
  clickable?: boolean;
}

const Card = forwardRef<HTMLDivElement, CardProps>(
  (
    {
      className,
      variant = 'default',
      padding = 'md',
      hoverable = false,
      animate = true,
      clickable = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = [
      'rounded-xl',
      'transition-all',
      'duration-200',
      'ease-in-out',
    ];

    // Variant styles
    const variantClasses = {
      default: [
        'bg-surface',
        'border',
        'border-outline',
        hoverable && 'hover:shadow-md',
      ],
      outlined: [
        'bg-transparent',
        'border-2',
        'border-outline',
        hoverable && 'hover:border-primary',
      ],
      elevated: [
        'bg-surface',
        'shadow-md',
        hoverable && 'hover:shadow-lg',
      ],
      filled: [
        'bg-surface-variant',
        'border-0',
        hoverable && 'hover:bg-surface',
      ],
    };

    // Padding styles
    const paddingClasses = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      clickable && [
        'cursor-pointer',
        'select-none',
        'active:scale-[0.98]',
        'hover:scale-[1.01]',
      ],
      className
    );

    const motionProps: HTMLMotionProps<'div'> = animate
      ? {
          whileHover: hoverable || clickable ? { y: -2 } : undefined,
          whileTap: clickable ? { scale: 0.98 } : undefined,
          transition: { duration: 0.2 },
        }
      : {};

    const CardComponent = animate ? motion.div : 'div';

    return (
      <CardComponent
        ref={ref}
        className={classes}
        {...(animate ? motionProps : {})}
        {...props}
      >
        {children}
      </CardComponent>
    );
  }
);

Card.displayName = 'Card';

// Card subcomponents
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex flex-col space-y-1.5 pb-4', className)}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn('text-xl font-semibold leading-none tracking-tight', className)}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn('text-sm text-on-surface-variant', className)}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('pt-0', className)}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn('flex items-center pt-4', className)}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

export { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
};

export default Card;