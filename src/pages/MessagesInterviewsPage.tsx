import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { LogOut, ChevronRight, Clock, Check, X, Calendar as CalendarIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { Sidebar } from "@/components/admin/Sidebar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardHeader } from "@/components/admin/DashboardHeader";

type CV = Database["public"]["Tables"]["cvs"]["Row"];
type Interview = (Database["public"]["Tables"]["interviews"]["Row"] & { 
  cvs?: { applicant_name: string } 
});

const generateTimeSlots = () => {
  const timeSlots = [];
  for (let hour = 9; hour <= 18; hour++) {
    for (let minute of [0, 30]) {
      if (hour === 18 && minute === 30) continue;
      const period = hour >= 12 ? 'PM' : 'AM';
      const displayHour = hour > 12 ? hour - 12 : hour;
      const formattedHour = displayHour === 0 ? 12 : displayHour;
      const formattedMinute = minute === 0 ? '00' : minute;
      const timeString = `${formattedHour}:${formattedMinute} ${period}`;
      timeSlots.push(timeString);
    }
  }
  return timeSlots;
};

const MessagesInterviewsPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedCvId, setSelectedCvId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  
  const timeSlots = generateTimeSlots();

  // Fetch company settings
  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching settings:", error);
        throw error;
      }
      
      return data || { company_name: "Cona" };
    },
  });

  // Fetch all CVs
  const { data: cvs, isLoading: cvsLoading } = useQuery({
    queryKey: ["cvs"],
    queryFn: async () => {
      console.log("Fetching CVs");
      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .order("application_date", { ascending: false });
      
      if (error) {
        console.error("Error fetching CVs:", error);
        throw error;
      }
      console.log("CVs fetched:", data);
      return data as CV[];
    },
  });

  // Fetch all interviews
  const { data: interviews, isLoading: interviewsLoading } = useQuery({
    queryKey: ["interviews"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("interviews")
        .select("*, cvs(applicant_name)")
        .order("scheduled_at", { ascending: true });
      
      if (error) throw error;
      return data as Interview[];
    },
  });

  // Mutation for sending messages
  const { mutate: sendMessage, isPending: isSendingMessage } = useMutation({
    mutationFn: async (data: { cv_id: string; message: string }) => {
      console.log("Sending message with cv_id:", data.cv_id);
      const { error } = await supabase
        .from("messages")
        .insert([
          {
            cv_id: data.cv_id,
            message: data.message,
            read: false,
          },
        ]);
      
      if (error) {
        console.error("Error sending message:", error);
        throw error;
      }
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: `Failed to send message: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Mutation for scheduling/rescheduling an interview
  const { mutate: updateInterviewDate, isPending: isUpdatingInterview } = useMutation({
    mutationFn: async (data: { cv_id: string; date: Date; time: string }) => {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error("User not authenticated");

      console.log("Checking for existing interview with cv_id:", data.cv_id);
      const { data: existingInterview, error: fetchError } = await supabase
        .from("interviews")
        .select("id")
        .eq("cv_id", data.cv_id)
        .maybeSingle();

      if (fetchError) {
        console.error("Error checking existing interview:", fetchError);
        throw fetchError;
      }

      console.log("Existing interview check result:", existingInterview);

      // Parse the selected time string (e.g., "2:30 PM")
      const timeRegex = /^(\d{1,2}):(\d{2})\s(AM|PM)$/;
      const match = data.time.match(timeRegex);
      
      if (!match) {
        throw new Error("Invalid time format");
      }
      
      let hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      const period = match[3];
      
      if (period === 'PM' && hours !== 12) {
        hours += 12;
      } else if (period === 'AM' && hours === 12) {
        hours = 0;
      }
      
      const scheduledDate = new Date(data.date);
      scheduledDate.setHours(hours, minutes, 0, 0);
      
      console.log("Scheduled date with time:", scheduledDate);

      if (existingInterview) {
        console.log("Updating existing interview:", existingInterview.id);
        const { error } = await supabase
          .from("interviews")
          .update({
            scheduled_at: scheduledDate.toISOString(),
            updated_at: new Date().toISOString(),
            recruiter_id: user.id,
            status: "scheduled", // Reset status on rescheduling
          })
          .eq("id", existingInterview.id);
        
        if (error) {
          console.error("Interview update error:", error);
          throw error;
        }
      } else {
        console.log("Creating new interview for cv_id:", data.cv_id);
        console.log("Current user ID (recruiter_id):", user.id);
        const { error } = await supabase
          .from("interviews")
          .insert([
            {
              cv_id: data.cv_id,
              scheduled_at: scheduledDate.toISOString(),
              status: "scheduled",
              recruiter_id: user.id,
            },
          ]);
        
        if (error) {
          console.error("Interview insertion error:", error);
          throw error;
        }
      }

      const { data: cv, error: cvError } = await supabase
        .from("cvs")
        .select("applicant_name")
        .eq("id", data.cv_id)
        .single();

      if (cvError) {
        console.error("Error fetching CV:", cvError);
        throw cvError;
      }

      const companyName = settings?.company_name || "Cona";
      const interviewType = existingInterview ? "rescheduled" : "scheduled";
      const interviewMessage = `Hello ${cv.applicant_name}, your interview with ${companyName} has been ${interviewType} for ${format(scheduledDate, "EEEE, MMMM do, yyyy")} at ${data.time}. Please make sure you're available at this time.`;
      
      const { error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            cv_id: data.cv_id,
            message: interviewMessage,
            read: false,
          },
        ]);
      
      if (messageError) {
        console.error("Error sending interview message:", messageError);
        throw messageError;
      }
      
      return true;
    },
    onSuccess: () => {
      toast({
        title: "Interview scheduled",
        description: "The interview has been scheduled successfully",
      });
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedCvId(null);
      queryClient.invalidateQueries({ queryKey: ["interviews"] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
    },
    onError: (error: any) => {
      console.error("Failed to schedule interview:", error);
      toast({
        title: "Error",
        description: `Failed to schedule interview: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  // Separate CV filters based on their statuses
  const acceptedCvs = cvs?.filter(cv => cv.status === "accepted") || [];
  const rejectedCvs = cvs?.filter(cv => cv.status === "rejected") || [];
  
  const scheduledInterviews = interviews?.filter(interview => 
    interview.status === "scheduled" || 
    interview.status === "confirmed" || 
    interview.status === "pending" || 
    interview.status === "declined"
  ) || [];
  
  console.log("Scheduled Interviews:", scheduledInterviews);
  console.log("Accepted CVs:", acceptedCvs);
  console.log("Rejected CVs:", rejectedCvs);

  const findInterviewForCv = (cvId: string) => {
    return interviews?.find(interview => interview.cv_id === cvId);
  };

  const handleSendMessage = (cvId: string) => {
    if (message.trim()) {
      sendMessage({
        cv_id: cvId,
        message: message.trim(),
      });
    }
  };

  const handleUpdateInterviewDate = () => {
    if (selectedCvId && selectedDate && selectedTime) {
      updateInterviewDate({
        cv_id: selectedCvId,
        date: selectedDate,
        time: selectedTime,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Accepted</Badge>;
      case 'declined':
        return <Badge className="bg-red-100 text-red-800 hover:bg-red-200">Declined</Badge>;
      default:
        return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200">Awaiting Response</Badge>;
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (cvsLoading || interviewsLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-primary relative md:flex flex-col items-center justify-center p-8 min-h-screen">
      <Sidebar />

      <div className="ml-[88px] p-6 w-full">
        <div className="bg-secondary backdrop-blur rounded-xl p-6 mb-6">
          <DashboardHeader />
        </div>

        <Tabs defaultValue="interviews" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-6">
            <TabsTrigger value="interviews">Interviews</TabsTrigger>
            <TabsTrigger value="accepted">Accepted CVs</TabsTrigger>
            <TabsTrigger value="rejected">Rejected CVs</TabsTrigger>
          </TabsList>

          {/* Interviews Tab */}
          <TabsContent value="interviews">
            <div className="grid grid-cols-1 gap-4">
              {scheduledInterviews.length > 0 ? (
                scheduledInterviews.map((interview) => {
                  const cv = cvs?.find(cv => cv.id === interview.cv_id);
                  return (
                    <Card key={interview.id} className="bg-white shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <div className="bg-primary/10 p-3 rounded-full mt-1">
                              <CalendarIcon className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-lg">{interview.cvs?.applicant_name || "Candidate"}</h3>
                                {getStatusBadge(interview.status || 'scheduled')}
                              </div>
                              <p className="text-sm text-gray-500">
                                {cv?.current_job_title || "Applicant"} • {cv?.years_experience} years
                              </p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {cv?.skills && cv.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {cv?.skills && cv.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{cv.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              <p className="mt-2 text-sm">
                                <span className="font-medium">Interview:</span>{" "}
                                {format(new Date(interview.scheduled_at), "PPP 'at' p")}
                              </p>
                              {interview.status === "confirmed" && (
                                <p className="mt-1 text-sm text-green-600 font-medium">
                                  Candidate has accepted this interview
                                </p>
                              )}
                              {interview.status === "declined" && (
                                <p className="mt-1 text-sm text-red-600 font-medium">
                                  Candidate has declined this interview
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            {interview.status !== "declined" && (
                              <Popover>
                                <PopoverTrigger asChild>
                                  <Button variant="outline" size="sm">
                                    Reschedule
                                  </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="end">
                                  <div className="p-4">
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium mb-2">
                                        Select Date
                                      </label>
                                      <Calendar
                                        mode="single"
                                        selected={selectedDate}
                                        onSelect={(date) => {
                                          setSelectedDate(date);
                                          setSelectedCvId(interview.cv_id || null);
                                        }}
                                        disabled={(date) =>
                                          date < new Date(new Date().setHours(0, 0, 0, 0))
                                        }
                                        initialFocus
                                        className="pointer-events-auto"
                                      />
                                    </div>
                                    
                                    <div className="mb-4">
                                      <label className="block text-sm font-medium mb-2">
                                        Select Time
                                      </label>
                                      <Select value={selectedTime} onValueChange={setSelectedTime}>
                                        <SelectTrigger className="w-full">
                                          <SelectValue placeholder="Select a time">
                                            {selectedTime || <div className="flex items-center"><Clock className="mr-2 h-4 w-4" /> Select time</div>}
                                          </SelectValue>
                                        </SelectTrigger>
                                        <SelectContent>
                                          {timeSlots.map((time) => (
                                            <SelectItem key={time} value={time}>
                                              {time}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                    
                                    <div className="flex justify-end mt-4">
                                      <Button 
                                        size="sm" 
                                        onClick={handleUpdateInterviewDate}
                                        disabled={!selectedDate || !selectedTime || !selectedCvId || isUpdatingInterview}
                                      >
                                        Reschedule Interview
                                      </Button>
                                    </div>
                                  </div>
                                </PopoverContent>
                              </Popover>
                            )}
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Send Message
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                  <h4 className="font-medium">Send Message to {interview.cvs?.applicant_name}</h4>
                                  <Input
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                  />
                                  <div className="flex justify-end">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSendMessage(interview.cv_id || '')}
                                      disabled={!message.trim() || isSendingMessage || !interview.cv_id}
                                    >
                                      Send
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            {interview.cv_id && (
                              <Button variant="outline" size="sm" onClick={() => navigate(`/admin/cv/${interview.cv_id}`)}>
                                View CV <ChevronRight className="ml-2 h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center p-8 bg-white rounded-lg">
                  <p className="text-gray-500">No scheduled interviews yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Accepted CVs Tab */}
          <TabsContent value="accepted">
            <div className="grid grid-cols-1 gap-4">
              {acceptedCvs.length > 0 ? (
                acceptedCvs.map((cv) => {
                  const interview = findInterviewForCv(cv.id);
                  return (
                    <Card key={cv.id} className="bg-white shadow-sm">
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-4">
                            <Avatar className="h-12 w-12 mt-1">
                              {cv.avatar_url ? (
                                <AvatarImage src={cv.avatar_url} alt={cv.applicant_name} />
                              ) : (
                                <AvatarFallback>{cv.applicant_name.charAt(0)}</AvatarFallback>
                              )}
                            </Avatar>
                            <div>
                              <h3 className="font-bold text-lg">{cv.applicant_name}</h3>
                              <p className="text-sm text-gray-500">{cv.current_job_title || "Applicant"} • {cv.years_experience} years</p>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {cv.skills && cv.skills.slice(0, 3).map((skill, index) => (
                                  <Badge key={index} variant="secondary" className="text-xs">
                                    {skill}
                                  </Badge>
                                ))}
                                {cv.skills && cv.skills.length > 3 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{cv.skills.length - 3} more
                                  </Badge>
                                )}
                              </div>
                              {interview && (
                                <div className="mt-2">
                                  <p className="text-sm">
                                    <span className="font-medium">Interview:</span>{" "}
                                    {format(new Date(interview.scheduled_at), "PPP 'at' p")}
                                  </p>
                                  {interview.status === "confirmed" && (
                                    <p className="mt-1 text-sm text-green-600 font-medium">
                                      Interview accepted
                                    </p>
                                  )}
                                  {interview.status === "declined" && (
                                    <p className="mt-1 text-sm text-red-600 font-medium">
                                      Interview declined
                                    </p>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col gap-2">
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Schedule Interview
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="end">
                                <div className="p-4">
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                      Select Date
                                    </label>
                                    <Calendar
                                      mode="single"
                                      selected={selectedDate}
                                      onSelect={(date) => {
                                        setSelectedDate(date);
                                        setSelectedCvId(cv.id);
                                      }}
                                      disabled={(date) =>
                                        date < new Date(new Date().setHours(0, 0, 0, 0))
                                      }
                                      initialFocus
                                      className="pointer-events-auto"
                                    />
                                  </div>
                                  
                                  <div className="mb-4">
                                    <label className="block text-sm font-medium mb-2">
                                      Select Time
                                    </label>
                                    <Select value={selectedTime} onValueChange={setSelectedTime}>
                                      <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Select a time">
                                          {selectedTime || <div className="flex items-center"><Clock className="mr-2 h-4 w-4" /> Select time</div>}
                                        </SelectValue>
                                      </SelectTrigger>
                                      <SelectContent>
                                        {timeSlots.map((time) => (
                                          <SelectItem key={time} value={time}>
                                            {time}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                  
                                  <div className="flex justify-end mt-4">
                                    <Button 
                                      size="sm" 
                                      onClick={handleUpdateInterviewDate}
                                      disabled={!selectedDate || !selectedTime || selectedCvId !== cv.id || isUpdatingInterview}
                                    >
                                      {interview ? 'Update Interview' : 'Schedule Interview'}
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>
                            
                            <Popover>
                              <PopoverTrigger asChild>
                                <Button variant="outline" size="sm">
                                  Send Message
                                </Button>
                              </PopoverTrigger>
                              <PopoverContent className="w-80" align="end">
                                <div className="space-y-4">
                                  <h4 className="font-medium">Send Message to {cv.applicant_name}</h4>
                                  <Input
                                    placeholder="Type your message here..."
                                    value={message}
                                    onChange={(e) => setMessage(e.target.value)}
                                  />
                                  <div className="flex justify-end">
                                    <Button 
                                      size="sm" 
                                      onClick={() => handleSendMessage(cv.id)}
                                      disabled={!message.trim() || isSendingMessage}
                                    >
                                      Send
                                    </Button>
                                  </div>
                                </div>
                              </PopoverContent>
                            </Popover>

                            <Button variant="outline" size="sm" onClick={() => navigate(`/admin/cv/${cv.id}`)}>
                              View CV <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              ) : (
                <div className="text-center p-8 bg-white rounded-lg">
                  <p className="text-gray-500">No accepted applications yet</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Rejected CVs Tab */}
          <TabsContent value="rejected">
            <div className="grid grid-cols-1 gap-4">
              {rejectedCvs.length > 0 ? (
                rejectedCvs.map((cv) => (
                  <Card key={cv.id} className="bg-white shadow-sm">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <Avatar className="h-12 w-12 mt-1">
                            {cv.avatar_url ? (
                              <AvatarImage src={cv.avatar_url} alt={cv.applicant_name} />
                            ) : (
                              <AvatarFallback>{cv.applicant_name.charAt(0)}</AvatarFallback>
                            )}
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">{cv.applicant_name}</h3>
                            <p className="text-sm text-gray-500">{cv.current_job_title || "Applicant"} • {cv.years_experience} years</p>
                            <div className="flex flex-wrap gap-2 mt-2">
                              {cv.skills && cv.skills.slice(0, 3).map((skill, index) => (
                                <Badge key={index} variant="secondary" className="text-xs">
                                  {skill}
                                </Badge>
                              ))}
                              {cv.skills && cv.skills.length > 3 && (
                                <Badge variant="outline" className="text-xs">
                                  +{cv.skills.length - 3} more
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex flex-col gap-2">
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button variant="outline" size="sm">
                                Send Message
                              </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-80" align="end">
                              <div className="space-y-4">
                                <h4 className="font-medium">Send Message to {cv.applicant_name}</h4>
                                <Input
                                  placeholder="Type your message here..."
                                  value={message}
                                  onChange={(e) => setMessage(e.target.value)}
                                />
                                <div className="flex justify-end">
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleSendMessage(cv.id)}
                                    disabled={!message.trim() || isSendingMessage}
                                  >
                                    Send
                                  </Button>
                                </div>
                              </div>
                            </PopoverContent>
                          </Popover>

                          <Button variant="outline" size="sm" onClick={() => navigate(`/admin/cv/${cv.id}`)}>
                            View CV <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center p-8 bg-white rounded-lg">
                  <p className="text-gray-500">No rejected applications yet</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default MessagesInterviewsPage;
