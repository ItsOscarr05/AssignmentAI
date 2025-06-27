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

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0];
    const label = name === 'No Subjects' ? name : `${name}: ${value}`;
    return (
      <div
        style={{
          backgroundColor: '#fff',
          padding: '5px',
          border: '1px solid #ccc',
        }}
      >
        <span>{label}</span>
      </div>
    );
  }
  return null;
};

const DashboardPieChart: React.FC<DashboardPieChartProps> = ({ data, distributionFilter }) => {
  const navigate = useNavigate();

  const handlePieClick = (payload: any) => {
    if (payload && payload.name && payload.name !== 'No Subjects') {
      navigate('/dashboard/assignments', {
        state: { subject: payload.name, timeframe: distributionFilter },
      });
    }
  };

  const hasData = data.length > 0;
  const chartData = hasData ? data : [{ name: 'No Subjects', value: 1 }];

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
          data={chartData}
          cx="50%"
          cy="50%"
          innerRadius="75%"
          outerRadius="100%"
          paddingAngle={hasData ? 4 : 0}
          dataKey="value"
          onClick={handlePieClick}
        >
          {chartData.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={hasData ? getSubjectColor(entry.name) : '#BDBDBD'}
              cursor={hasData ? 'pointer' : 'default'}
            />
          ))}
        </Pie>
        <Tooltip content={<CustomTooltip />} />
      </PieChart>
    </ResponsiveContainer>
  );
};

export default DashboardPieChart;
