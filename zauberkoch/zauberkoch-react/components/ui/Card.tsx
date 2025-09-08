'use client';

import React, { HTMLAttributes, forwardRef } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { cn } from '@/lib/utils';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'outlined' | 'elevated' | 'filled' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  animate?: boolean;
  clickable?: boolean;
  glow?: boolean;
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
      children,
      ...props
    },
    ref
  ) => {
    const baseClasses = `
      rounded-lg
      transition-all
      duration-300
      ease-out
      relative
      overflow-hidden
    `;

    // Variant styles with dark theme
    const variantClasses = {
      default: `
        bg-card-background
        border border-outline/20
        shadow-md
        ${hoverable ? 'hover:shadow-xl hover:border-accent-blue/20' : ''}
      `,
      outlined: `
        bg-transparent
        border-2 border-outline/40
        ${hoverable ? 'hover:border-accent-blue/60 hover:bg-card-background/50' : ''}
      `,
      elevated: `
        bg-card-background
        shadow-xl
        border border-outline/10
        ${hoverable ? 'hover:shadow-2xl hover:translate-y-[-4px]' : ''}
      `,
      filled: `
        bg-surface-variant
        border-0
        ${hoverable ? 'hover:bg-surface' : ''}
      `,
      glass: `
        bg-card-background/40
        backdrop-blur-xl
        border border-white/10
        shadow-xl
        ${hoverable ? 'hover:bg-card-background/60 hover:shadow-2xl' : ''}
      `,
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
      clickable && `
        cursor-pointer
        select-none
        active:scale-[0.98]
      `,
      glow && 'shadow-[0_0_30px_rgba(104,141,177,0.3)]',
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