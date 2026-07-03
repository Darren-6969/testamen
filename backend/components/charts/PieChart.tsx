// components/card/PieChart.tsx
'use client';
import React from 'react';
import {
	PieChart as RPieChart,
	Pie,
	Cell,
	ResponsiveContainer,
	Tooltip,
} from 'recharts';

interface ServiceData {
	name: string;
	value: number;
	color?: string;
}

interface PieChartProps {
	data: ServiceData[];
}

export function Pie_Chart({ data }: PieChartProps) {
	// fallback palette if color not provided in data
	// const defaultColors = ['#f90506', '#d62828', '#b71c1c', '#6d4c41', '#424242'];
	const defaultColors = [
					// Deep Reds
					'#8B0000','#A4161A','#9D0208','#7F0000','#6A040F',
					'#800020','#7B2C2C','#6D2E2E','#5C1A1B','#4A0F0F',

					// Muted Reds
					'#C0392B','#B03A2E','#922B21','#7B241C','#641E16',
					'#9E2A2B','#8C1C13','#7D3C3C','#6E2C2C','#5D1F1F',

					// Brick / Rust
					'#B7410E','#A0522D','#8B4513','#7E3517','#6E260E',
					'#8A3324','#7C2D12','#6B2C25','#5B2C2C','#4B1E1E',

					// Browns
					'#5D4037','#4E342E','#3E2723','#6D4C41','#795548',
					'#8D6E63','#5C4033','#4B3621','#3B2F2F','#2E1F1F',

					// Warm Greys
					'#424242','#3C3C3C','#353535','#2F2F2F','#292929',
					'#4A4A4A','#505050','#585858','#606060','#686868',

					// Charcoal
					'#2C2C2C','#1F1F1F','#252525','#303030','#383838',
					'#404040','#484848','#505050','#585858','#606060',

					// Muted Wine
					'#5E2129','#4A1C23','#3F151B','#6F1D1B','#8D0801',
					'#7A1E1E','#661111','#550000','#4A0404','#3B0000',

					// Earth Tones
					'#6E4B3A','#5A3E36','#4B3832','#3E2723','#6B4226',
					'#7C482B','#8B5A2B','#704214','#593E1A','#4E342E',

					// Dark Neutral Mix
					'#2E2E2E','#3A3A3A','#454545','#505050','#5A5A5A',
					'#636363','#6D6D6D','#777777','#808080','#8A8A8A',

					// Extra Variations
					'#7F1D1D','#991B1B','#842029','#6F2232','#5D1A1A',
					'#4C1C24','#3B0D11','#2C0A0F','#1F0508','#140204',

					'#5C2E00','#6E2C00','#7F2700','#8F2500','#9F2200',
					'#6B3A2E','#5A2D23','#4A1F1F','#3A1414','#2A0C0C'
					];

	// '#f90506', '#d62828', '#b71c1c', '#6d4c41', '#424242', '#212121'
	return (
		<ResponsiveContainer width="100%" height="100%">
		<RPieChart>
			<Pie
			data={data}
			dataKey="value"
			nameKey="name"
			cx="50%"
			cy="50%"
			outerRadius={80}  // solid pie (no innerRadius)
			label={false}
			labelLine={false}
			>
			{data.map((entry, index) => (
				<Cell
				key={`cell-${index}`}
				fill={entry.color || defaultColors[index % defaultColors.length]}
				/>
			))}
			</Pie>
			<Tooltip
			contentStyle={{
				backgroundColor: '#fff',
				border: '1px solid var(--border-color)',
				color: 'var(--text)',
			}}
			labelStyle={{ fontSize: 10 }}  // top label
			itemStyle={{ fontSize: 10 }}   // each row in tooltip
			/>
		</RPieChart>
		</ResponsiveContainer>
	);
}
