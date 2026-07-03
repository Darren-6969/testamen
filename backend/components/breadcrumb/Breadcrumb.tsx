'use client';

import React from 'react';
import Link from 'next/link';
import { ChevronRight } from 'lucide-react';

interface BreadcrumbItem {
	label: string;
	href?: string; // optional, last item usually has no link
}

interface BreadcrumbProps {
	items: BreadcrumbItem[];
	className?: string;
	separator?: React.ReactNode;
}

export default function Breadcrumb({ items }: BreadcrumbProps) {

	return (
		<nav className="text-sm text-gray-500 mb-4" aria-label="Breadcrumb">
			<ol className="list-none p-0 inline-flex space-x-2">
				{items.map((item, index) => {
					const isLast = index === items.length - 1;
					return (
						<li key={index} className="flex items-center">
							{!isLast && (
								<Link href={item.href || '#'} className="text-gray-500 hover:text-gray-700">
									{item.label}
								</Link>
							)}
							{isLast && <span className="text-gray-700 font-medium">{item.label}</span>}
							{!isLast && <ChevronRight className="w-4 h-4 mx-2 text-gray-400" />}
						</li>
					);
				})}
			</ol>
		</nav>
	);
}