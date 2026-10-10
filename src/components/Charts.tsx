import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  LabelList,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { COLORS } from "../lib/chartColors";

export function GenderDonut({
  female,
  male,
}: {
  female: number;
  male: number;
}) {
  const data = [
    { name: "Female", value: female, fill: COLORS.female },
    { name: "Male", value: male, fill: COLORS.male },
  ];
  const total = female + male;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-around">
      <div className="h-44 w-44">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius="60%"
              outerRadius="100%"
              stroke="none"
              isAnimationActive={false}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <ul className="space-y-2">
        {data.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-base">
            <span
              className="inline-block size-3 rounded-full"
              style={{ background: d.fill }}
            />
            <span className="font-semibold">{d.name}</span>
            <span>
              {d.value} ({total ? Math.round((d.value / total) * 100) : 0}%)
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Series {
  key: string;
  name: string;
  color: string;
}

export function VerticalBars({
  data,
  xKey,
  series,
  labels = false,
}: {
  data: object[];
  xKey: string;
  series: Series[];
  labels?: boolean;
}) {
  return (
    <div className="h-60">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 16, right: 8, bottom: 0, left: -16 }}
        >
          <CartesianGrid vertical={false} stroke={COLORS.line} />
          <XAxis
            dataKey={xKey}
            tick={{ fontSize: 12, fill: COLORS.ink }}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            allowDecimals={false}
            tick={{ fontSize: 12, fill: COLORS.sub }}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip cursor={{ fill: "#F3F4F6" }} />
          {series.length > 1 && <Legend />}
          {series.map((s) => (
            <Bar
              key={s.key}
              dataKey={s.key}
              name={s.name}
              fill={s.color}
              radius={[4, 4, 0, 0]}
              isAnimationActive={false}
            >
              {labels && (
                <LabelList dataKey={s.key} position="top" fontSize={12} />
              )}
            </Bar>
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function HorizontalBars({
  data,
  color,
}: {
  data: { label: string; value: number }[];
  color: string;
}) {
  return (
    <div style={{ height: Math.max(120, data.length * 44 + 16) }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 0, right: 32, bottom: 0, left: 0 }}
        >
          <XAxis type="number" hide allowDecimals={false} />
          <YAxis
            type="category"
            dataKey="label"
            width={130}
            tick={{ fontSize: 12, fill: COLORS.ink }}
            tickLine={false}
            axisLine={false}
            tickFormatter={(v: string) =>
              v.length > 20 ? `${v.slice(0, 19)}…` : v
            }
          />
          <Tooltip cursor={{ fill: "#F3F4F6" }} />
          <Bar
            dataKey="value"
            name="Count"
            fill={color}
            radius={[0, 4, 4, 0]}
            isAnimationActive={false}
          >
            <LabelList dataKey="value" position="right" fontSize={12} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
