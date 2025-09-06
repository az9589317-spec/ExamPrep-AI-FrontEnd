"use client"

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

const chartData = [
  { subject: "Quant", score: 75, fill: "var(--color-quant)" },
  { subject: "Reasoning", score: 82, fill: "var(--color-reasoning)" },
  { subject: "English", score: 68, fill: "var(--color-english)" },
  { subject: "GA", score: 55, fill: "var(--color-ga)" },
  { subject: "Computer", score: 90, fill: "var(--color-computer)" },
];

const chartConfig = {
  score: {
    label: "Accuracy",
  },
  quant: {
    label: "Quantitative Aptitude",
    color: "hsl(var(--chart-1))",
  },
  reasoning: {
    label: "Logical Reasoning",
    color: "hsl(var(--chart-2))",
  },
  english: {
    label: "English Language",
    color: "hsl(var(--chart-3))",
  },
  ga: {
    label: "General Awareness",
    color: "hsl(var(--chart-4))",
  },
  computer: {
    label: "Computer Knowledge",
    color: "hsl(var(--chart-5))",
  },
} satisfies ChartConfig

export default function ProgressChart() {
  return (
    <div className="h-[250px] w-full">
        <ChartContainer config={chartConfig} className="h-full w-full">
            <BarChart
                accessibilityLayer
                data={chartData}
                margin={{
                    top: 20,
                    right: 20,
                    bottom: 20,
                    left: 20,
                }}
            >
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="subject"
                    tickLine={false}
                    tickMargin={10}
                    axisLine={false}
                />
                 <YAxis
                    tickLine={false}
                    axisLine={false}
                    tickMargin={10}
                    tickFormatter={(value) => `${value}%`}
                />
                <ChartTooltip
                    cursor={false}
                    content={<ChartTooltipContent 
                        labelFormatter={(label, payload) => {
                            return payload[0] && chartConfig[payload[0].payload.subject.toLowerCase() as keyof typeof chartConfig]?.label || label;
                        }}
                    />}
                />
                <Bar dataKey="score" radius={8} />
            </BarChart>
        </ChartContainer>
    </div>
  )
}
