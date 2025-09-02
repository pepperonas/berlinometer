import { CSSProperties } from 'react';
import { MotionStyle } from 'framer-motion';

declare module 'framer-motion' {
  interface MotionStyle extends Omit<CSSProperties, 'accentColor'> {
    accentColor?: CSSProperties['accentColor'] | MotionValue<any> | string;
  }
}

export {};