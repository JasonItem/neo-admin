"use client";

import { Area, AreaChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  visits: { label: "登录次数", color: "var(--chart-1)" },
  operations: { label: "操作次数", color: "var(--chart-2)" },
} satisfies ChartConfig;

export function ActivityChart({
  data,
}: {
  data: Array<{ date: string; visits: number; operations: number }>;
}) {
  return (
    <ChartContainer config={config} className="h-[270px] w-full">
      <AreaChart data={data} margin={{ left: 0, right: 12, top: 12 }}>
        <defs>
          <linearGradient id="visits" x1="0" y1="0" x2="0" y2="1">
            <stop
              offset="5%"
              stopColor="var(--color-visits)"
              stopOpacity={0.32}
            />
            <stop
              offset="95%"
              stopColor="var(--color-visits)"
              stopOpacity={0}
            />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} strokeDasharray="4 4" />
        <XAxis
          dataKey="date"
          tickLine={false}
          axisLine={false}
          tickMargin={10}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Area
          dataKey="visits"
          type="monotone"
          stroke="var(--color-visits)"
          fill="url(#visits)"
          strokeWidth={2}
        />
        <Area
          dataKey="operations"
          type="monotone"
          stroke="var(--color-operations)"
          fill="transparent"
          strokeWidth={2}
        />
      </AreaChart>
    </ChartContainer>
  );
}
