
import { ChartContainer, ChartTooltip } from "@/components/ui/chart";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer } from "recharts";
import { Database } from "@/integrations/supabase/types";
import { format, subDays } from "date-fns";

type CV = Database["public"]["Tables"]["cvs"]["Row"];

interface ApplicationTrendsChartProps {
  cvs: CV[];
}

export const ApplicationTrendsChart = ({ cvs }: ApplicationTrendsChartProps) => {
  // Generate data for the last 30 days
  const last30Days = Array.from({ length: 30 }, (_, i) => {
    const date = subDays(new Date(), i);
    const formattedDate = format(date, 'yyyy-MM-dd');
    const applications = cvs.filter(cv => 
      cv.application_date && 
      format(new Date(cv.application_date), 'yyyy-MM-dd') === formattedDate
    ).length;
    
    return {
      date: format(date, 'MMM dd'),
      applications,
    };
  }).reverse();

  return (
    <div className="w-full h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <ChartContainer
          config={{
            applications: {
              theme: {
                light: "hsl(var(--primary))",
                dark: "hsl(var(--primary))",
              },
            },
          }}
        >
          <LineChart
            data={last30Days}
            margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
          >
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              interval="preserveStartEnd"
            />
            <YAxis />
            <ChartTooltip />
            <Line 
              type="monotone" 
              dataKey="applications" 
              stroke="var(--color-applications)" 
              strokeWidth={2}
            />
          </LineChart>
        </ChartContainer>
      </ResponsiveContainer>
    </div>
  );
};
