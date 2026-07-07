
import React from 'react';

type Variant = 'default' | 'success' | 'danger' | 'warning' | 'info' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface BadgeProps {
	children: React.ReactNode;
	/** Prefer passing simple text via this prop */
	text?: string;
	variant?: Variant;
	size?: Size;
	pill?: boolean;
	className?: string;
	/**
	 * If provided, used as inline style to set background color (overrides variant bg)
	 */
	color?: string;
	/**
	 * If provided, used as inline style to set text color (overrides variant text)
	 */
	textColor?: string;
	icon?: React.ReactNode;
}

export default function Badge({
	children,
	text,
	variant = 'default',
	size = 'md',
	pill = false,
	className = '',
	color,
	textColor,
	icon,
}: BadgeProps) {
	const sizeClasses = {
		sm: 'text-xs px-2 py-0.5',
		md: 'text-sm px-2.5 py-0.5',
		lg: 'text-base px-3 py-1',
	} as const;

	const variantClasses: Record<Variant, string> = {
		default: 'bg-gray-100 text-gray-800',
		success: 'bg-green-100 text-green-800',
		danger: 'bg-red-100 text-red-800',
		warning: 'bg-yellow-100 text-yellow-800',
		info: 'bg-blue-100 text-blue-800',
		outline: 'bg-white text-gray-800 border border-gray-200',
	};

	const classes = [
		'inline-flex items-center font-medium rounded',
		pill ? 'rounded-full' : 'rounded',
		sizeClasses[size],
		variantClasses[variant],
		className,
	]
		.filter(Boolean)
		.join(' ');

	const style: React.CSSProperties = {};
	if (color) style.backgroundColor = color;
	if (textColor) style.color = textColor;

	const rendered = text ?? children;
	// compute title for tooltip/accessibility
	const title = typeof rendered === 'string' ? rendered : undefined;

	return (
		<span className={classes} style={style} title={title}>
			{icon && <span className="mr-2 inline-flex items-center">{icon}</span>}
			<span>{rendered}</span>
		</span>
	);
}

