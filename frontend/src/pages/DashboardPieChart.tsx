import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';

interface DashboardPieChartProps {
  data: { name: string; value: number }[];
  stats: { value: string }[];
  distributionFilter: string;
}

// Subject to color mapping
const subjectColorMap: Record<string, string> = {
  Math: '#EF5350', // Medium Red (vibrant pastel)
  Mathematics: '#EF5350', // Medium Red (vibrant pastel) (alias)
  English: '#FFEE58', // Medium Yellow (vibrant pastel) (alias)
  Literature: '#FFEE58', // Medium Yellow (vibrant pastel)
  Science: '#66BB6A', // Medium Green (vibrant pastel)
  History: '#1976D2', // Darker Blue
  'Social Studies': '#1976D2', // Darker Blue (alias)
  'Foreign Language': '#29B6F6', // Medium Light Blue (vibrant pastel) (alias)
  Language: '#29B6F6', // Medium Light Blue (vibrant pastel)
  Technology: '#B39DDB', // Lavender
  Business: '#9CCC65', // Medium Green (vibrant pastel)
  Economics: '#9CCC65', // Medium Green (vibrant pastel) (alias)
  'Music & Arts': '#AB47BC', // Medium Purple (vibrant pastel)
  Health: '#FFB74D', // Medium Orange (vibrant pastel) (alias)
  PE: '#FFB74D', // Medium Orange (vibrant pastel) (alias)
  'Health / PE': '#FFB74D', // Medium Orange (vibrant pastel) (alias)
  Fitness: '#FFB74D', // Medium Orange (vibrant pastel)
  'Career & Technical Ed': '#4DB6AC', // Medium Teal (vibrant pastel)
};

const getSubjectColor = (subject: string) => {
  // Try direct match, then case-insensitive, then default
  if (subjectColorMap[subject]) return subjectColorMap[subject];
  const found = Object.keys(subjectColorMap).find(
    key => key.toLowerCase() === subject.toLowerCase()
  );
  return found ? subjectColorMap[found] : '#BDBDBD'; // Default: gray
};

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data, distributionFilter }) => {
  const navigate = useNavigate();

  const handlePieClick = (payload: any) => {
    if (payload && payload.name) {
      navigate('/dashboard/assignments', {
        state: { subject: payload.name, timeframe: distributionFilter },
      });
    }
  };

  return (
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
          onClick={handlePieClick}
        >
          {data.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={getSubjectColor(entry.name)} cursor="pointer" />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DashboardPieChart;
