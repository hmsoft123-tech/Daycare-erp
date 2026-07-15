"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";
import type { RevenueDataPoint } from "@/types";

interface RevenueChartProps {
  data: RevenueDataPoint[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Monthly Revenue</CardTitle>
          <p className="mt-1 text-sm text-muted">(+8%) than last year</p>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#00A76F" stopOpacity={0.28} />
                <stop offset="95%" stopColor="#00A76F" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#F1F3F5" vertical={false} />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 12, fill: "#919EAB" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 12, fill: "#919EAB" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => `${(v / 1000000).toFixed(1)}M`}
            />
            <Tooltip
              formatter={(value) => [formatCurrency(Number(value ?? 0)), "Revenue"]}
              contentStyle={{
                borderRadius: "12px",
                border: "none",
                boxShadow: "0 0 2px rgba(145,158,171,0.2), 0 12px 24px -4px rgba(145,158,171,0.12)",
              }}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke="#00A76F"
              strokeWidth={3}
              fill="url(#revenueGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
