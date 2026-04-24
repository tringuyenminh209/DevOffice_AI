import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';

const data = [
  { day: 'Mon', actual: 2.4, forecast: 2.6 },
  { day: 'Tue', actual: 3.1, forecast: 3.2 },
  { day: 'Wed', actual: 2.8, forecast: 3.0 },
  { day: 'Thu', actual: 3.5, forecast: 3.7 },
  { day: 'Fri', actual: 4.2, forecast: 4.5 },
  { day: 'Sat', forecast: 2.1 },
  { day: 'Sun', forecast: 1.8 }
];

export default function BudgetForecast() {
  return (
    <div className="w-full h-64 p-4 bg-card border border-border rounded-lg">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[12px] font-semibold text-text-secondary tracking-wide">
          WEEKLY BUDGET FORECAST (USD)
        </h3>
        <div className="flex items-center gap-4 text-[10px]">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-primary" />
            <span className="text-text-secondary">Actual</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-0.5 bg-amber" />
            <span className="text-text-secondary">Forecast</span>
          </div>
        </div>
      </div>

      <ResponsiveContainer width="100%" height="85%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="colorActual" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#5E55EA" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#5E55EA" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EB9619" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#EB9619" stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="day"
            tick={{ fill: '#7D8BA3', fontSize: 10 }}
            axisLine={{ stroke: '#2B303F' }}
          />
          <YAxis
            tick={{ fill: '#7D8BA3', fontSize: 10 }}
            axisLine={{ stroke: '#2B303F' }}
            domain={[0, 5]}
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
          <Area
            type="monotone"
            dataKey="actual"
            stroke="#5E55EA"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#colorActual)"
          />
          <Area
            type="monotone"
            dataKey="forecast"
            stroke="#EB9619"
            strokeWidth={2}
            strokeDasharray="5 5"
            fillOpacity={1}
            fill="url(#colorForecast)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
