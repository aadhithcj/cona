import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format, parseISO } from 'date-fns';
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, Clock, Check, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type InterviewType = {
  id: string;
  scheduled_at: string;
  status: string;
  feedback?: string;
  // … other properties if needed
};

const InterviewCard = ({ interview, onStatusChange }: { 
  interview: InterviewType; 
  onStatusChange: (id: string, status: string) => void;
}) => {
  const isConfirmed = interview.status === "confirmed";
  const isDeclined = interview.status === "declined";
  const isPending = interview.status === "scheduled" || interview.status === "pending";

  return (
    <Card className="border rounded-lg shadow-sm mb-4 bg-background">
      <CardContent className="p-6">
        <div className="flex justify-between items-center">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-full">
              <CalendarIcon className="h-6 w-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-lg text-primary">
                {format(parseISO(interview.scheduled_at), 'EEEE, MMMM do, yyyy')}
              </p>
              <div className="flex items-center text-muted-foreground mt-1">
                <Clock className="h-4 w-4 mr-1" />
                <span>{format(parseISO(interview.scheduled_at), 'h:mm a')}</span>
              </div>
              <div className="mt-2">
                <Badge
                  className={`${
                    interview.status === "confirmed"
                      ? "bg-green-100 hover:bg-green-200 text-green-800"
                      : interview.status === "pending" || interview.status === "scheduled"
                      ? "bg-secondary text-secondary-foreground"
                      : interview.status === "declined"
                      ? "bg-destructive/10 text-destructive"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {interview.status === "scheduled" ? "pending" : interview.status}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="flex space-x-2 mt-3 justify-end">
              {!isDeclined && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`flex items-center gap-1 ${
                    isConfirmed 
                      ? "bg-green-50 text-green-700 hover:bg-green-100 border-green-200" 
                      : "bg-green-50 text-green-700 hover:bg-green-100 border-green-200"
                  }`}
                  onClick={() => onStatusChange(interview.id, "confirmed")}
                  disabled={isConfirmed}
                >
                  <Check className="h-4 w-4" />
                  {isConfirmed ? "Accepted" : "Accept"}
                </Button>
              )}
              
              {!isConfirmed && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className={`flex items-center gap-1 ${
                    isDeclined 
                      ? "bg-red-50 text-red-700 hover:bg-red-100 border-red-200" 
                      : "bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  }`}
                  onClick={() => onStatusChange(interview.id, "declined")}
                  disabled={isDeclined}
                >
                  <X className="h-4 w-4" />
                  {isDeclined ? "Declined" : "Decline"}
                </Button>
              )}
              
              {/* Always show option to decline even if accepted */}
              {isConfirmed && (
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="flex items-center gap-1 bg-red-50 text-red-700 hover:bg-red-100 border-red-200"
                  onClick={() => onStatusChange(interview.id, "declined")}
                >
                  <X className="h-4 w-4" />
                  Decline
                </Button>
              )}
            </div>
            
            {interview.feedback && (
              <p className="text-sm text-muted-foreground mt-2">
                Feedback: {interview.feedback}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const InterviewTab = () => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const fetchUserInterviews = async () => {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error("No user found");

    // Get the CV associated with this user
    const { data: cv, error: cvError } = await supabase
      .from("cvs")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();
    
    if (cvError) throw cvError;
    if (!cv) return [];

    // Get all interviews for this CV
    const { data: interviews, error: interviewsError } = await supabase
      .from("interviews")
      .select("*")
      .eq("cv_id", cv.id)
      .order("scheduled_at", { ascending: true });
    
    if (interviewsError) throw interviewsError;
    
    console.log("Retrieved interviews:", interviews);
    return interviews || [];
  };

  const updateInterviewStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      console.log(`Updating interview ${id} status to ${status}`);
      const { data, error } = await supabase
        .from("interviews")
        .update({ status })
        .eq("id", id)
        .select();
      
      if (error) throw error;
      return data;
    },
    // Optimistically update local cache to immediately reflect the new status
    onMutate: async ({ id, status }) => {
      await queryClient.cancelQueries({ queryKey: ["userInterviews"] });
      const previousInterviews = queryClient.getQueryData<any[]>(["userInterviews"]);
      queryClient.setQueryData(["userInterviews"], (oldInterviews: any[] | undefined) => {
        return oldInterviews?.map(interview =>
          interview.id === id ? { ...interview, status } : interview
        );
      });
      return { previousInterviews };
    },
    onError: (error, variables, context) => {
      queryClient.setQueryData(["userInterviews"], context?.previousInterviews);
      console.error("Failed to update interview:", error);
      toast({
        title: "Failed to update",
        description: "Something went wrong. Please try again.",
        variant: "destructive",
      });
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["userInterviews"] });
      toast({
        title: variables.status === "confirmed" ? "Interview accepted" : "Interview declined",
        description: variables.status === "confirmed" ? 
          "You have successfully accepted this interview." : 
          "You have declined this interview opportunity.",
      });
    },
  });

  const handleStatusChange = (id: string, status: string) => {
    updateInterviewStatus.mutate({ id, status });
  };

  const {
    data: interviews,
    isLoading,
    isError,
    error,
    refetch
  } = useQuery({
    queryKey: ["userInterviews"],
    queryFn: fetchUserInterviews,
  });

  // Subscribe to real-time updates so UI changes immediately on database updates
  useEffect(() => {
    const channel = supabase
      .channel('table-db-changes')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'interviews'
      }, () => {
        refetch();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refetch]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-destructive">
        Error fetching interviews: {(error as Error).message}
      </div>
    );
  }

  const interviewsByDate = interviews?.filter((interview: InterviewType) => {
    if (!selectedDate) return false;
    const interviewDate = new Date(interview.scheduled_at).toDateString();
    return interviewDate === selectedDate.toDateString();
  });

  const upcomingInterviews = interviews?.filter((interview: InterviewType) => {
    const interviewDate = new Date(interview.scheduled_at);
    return interviewDate >= new Date();
  });

  // Create an array of dates with interviews
  const interviewDates = interviews?.map(interview => {
    const date = new Date(interview.scheduled_at);
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }) || [];

  // Remove duplicates
  const uniqueInterviewDates = [...new Set(interviewDates.map(date => date.toDateString()))]
    .map(dateString => new Date(dateString));

  // Mark dates that have an interview
  const isDayWithInterview = (date: Date) => {
    return uniqueInterviewDates.some(interviewDate => 
      interviewDate.toDateString() === date.toDateString()
    );
  };

  return (
    <div className="space-y-6">
      <Card className="bg-background">
        <CardHeader>
          <h3 className="text-2xl font-bold text-primary">Interview Schedule</h3>
          <p className="text-muted-foreground">
            You have {upcomingInterviews?.length || 0} upcoming interviews
          </p>
        </CardHeader>
        <CardContent>
          <div className="md:flex md:space-x-8">
            <div className="md:w-1/3">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={setSelectedDate}
                className="rounded-md border bg-background"
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                modifiers={{ interview: (date) => isDayWithInterview(date) }}
                modifiersClassNames={{ interview: "bg-primary/20 font-bold text-primary rounded-md" }}
              />
              <div className="mt-2 flex items-center justify-center text-sm">
                <div className="w-3 h-3 bg-primary/20 rounded-full mr-2"></div>
                <span className="text-muted-foreground">Scheduled Interviews</span>
              </div>
            </div>
            <div className="md:w-2/3 mt-6 md:mt-0 space-y-4">
              {interviewsByDate && interviewsByDate.length > 0 ? (
                interviewsByDate.map((interview: InterviewType) => (
                  <InterviewCard 
                    key={interview.id} 
                    interview={interview} 
                    onStatusChange={handleStatusChange}
                  />
                ))
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  No interviews scheduled on this date.
                </p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InterviewTab;
