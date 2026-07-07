// components/button/ButtonConfig.ts
import { ReactNode, ElementType, MouseEvent } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'black'
  | 'outline'
  | 'danger'
  | 'ghost'
  | 'subtle'
  | 'warning'
  | 'success'
  | 'info'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'orange'
  | 'teal'
  | 'dark'
  | 'light'
  | 'gradientBlue'
  | 'gradientGreen'
  | 'gradientPurple'
  | 'gradientSunset'
  | 'outlineBlue'
  | 'outlineGreen'
  | 'outlineRed'
  | 'outlinePurple';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: ReactNode;
  onClick?: (event: MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  className?: string;
  color?: string;
  bgColor?: string;
  hoverColor?: string;
  focusRingColor?: string;
  icon?: ElementType;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  iconColor?: string;
  tooltip?: string;
}

/* Shared base styles */
export const baseClasses =
  'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-100 disabled:cursor-not-allowed';

/* Sizes */
export const sizeClasses: Record<ButtonSize, string> = {
  sm: 'px-3 py-1.5 text-sm gap-1.5',
  md: 'px-4 py-2 text-sm gap-2',
  lg: 'px-6 py-3 text-base gap-2.5',
};

/* Variants */
export const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-[#c3195d] hover:bg-[#a5124b] text-white border-transparent',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
  outline: 'border border-gray-300 text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
  ghost: 'text-gray-700 hover:bg-gray-100 focus:ring-blue-500',
  subtle: 'bg-gray-100 text-gray-800 hover:bg-gray-200 focus:ring-gray-300',
  danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
  warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400',
  success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
  info: 'bg-sky-500 text-white hover:bg-sky-600 focus:ring-sky-400',
  indigo: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
  purple: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
  pink: 'bg-pink-500 text-white hover:bg-pink-600 focus:ring-pink-400',
  orange: 'bg-orange-500 text-white hover:bg-orange-600 focus:ring-orange-400',
  teal: 'bg-teal-500 text-white hover:bg-teal-600 focus:ring-teal-400',
  dark: 'bg-black text-white hover:bg-gray-500 focus:ring-gray-00',
  light: 'bg-white text-gray-800 border border-gray-300 hover:bg-gray-50 focus:ring-gray-200',
  black: 'bg-black text-white hover:bg-gray-900 focus:ring-gray-800',
  gradientBlue:
    'bg-gradient-to-r from-blue-500 to-blue-700 text-white hover:from-blue-600 hover:to-blue-800 focus:ring-blue-400',
  gradientGreen:
    'bg-gradient-to-r from-green-500 to-emerald-700 text-white hover:from-green-600 hover:to-emerald-800 focus:ring-green-400',
  gradientPurple:
    'bg-gradient-to-r from-purple-500 to-indigo-700 text-white hover:from-purple-600 hover:to-indigo-800 focus:ring-purple-400',
  gradientSunset:
    'bg-gradient-to-r from-pink-500 via-red-500 to-yellow-500 text-white hover:from-pink-600 hover:via-red-600 hover:to-yellow-600 focus:ring-pink-400',
  outlineBlue: 'border border-blue-600 text-blue-600 hover:bg-blue-50 focus:ring-blue-500',
  outlineGreen: 'border border-green-600 text-green-600 hover:bg-green-50 focus:ring-green-500',
  outlineRed: 'border border-red-600 text-red-600 hover:bg-red-50 focus:ring-red-500',
  outlinePurple: 'border border-purple-600 text-purple-600 hover:bg-purple-50 focus:ring-purple-500',
};

/* Spinner colors */
export const spinnerColors: Record<ButtonVariant, string> = {
  primary: 'white',
  secondary: 'white',
  black: 'white',
  outline: 'gray',
  ghost: 'gray',
  subtle: 'gray',
  danger: 'white',
  warning: 'white',
  success: 'white',
  info: 'white',
  indigo: 'white',
  purple: 'white',
  pink: 'white',
  orange: 'white',
  teal: 'white',
  dark: 'white',
  light: 'gray',
  gradientBlue: 'white',
  gradientGreen: 'white',
  gradientPurple: 'white',
  gradientSunset: 'white',
  outlineBlue: 'blue',
  outlineGreen: 'green',
  outlineRed: 'red',
  outlinePurple: 'purple',
};
