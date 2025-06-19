import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardPieChartProps {
  data: { name: string; value: number }[];
  stats: { value: string }[];
}

// Subject to color mapping
const subjectColorMap: Record<string, string> = {
  Math: '#D32F2F', // Red
  Mathematics: '#D32F2F', // Red (alias)
  English: '#FFD600', // Yellow (alias)
  Literature: '#FFD600', // Yellow
  Science: '#388E3C', // Green
  History: '#1976D2', // Blue
  'Social Studies': '#1976D2', // Blue (alias)
  'Foreign Language': '#4FC3F7', // Light Blue (alias)
  Language: '#4FC3F7', // Light Blue
  Technology: '#B39DDB', // Lavender
  Business: '#81C784', // Light Green
  Economics: '#81C784', // Light Green (alias)
  'Music & Arts': '#8E24AA', // Purple / Violet
  Health: '#FFA000', // Orange (alias)
  PE: '#FFA000', // Orange (alias)
  'Health / PE': '#FFA000', // Orange (alias)
  Fitness: '#FFA000', // Orange
  'Career & Technical Ed': '#009688', // Teal
};

const getSubjectColor = (subject: string) => {
  // Try direct match, then case-insensitive, then default
  if (subjectColorMap[subject]) return subjectColorMap[subject];
  const found = Object.keys(subjectColorMap).find(
    key => key.toLowerCase() === subject.toLowerCase()
  );
  return found ? subjectColorMap[found] : '#BDBDBD'; // Default: gray
};

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
          <Cell key={`cell-${index}`} fill={getSubjectColor(entry.name)} />
        ))}
      </Pie>
      <Tooltip />
    </PieChart>
  </ResponsiveContainer>
);

export default DashboardPieChart;
