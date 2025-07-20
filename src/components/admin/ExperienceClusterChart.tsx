import React, { useMemo } from "react";
import { Label, Pie, PieChart } from "recharts";
import { TrendingUp } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import { Database } from "@/integrations/supabase/types";

type CV = Database["public"]["Tables"]["cvs"]["Row"];

interface ExperienceClusterChartProps {
  experienceGroups: Record<string, CV[]>;
}

export const ExperienceClusterChart = ({ experienceGroups }: ExperienceClusterChartProps) => {
  // Sort experience groups by count (descending)
  const sortedGroups = useMemo(() => {
    return Object.entries(experienceGroups)
      .map(([range, cvs]) => ({ range, count: cvs.length }))
      .sort((a, b) => b.count - a.count);
  }, [experienceGroups]);

  // Generate shades of #1D4D59 based on position in sorted list
  const experienceChartData = useMemo(() => {
    return sortedGroups.map((group, index, array) => {
      // Calculate shade of #1D4D59 - darkest for largest group
      // Using HSL: hue 195 (blue-green), saturation 54%, lightness varies from 23% (darkest) to 60% (lightest)
      const lightness = 23 + ((index / Math.max(1, array.length - 1)) * 37);

      return {
        experience: group.range,
        count: group.count,
        fill: `hsl(195, 54%, ${lightness}%)`,
      };
    });
  }, [sortedGroups]);

  // Create chart configuration with shades of #1D4D59
  const experienceChartConfig = useMemo(() => {
    const config: ChartConfig = {
      count: {
        label: "Candidates",
      },
    };

    sortedGroups.forEach((group, index, array) => {
      const lightness = 23 + ((index / Math.max(1, array.length - 1)) * 37);
      const key = group.range.replace(/\s+/g, "-").replace(/-years$/, "");

      config[key] = {
        label: group.range,
        color: `hsl(195, 54%, ${lightness}%)`,
      };
    });

    return config;
  }, [sortedGroups]);

  // Calculate total candidates
  const totalCandidates = useMemo(() => {
    return experienceChartData.reduce((acc, curr) => acc + curr.count, 0);
  }, [experienceChartData]);

  // Calculate average experience (fixed)
  const averageExperience = useMemo(() => {
    if (totalCandidates === 0) return 0; // Prevent division by zero

    const totalExperience = Object.values(experienceGroups).reduce((acc, cvs) => {
      return acc + cvs.reduce((sum, cv) => sum + (cv.years_experience ?? 0), 0);
    }, 0);

    return totalExperience / totalCandidates;
  }, [experienceGroups, totalCandidates]);

  return (
    <Card className="bg-secondary backdrop-blur border-none">
      <CardHeader>
        <CardTitle>Experience Distribution</CardTitle>
        <CardDescription>Candidate experience levels</CardDescription>
      </CardHeader>
      <CardContent className="flex-1 pb-0">
        <ChartContainer
          config={experienceChartConfig}
          className="mx-auto aspect-square max-h-[250px]"
        >
          <PieChart>
            <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
            <Pie data={experienceChartData} dataKey="count" nameKey="experience" innerRadius={60} strokeWidth={5}>
              <Label
                content={({ viewBox }) => {
                  if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                    return (
                      <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                        <tspan x={viewBox.cx} y={viewBox.cy} className="fill-foreground text-3xl font-bold">
                          {averageExperience.toFixed(1)}
                        </tspan>
                        <tspan x={viewBox.cx} y={(viewBox.cy || 0) + 24} className="fill-muted-foreground">
                          Avg. Experience
                        </tspan>
                      </text>
                    );
                  }
                }}
              />
            </Pie>
          </PieChart>
        </ChartContainer>
      </CardContent>
      <CardFooter className="flex-col gap-2 text-sm">
        <div className="leading-none text-muted-foreground">
          Showing experience distribution across all candidates
        </div>
      </CardFooter>
    </Card>
  );
};
