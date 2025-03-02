
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { useEffect, useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { TopCVsTable } from "@/components/admin/TopCVsTable";
import { ApplicationTrendsChart } from "@/components/admin/ApplicationTrendsChart";
import { ExperienceClusterChart } from "@/components/admin/ExperienceClusterChart";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {  
  ChevronLeft, 
  ChevronRight, 
  MoreVertical,
  Clock,
  Users,
  CreditCard,
  Briefcase,
  CheckCircle,
  Clock as ClockIcon,
  LogOut,
  Calendar,
  Hourglass,
  Medal,
  Award
} from "lucide-react";

type CV = Database["public"]["Tables"]["cvs"]["Row"];
type Position = Database["public"]["Tables"]["positions"]["Row"];
type Interview = Database["public"]["Tables"]["interviews"]["Row"];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentDate] = useState(new Date());

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
        .select("*")
        .order("requirements_match", { ascending: false });

      if (error) throw error;
      return data as CV[];
    },
  });

  const { data: positions, isLoading: positionsLoading } = useQuery({
    queryKey: ["positions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("positions")
        .select("*");

      if (error) throw error;
      return data as Position[];
    },
  });

  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, cvs(applicant_name)");

      if (error) throw error;
      return data as (Interview & { cvs: { applicant_name: string } })[];
    },
  });

  if (cvsLoading || positionsLoading || interviewsLoading) {
    return <div>Loading...</div>;
  }

  if (!cvs) return null;

  // Calculate stats for dashboard
  const totalApplications = cvs.length;
  const pendingApplications = cvs.filter(cv => cv.status === 'pending').length;
  const acceptedApplications = cvs.filter(cv => cv.status === 'accepted').length;
  const averageExperience = cvs.reduce((acc, cv) => acc + cv.years_experience, 0) / cvs.length;

  // Recent CVs data - sort by application_date or created_at, take the most recent 4
  const recentCVs = [...cvs]
    .sort((a, b) => {
      const dateA = a.application_date || a.created_at || '';
      const dateB = b.application_date || b.created_at || '';
      return new Date(dateB).getTime() - new Date(dateA).getTime();
    })
    .slice(0, 4);

  // Get upcoming interviews
  const upcomingInterviews = interviews 
    ? [...interviews]
        .filter(interview => interview.status === 'scheduled')
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 4)
    : [];

  // Calculate skill gaps
  const skillGapAnalysis = positions?.reduce((acc, position) => {
    const requiredSkills = position.requirements || [];
    const matchingCVs = cvs.filter(cv => {
      const candidateSkills = cv.skills || [];
      return requiredSkills.some(skill => candidateSkills.includes(skill));
    });
    
    const missingSkills = requiredSkills.filter(skill => {
      return !cvs.some(cv => (cv.skills || []).includes(skill));
    });
    
    acc.push({
      position: position.title,
      skillGaps: missingSkills,
      matchRate: requiredSkills.length ? matchingCVs.length / cvs.length * 100 : 0
    });
    
    return acc;
  }, [] as Array<{position: string, skillGaps: string[], matchRate: number}>);

  // Experience distribution data for pie chart
  const experienceGroups = cvs.reduce((acc, cv) => {
    const group = `${Math.floor(cv.years_experience / 2) * 2}-${Math.floor(cv.years_experience / 2) * 2 + 2} years`;
    if (!acc[group]) acc[group] = [];
    acc[group].push(cv);
    return acc;
  }, {} as Record<string, CV[]>);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  // Calculate date/time for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours < 1 
        ? "Just now" 
        : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="bg-primary relative hidden md:flex flex-col items-center justify-center p-8 min-h-screen">
      {/* Sidebar */}
      <div className="fixed left-0 top-0 h-full w-[88px] bg-black flex flex-col items-center py-8 text-white">
        <div className="mb-12">
          <span className="text-xl font-bold">Cona</span>
        </div>
        <div className="flex flex-col items-center space-y-8">
          <Button variant="ghost" size="icon" className="text-white">
            <Users className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <Briefcase className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <CreditCard className="h-6 w-6" />
          </Button>
          <Button variant="ghost" size="icon" className="text-white">
            <Clock className="h-6 w-6" />
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-[88px] p-6">
        {/* Header */}
        <div className="bg-secondary backdrop-blur rounded-xl p-6 mb-6">
            <div className="flex justify-between items-center">
            <h1 className="text-foreground-secondary font-bold">Good morning, James!</h1>
            <div className="flex items-center space-x-4">
              <Button variant="destructive" className="rounded-xl gap-2" onClick={handleLogout}>
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
                <Avatar className="bg-foreground">
                <AvatarImage src="/avatars/batman.jpg" />
                <AvatarFallback>JD</AvatarFallback>
                </Avatar>
            </div>
          </div>

          {/* Stats cards */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <Card className="bg-white/80 backdrop-blur border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <CheckCircle className="h-6 w-6" />
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h2 className="text-2xl font-bold">{acceptedApplications}</h2>
                <p className="text-sm text-gray-500">Accepted applications</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <Clock className="h-6 w-6" />
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h2 className="text-2xl font-bold">{pendingApplications}</h2>
                <p className="text-sm text-gray-500">Pending review</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <Users className="h-6 w-6" />
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h2 className="text-2xl font-bold">{totalApplications}</h2>
                <p className="text-sm text-gray-500">Total applicants</p>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-none shadow-none">
              <CardHeader className="flex flex-row items-center justify-between p-4">
                <Briefcase className="h-6 w-6" />
                <Button variant="ghost" size="icon">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                <h2 className="text-2xl font-bold">{averageExperience.toFixed(1)}</h2>
                <p className="text-sm text-gray-500">Average experience (years)</p>
              </CardContent>
            </Card>
          </div>

          {/* Navigation arrows */}
          <div className="flex justify-center mt-4">
            <Button variant="ghost" size="icon">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Main dashboard content */}
        <div className="grid grid-cols-3 gap-6">
          {/* Left column */}
          <div className="col-span-2 space-y-6">
            {/* Recent CVs - replacing the "Recent emails" section */}
            <Card className="bg-secondary backdrop-blur border-none">
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentCVs.map((cv, index) => (
                    <div 
                      key={index} 
                      className="flex items-center cursor-pointer hover:bg-gray-100 p-2 rounded-lg transition-colors"
                      onClick={() => navigate(`/admin/cv/${cv.id}`)}
                    >
                      <Avatar className="h-10 w-10 mr-4">
                        {cv.avatar_url ? (
                          <AvatarImage src={cv.avatar_url} />
                        ) : (
                          <AvatarFallback>{cv.applicant_name.charAt(0)}</AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <p className="font-medium">{cv.applicant_name}</p>
                        <p className="text-sm text-gray-500">{cv.current_job_title || "Applicant"} • {cv.years_experience} years</p>
                      </div>
                      <div>
                        <span className="text-sm text-gray-500">{formatDate(cv.application_date || cv.created_at)}</span>
                        <span
                          className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${
                            cv.status === 'accepted'
                              ? 'bg-green-100 text-green-800'
                              : cv.status === 'rejected'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}
                        >
                          {cv.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={() => navigate("/admin/applications")}
                >
                  View all applications
                </Button>
              </CardFooter>
            </Card>
          </div>

          {/* Right column - REPLACING To-Do list and Board meeting with more relevant content */}
          <div className="space-y-6">
            {/* Upcoming Interviews - new section replacing To-Do list */}
            <Card className="bg-secondary backdrop-blur border-none">
              <CardHeader>
                <CardTitle>Upcoming Interviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingInterviews.length > 0 ? (
                    upcomingInterviews.map((interview, index) => (
                      <div key={index} className="flex items-center">
                        <div className="bg-black text-white rounded-full p-2 mr-4">
                          <Calendar className="h-5 w-5" />
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{interview.cvs?.applicant_name || "Candidate"}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            {new Date(interview.scheduled_at).toLocaleDateString()} at {new Date(interview.scheduled_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          className="ml-2"
                          onClick={() => navigate(`/admin/interviews/${interview.id}`)}
                        >
                          View
                        </Button>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-gray-500 py-4">No upcoming interviews scheduled</p>
                  )}
                </div>
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate("/admin/interviews")}
                >
                  Manage all interviews
                </Button>
              </CardFooter>
            </Card>

            {/* Skills Gap Analysis - new section replacing Board meeting */}
            <Card className="bg-secondary backdrop-blur border-none">
              <CardHeader>
                <CardTitle>Skills Gap Analysis</CardTitle>
                <CardDescription>Missing skills in candidate pool</CardDescription>
              </CardHeader>
              <CardContent>
                {skillGapAnalysis && skillGapAnalysis.length > 0 ? (
                  <div className="space-y-4">
                    {skillGapAnalysis.slice(0, 2).map((position, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">{position.position}</h4>
                          <span className="text-sm text-gray-500">
                            {position.matchRate.toFixed(0)}% match rate
                          </span>
                        </div>
                        <Progress value={position.matchRate} className="h-2" />
                        <div className="flex flex-wrap gap-1 mt-1">
                          {position.skillGaps.slice(0, 3).map((skill, idx) => (
                            <span 
                              key={idx} 
                              className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full"
                            >
                              {skill}
                            </span>
                          ))}
                          {position.skillGaps.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">
                              +{position.skillGaps.length - 3} more
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No skill gaps detected</p>
                )}
              </CardContent>
              <CardFooter className="pt-0">
                <Button 
                  variant="ghost" 
                  className="w-full"
                  onClick={() => navigate("/admin/positions")}
                >
                  View all positions
                </Button>
              </CardFooter>
            </Card>

            {/* Top Performers - new section */}
            <Card className="bg-secondary backdrop-blur border-none">
              <CardHeader>
                <CardTitle>Top Performers</CardTitle>
                <CardDescription>Highest rated candidates</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {cvs.filter(cv => cv.status === 'accepted').slice(0, 3).map((cv, index) => (
                    <div key={index} className="flex items-center">
                      <div className="bg-black text-white rounded-full p-2 mr-4">
                        <Award className="h-5 w-5" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{cv.applicant_name}</p>
                        <p className="text-sm text-gray-500">
                          {cv.current_job_title || "Applicant"} • Match: {cv.requirements_match?.toFixed(0) || 0}%
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="ml-2"
                        onClick={() => navigate(`/admin/cv/${cv.id}`)}
                      >
                        View
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
