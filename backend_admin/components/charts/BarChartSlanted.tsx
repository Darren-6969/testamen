// components/charts/BarChartSlanted.tsx
'use client';
import {
  BarChart as ReBarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

interface BarChartProps {
  data: { name: string; value: number }[];
  barColor?: string;
}

export default function BarChartSlanted({ data, barColor }: BarChartProps) {
  const palette = ['#f90506', '#d62828', '#b71c1c', '#6d4c41', '#424242', '#212121'];

  return (
    <div className="rounded-lg w-full h-full">
      <ResponsiveContainer width="100%" height="100%">
        <ReBarChart
          data={data}
          /* Increased bottom margin to accommodate slanted labels */
          margin={{ top: 20, right: 30, left: 0, bottom: 60 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" vertical={false} />

          <XAxis
            dataKey="name"
            stroke="var(--text)"
            tick={{ fontSize: 10 }}
            /* Rotation logic */
            angle={-45}
            textAnchor="end"
            interval={0} // Forces all labels to show
          />
          
          <YAxis
            stroke="var(--text)"
            tick={{ fontSize: 10 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
            }}
            labelStyle={{ fontSize: 11, fontWeight: 'bold' }}
            itemStyle={{ fontSize: 11 }}
          />

          <Bar dataKey="value">
            {data.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={barColor || palette[index % palette.length]}
              />
            ))}
          </Bar>
        </ReBarChart>
      </ResponsiveContainer>
    </div>
  );
}