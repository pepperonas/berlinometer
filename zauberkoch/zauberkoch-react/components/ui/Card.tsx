'use client';

import React, { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'elevated' | 'glass' | 'minimal' | 'interactive' | 'glow';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  animate?: boolean;
  clickable?: boolean;
  glow?: boolean;
  blur?: boolean;
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
      glow = false,
      blur = false,
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = 'card';

    // Variant styles using new CSS classes
    const variantClasses = {
      default: '',
      elevated: 'card-elevated',
      glass: 'card-glass',
      minimal: 'card-minimal',
      interactive: 'card-interactive',
      glow: 'card-glow',
    };

    // Padding styles
    const paddingClasses = {
      none: 'p-0',
      sm: 'p-4',
      md: '', // Default padding from CSS
      lg: 'p-8',
    };

    const classes = cn(
      baseClasses,
      variantClasses[variant],
      paddingClasses[padding],
      clickable && 'card-interactive',
      glow && 'card-glow',
      blur && 'backdrop-blur-xl',
      className
    );

    const motionProps: HTMLMotionProps<'div'> = animate
      ? {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          whileHover: hoverable || clickable ? { 
            y: -2,
            transition: { duration: 0.2 }
          } : undefined,
          whileTap: clickable ? { scale: 0.98 } : undefined,
          transition: { duration: 0.3 },
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
        {/* Gradient top border */}
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-accent-blue/30 to-transparent" />
        
        {/* Optional glow effect */}
        {glow && (
          <div className="absolute inset-0 bg-gradient-to-br from-accent-blue/10 via-transparent to-accent-green/10 opacity-50 pointer-events-none" />
        )}
        
        {children}
      </CardComponent>
    );
  }
);

Card.displayName = 'Card';

// Card subcomponents with dark theme styling
const CardHeader = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex flex-col space-y-1.5 pb-6',
        'border-b border-outline/20',
        className
      )}
      {...props}
    />
  )
);
CardHeader.displayName = 'CardHeader';

const CardTitle = forwardRef<HTMLHeadingElement, HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3
      ref={ref}
      className={cn(
        'text-2xl font-semibold leading-none tracking-tight',
        'text-text-primary',
        'bg-gradient-to-r from-text-primary to-accent-blue bg-clip-text',
        className
      )}
      {...props}
    />
  )
);
CardTitle.displayName = 'CardTitle';

const CardDescription = forwardRef<HTMLParagraphElement, HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => (
    <p
      ref={ref}
      className={cn(
        'text-sm text-text-secondary',
        'leading-relaxed',
        className
      )}
      {...props}
    />
  )
);
CardDescription.displayName = 'CardDescription';

const CardContent = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'pt-6',
        'text-text-secondary',
        className
      )}
      {...props}
    />
  )
);
CardContent.displayName = 'CardContent';

const CardFooter = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'flex items-center pt-6',
        'border-t border-outline/20',
        'mt-6',
        className
      )}
      {...props}
    />
  )
);
CardFooter.displayName = 'CardFooter';

// Additional card variants
const CardImage = forwardRef<HTMLDivElement, HTMLAttributes<HTMLDivElement>>(
  ({ className, children, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative overflow-hidden rounded-t-lg',
        '-mx-6 -mt-6 mb-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
);
CardImage.displayName = 'CardImage';

const CardBadge = forwardRef<HTMLSpanElement, HTMLAttributes<HTMLSpanElement>>(
  ({ className, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center px-3 py-1',
        'text-xs font-semibold',
        'bg-accent-blue/20 text-accent-blue',
        'border border-accent-blue/30',
        'rounded-full',
        className
      )}
      {...props}
    />
  )
);
CardBadge.displayName = 'CardBadge';

export { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardImage,
  CardBadge
};

export default Card;