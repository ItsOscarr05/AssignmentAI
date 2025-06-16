import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardPieChartProps {
  data: { name: string; value: number; color: string }[];
  stats: { value: string }[];
}

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data }) => (
  <ResponsiveContainer width="100%" height="100%">
    <PieChart>
      <text
        x="50%"
        y="45%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '28px', fontWeight: 'bold' }}
      >
        Total Subjects:
      </text>
      <text
        x="50%"
        y="55%"
        textAnchor="middle"
        dominantBaseline="middle"
        style={{ fontSize: '28px', fontWeight: 'bold' }}
      >
        {data.length}
      </text>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={115}
        outerRadius={160}
        paddingAngle={4}
        dataKey="value"
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
