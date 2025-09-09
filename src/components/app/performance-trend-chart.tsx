
'use client';

import { Line, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import type { ExamResult } from '@/services/firestore';
import { useMemo } from 'react';

interface PerformanceTrendChartProps {
  results: ExamResult[];
}

export default function PerformanceTrendChart({ results }: PerformanceTrendChartProps) {
  const chartData = useMemo(() => {
    // Sort results by date and take the last 10
    return results
      .sort((a, b) => new Date(a.submittedAt.seconds * 1000).getTime() - new Date(b.submittedAt.seconds * 1000).getTime())
      .slice(-10)
      .map((r, index) => ({
        name: `Test ${index + 1}`,
        examName: r.examName,
        score: r.score,
        accuracy: r.accuracy,
      }));
  }, [results]);

  return (
    <div className="h-[350px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer
          config={{
            score: {
              label: 'Score',
              color: 'hsl(var(--chart-1))',
            },
            accuracy: {
              label: 'Accuracy',
              color: 'hsl(var(--chart-2))',
            },
          }}
        >
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 10,
              left: -10,
              bottom: 0,
            }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="name"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
            />
            <YAxis 
                tickLine={false}
                axisLine={false}
                tickMargin={8}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent
                labelFormatter={(value, payload) => {
                    return payload?.[0]?.payload?.examName || value;
                }}
                indicator="line"
              />}
            />
            <Line
              dataKey="score"
              type="monotone"
              stroke="var(--color-score)"
              strokeWidth={2}
              dot={true}
            />
             <Line
              dataKey="accuracy"
              type="monotone"
              stroke="var(--color-accuracy)"
              strokeWidth={2}
              dot={true}
            />
          </LineChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  );
}
