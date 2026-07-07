// components/charts/BarChart.tsx
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
  /** If provided, all bars will use this color. */
  barColor?: string;
}

export default function BarChart({ data, barColor }: BarChartProps) {
  // default palette (used when barColor is NOT passed)
  const palette = ['#f90506', '#d62828', '#b71c1c', '#6d4c41', '#424242', '#212121'];

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: 'var(--card-bg)',
      }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <ReBarChart
          data={data}
          margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color)" />

          {/* smaller axis labels */}
          <XAxis
            dataKey="name"
            stroke="var(--text)"
            tick={{ fontSize: 10 }}
          />
          <YAxis
            stroke="var(--text)"
            tick={{ fontSize: 10 }}
          />

          <Tooltip
            contentStyle={{
              backgroundColor: '#fff',
              border: '1px solid var(--border-color)',
              color: 'var(--text)',
            }}
            labelStyle={{ fontSize: 11 }}
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
