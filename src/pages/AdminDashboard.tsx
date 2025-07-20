
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { ApplicationTrendsChart } from "@/components/admin/ApplicationTrendsChart";
import { ExperienceClusterChart } from "@/components/admin/ExperienceClusterChart";
import { Sidebar } from "@/components/admin/Sidebar";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { StatsOverview } from "@/components/admin/StatsOverview";
import { TopPerformers } from "@/components/admin/TopPerformers";
import { RecentApplications } from "@/components/admin/RecentApplications";
import { UpcomingInterviews } from "@/components/admin/UpcomingInterviews";
import { JobManagement } from "@/components/admin/JobManagement";


const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkAdminStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/admin/login");
        return;
      }
      const { data: adminData } = await supabase
        .from('admin_users')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      if (!adminData?.is_admin) {
        toast({
          title: "Access denied",
          description: "You don't have permission to access this page",
          variant: "destructive",
        });
        navigate("/admin/login");
      }
    };
    checkAdminStatus();
  }, [navigate, toast]);

  const { data: cvs, isLoading: cvsLoading } = useQuery({
    queryKey: ["cvs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cvs")
        .select("*, job_postings(title, department)")
        .order("requirements_match", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*");
      if (error) throw error;
      return data;
    },
  });

  const { data: jobPostings, isLoading: jobsLoading } = useQuery({
    queryKey: ["job_postings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, cvs(applicant_name)");
      if (error) throw error;
      return data;
    },
  });

 
  if (!cvs) return null;

  const experienceGroups = cvs.reduce((acc, cv) => {
    const group = `${Math.floor(cv.years_experience / 2) * 2}-${Math.floor(cv.years_experience / 2) * 2 + 2} years`;
    if (!acc[group]) acc[group] = [];
    acc[group].push(cv);
    return acc;
  }, {} as Record<string, any[]>);

  return (
    <div className="bg-primary relative hidden md:flex flex-col items-center justify-center p-8 min-h-screen">
      <Sidebar />

      <div className="ml-[88px] p-6">
        <div className="bg-secondary backdrop-blur rounded-xl p-6 mb-6">
          <DashboardHeader />
          <StatsOverview cvs={cvs} />
        </div>
        
       

        <div className="mb-6">
          <JobManagement />
        </div>
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-2 space-y-6">
            <div className="bg-secondary backdrop-blur rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Application Trends</h2>
              <p className="text-sm text-gray-500 mb-4">Last 30 days application activity</p>
              <ApplicationTrendsChart cvs={cvs} />
            </div>

            <TopPerformers cvs={cvs} />
          </div>

          <div className="space-y-6">
            <ExperienceClusterChart experienceGroups={experienceGroups} />
            <UpcomingInterviews interviews={interviews} />
            <RecentApplications cvs={cvs} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
