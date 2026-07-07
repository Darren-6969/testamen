"use client";

import { useState, useEffect, useRef } from "react";

interface AutocompleteProps<T extends object> {
	label: string;
	name: string;
	placeholder?: string;
	readOnly?: boolean;
	value?: string;
	apiUrl: string;
	method?: "GET" | "POST";
	bodyKey?: string; // e.g., "name"
	queryParam?: string; // for GET queries
	onInputChange?: (value: string) => void;
	getInputValue: (item: T) => string;
	renderSuggestion: (item: T) => React.ReactNode;
	onSelect: (item: T) => void;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export default function Autocomplete<T extends object>({
	label,
	name,
	placeholder,
	readOnly = false,
	value,
	apiUrl,
	method = "GET",
	bodyKey,
	queryParam = "search",
	onInputChange,
	getInputValue,
	renderSuggestion,
	onSelect
}: AutocompleteProps<T>) {
	const [query, setQuery] = useState(value ?? "");
	const [suggestions, setSuggestions] = useState<T[]>([]);
	const [showList, setShowList] = useState(false);
	const [highlight, setHighlight] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		if (value !== undefined && value !== query) {
			setQuery(value);
		}
	}, [value]);

	useEffect(() => {
		if (readOnly) return;

		const handler = setTimeout(() => {
			let fetchUrl = apiUrl;

			const options: RequestInit = {
				method,
				headers: { "Content-Type": "application/json" },
			};

			if (method === "GET") {
				fetchUrl = query
					? `${apiUrl}?${queryParam}=${encodeURIComponent(query)}`
					: apiUrl; // empty = default list
			} else {
				options.body = JSON.stringify({
					[bodyKey || "search"]: query || "", // empty = default list
				});
			}

			fetch(fetchUrl, options)
				.then((res) => res.json())
				.then((data) => setSuggestions(data))
				.catch(() => setSuggestions([]));
		}, 200);

		return () => clearTimeout(handler);
	}, [query, apiUrl, bodyKey, method, queryParam, readOnly]);

	// Click outside closes dropdown
	useEffect(() => {
		const handleClickOutside = (e: MouseEvent) => {
			if (!containerRef.current?.contains(e.target as Node)) {
				setShowList(false);
			}
		};
		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, []);

	const handleSelect = (item: T) => {
		const v = getInputValue(item);
		setQuery(v);
		setShowList(false);
		onSelect(item);
	};

	return (
		<div className="relative w-full" ref={containerRef}>
			<label className="text-xs text-gray-500 uppercase">{label}</label>

			<input
				name={name}
				value={query}
				readOnly={readOnly}
				placeholder={placeholder}
				onChange={(e) => {
					if (readOnly) return;
					setQuery(e.target.value);
					setShowList(true);
					onInputChange?.(e.target.value);
				}}
				onKeyDown={(e) => {
					if (e.key === "ArrowDown")
						setHighlight((h) => Math.min(h + 1, suggestions.length - 1));

					if (e.key === "ArrowUp")
						setHighlight((h) => Math.max(h - 1, 0));

					if (e.key === "Enter" && suggestions[highlight]) {
						handleSelect(suggestions[highlight]);
					}
				}}
				onFocus={() => {
					if (readOnly) return;
					setShowList(true);
					// Trigger fetch when input has no value
					if (suggestions.length === 0) {
						setQuery(""); // triggers fetch of default list
					}
				}}
				className="w-full border rounded px-3 py-2"
			/>

			{showList && suggestions.length > 0 && !readOnly && (
				<ul className="absolute w-full bg-white rounded mt-1 shadow-lg z-20 max-h-60 overflow-auto">
					{suggestions.map((item, i) => (
						<li
							key={i}
							onClick={() => handleSelect(item)}
							className={`px-3 py-2 cursor-pointer ${i === highlight ? "bg-gray-100" : ""
								}`}
						>
							{renderSuggestion(item)}
						</li>
					))}
				</ul>
			)}
		</div>
	);
}
