// components/charts/LineChart.tsx
'use client';
import {
  AreaChart as ReAreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface LineChartProps {
  data: { name: string; value: number }[];
  lineColor?: string;
}

export default function LineChart({
  data,
  lineColor = '#ef4444',
}: LineChartProps) {
  const gradientId = 'lineAreaGradient';

  return (
    <div
      className="rounded-lg"
      style={{
        backgroundColor: 'var(--card-bg)',
      }}
    >
      <ResponsiveContainer width="100%" height={240}>
        <ReAreaChart
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

          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={lineColor} stopOpacity={0.4} />
              <stop offset="100%" stopColor={lineColor} stopOpacity={0.05} />
            </linearGradient>
          </defs>

          <Area
            type="monotone"
            dataKey="value"
            name="Customers"
            stroke={lineColor}
            strokeWidth={2}
            fill={`url(#${gradientId})`}
            dot={{ r: 3, stroke: lineColor, fill: lineColor }}
            activeDot={{ r: 5 }}
          />
        </ReAreaChart>
      </ResponsiveContainer>
    </div>
  );
}
