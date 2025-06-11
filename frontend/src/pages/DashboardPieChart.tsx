import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardPieChartProps {
  data: { name: string; value: number; color: string }[];
  stats: { value: string }[];
}

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data, stats }) => (
  <ResponsiveContainer width="100%" height={240}>
    <PieChart>
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '16px', fontWeight: 'bold' }}
      >
        Total Assignments:
      </text>
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '16px', fontWeight: 'bold' }}
      >
        {stats[0].value}
      </text>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={55}
        outerRadius={80}
        paddingAngle={4}
        dataKey="value"
        label={({ name, percent }: { name: string; percent: number }) =>
          `${name}: ${(percent * 100).toFixed(0)}%`
        }
      >
        {data.map((entry, index) => (
          <Cell key={`cell-${index}`} fill={entry.color} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

export default DashboardPieChart;
