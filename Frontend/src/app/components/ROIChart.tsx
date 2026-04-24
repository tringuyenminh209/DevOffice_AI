import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data = [
  {
    category: 'Research',
    humanCost: 480,
    aiCost: 12,
    savings: 468
  },
  {
    category: 'Analysis',
    humanCost: 360,
    aiCost: 18,
    savings: 342
  },
  {
    category: 'Writing',
    humanCost: 240,
    aiCost: 8,
    savings: 232
  },
  {
    category: 'Review',
    humanCost: 180,
    aiCost: 6,
    savings: 174
  },
  {
    category: 'Development',
    humanCost: 600,
    aiCost: 15,
    savings: 585
  }
];

export default function ROIChart() {
  return (
    <div className="w-full h-64 p-4 bg-card border border-border rounded-lg">
      <h3 className="text-[12px] font-semibold text-text-secondary mb-4 tracking-wide">
        AI VS HUMAN COST COMPARISON (USD/Session)
      </h3>

      <ResponsiveContainer width="100%" height="85%">
        <BarChart data={data}>
          <XAxis
            dataKey="category"
            tick={{ fill: '#7D8BA3', fontSize: 10 }}
            axisLine={{ stroke: '#2B303F' }}
          />
          <YAxis
            tick={{ fill: '#7D8BA3', fontSize: 10 }}
            axisLine={{ stroke: '#2B303F' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1D202B',
              border: '1px solid #2B303F',
              borderRadius: '8px',
              fontSize: '11px'
            }}
            labelStyle={{ color: '#EAEDEC' }}
          />
          <Legend
            wrapperStyle={{ fontSize: '10px' }}
            iconType="square"
          />
          <Bar dataKey="humanCost" fill="#DA3950" name="Human Cost" />
          <Bar dataKey="aiCost" fill="#10B06B" name="AI Cost" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
