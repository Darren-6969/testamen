// components/button/Button.tsx

import {
  baseClasses,
  sizeClasses,
  variantClasses,
  spinnerColors,
  ButtonProps,
} from './ButtonConfig';
import LoadingSpinner from '../loader/LoadingSpinner';

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'black',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  className = '',
  color,
  bgColor,
  hoverColor,
  focusRingColor,
  icon: Icon,
  iconPosition = 'left',
  iconSize = 16,
  iconColor = 'var(--icon-color)',
  tooltip,
}: ButtonProps) {
  const spinnerSizeMap = { sm: 'sm', md: 'md', lg: 'lg' } as const;
  const widthClass = fullWidth ? 'w-full' : '';
  const classes = `${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${widthClass} ${className}`.trim();

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-disabled={disabled || loading}
      aria-busy={loading}
      className={classes}
      title={tooltip}
      style={{
        backgroundColor: bgColor,
        color,
        ...(hoverColor && { '--tw-hover-color': hoverColor }),
        ...(focusRingColor && { '--tw-focus-color': focusRingColor }),
      } as React.CSSProperties}
    >
      {loading && (
        <LoadingSpinner
          size={spinnerSizeMap[size]}
          color={color || spinnerColors[variant] || 'white'}
        />
      )}
      {!loading && Icon && iconPosition === 'left' && (
        <Icon
  size={iconSize}
  className="shrink-0"
  color={iconColor}
/>
      )}
      {children && <span>{children}</span>}
      {!loading && Icon && iconPosition === 'right' && (
        <Icon size={iconSize} className="shrink-0" color={iconColor || color || 'currentColor'} />
      )}
    </button>
  );
}