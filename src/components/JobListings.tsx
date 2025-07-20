import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { AlertCircle, Briefcase, MapPin, Calendar, DollarSign, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { motion } from "framer-motion";

interface JobPosting {
  id: string;
  title: string;
  department: string;
  type: string;
  location: string;
  office_location?: string;
  salary_min: number;
  salary_max: number;
  description: string;
  requirements: string;
  deadline: string;
  status: "active" | "inactive";
  applications_count: number;
}

const JobListings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedJob, setSelectedJob] = useState<JobPosting | null>(null);
  const [applyingToId, setApplyingToId] = useState<string | null>(null);

  const { data: jobs, isLoading, error } = useQuery({
    queryKey: ["jobPostings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });
        
      if (error) throw error;
      return data as JobPosting[];
    }
  });

  const { data: userCV } = useQuery({
    queryKey: ["userCV"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;
      
      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .single();
      
      if (error) {
        if (typeof error === 'object' && error !== null && 'code' in error) {
          if (error.code !== 'PGRST116') {
            throw error;
          }
        } else {
          throw error;
        }
      }
      
      return data;
    },
  });
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
  const applyMutation = useMutation({
    mutationFn: async (jobId: string) => {
      if (!userCV) throw new Error("You need a CV to apply");
      
      const { error } = await supabase
        .from("cvs")
        .update({ job_id: jobId })
        .eq("id", userCV.id);
        
      if (error) throw error;
      
      const { error: rpcError } = await supabase.rpc('increment_job_applications', { job_id: jobId });
      if (rpcError) throw rpcError; // Fix: Ensure this line is complete
    },
    onMutate: (jobId) => {
      setApplyingToId(jobId);
    },
    onSuccess: (_, jobId) => {
      queryClient.invalidateQueries({ queryKey: ["jobPostings"] });
      queryClient.invalidateQueries({ queryKey: ["userCV"] });
      toast({
        title: "Application submitted",
        description: "Your application has been submitted successfully.",
      });
      setApplyingToId(null);
      setSelectedJob(null);
    },
    onError: (error) => {
      toast({
        title: "Application failed",
        description: error instanceof Error ? error.message : "Failed to submit application",
        variant: "destructive",
      });
      setApplyingToId(null);
    },
    onSettled: () => {
      setApplyingToId(null);
    }
  });

  const withdrawMutation = useMutation({
    mutationFn: async () => {
      if (!userCV) throw new Error("You don't have an active application to withdraw");
  
      // Update the CV to remove the job_id
      const { error } = await supabase
        .from("cvs")
        .update({ job_id: null })
        .eq("id", userCV.id);
  
      if (error) throw error;
  
      // Decrement the applications count for the job posting
      const { error: rpcError } = await supabase.rpc('decrement_job_applications' as any, { job_id: userCV.job_id });
      if (rpcError) throw rpcError;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jobPostings"] });
      queryClient.invalidateQueries({ queryKey: ["userCV"] });
      toast({
        title: "Application withdrawn",
        description: "You have successfully withdrawn your application.",
      });
    },
    onError: (error) => {
      toast({
        title: "Withdrawal failed",
        description: error instanceof Error ? error.message : "Failed to withdraw application",
        variant: "destructive",
      });
    },
  });

  const handleApply = (jobId: string) => {
    if (!userCV) {
      toast({
        title: "CV required",
        description: "You need to create a CV before applying to jobs.",
        variant: "destructive",
      });
      return;
    }
    
    applyMutation.mutate(jobId);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-40">
        <Spinner />
        <span className="ml-2">Loading job listings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 text-red-700 p-4 rounded-lg flex items-center">
        <AlertCircle className="h-5 w-5 mr-2" />
        <p>Failed to load job listings. Please try again.</p>
      </div>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <div className="bg-gray-50 p-8 text-center rounded-lg">
        <Briefcase className="h-12 w-12 mx-auto text-gray-400 mb-4" />
        <h3 className="text-xl font-medium mb-2">No job listings available</h3>
        <p className="text-muted-foreground">Check back later for new opportunities.</p>
      </div>
    );
  }

  const userHasApplied = userCV?.job_id !== null && userCV?.job_id !== undefined;

  return (
    <div className="space-y-6">
      <Card className="bg-secondary text-secondary-foreground p-3 rounded-lg shadow-md">
        <CardContent>
          <h2 className="text-2xl font-bold">Open Positions</h2>
          <p className="text-secondary-foreground">
            Browse through our current job openings and find your next opportunity
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {jobs.map((job) => (
          <motion.div
            key={job.id}
            whileHover={{ scale: 1.05 }} // Slight zoom-in effect
            whileTap={{ scale: 0.98 }} // Slight shrink effect on click
            className="overflow-hidden hover:shadow-lg transition-shadow min-h-[320px] rounded-lg"
          >
            <Card className="h-full">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-semibold line-clamp-2">{job.title}</h3>
                    <Badge variant="outline" className="mt-1">
                      {job.department}
                    </Badge>
                  </div>
                  <Badge>{job.type}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2 text-sm">
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{job.location === "remote" ? "Remote" : (job.office_location || job.location)}</span>
                  </div>
                  <div className="flex items-center">
                    <DollarSign className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>Deadline: {format(new Date(job.deadline), "MMM dd, yyyy")}</span>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="line-clamp-3 text-muted-foreground text-sm">
                    {job.description}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="pt-4 pb-4">
                <div className="flex flex-col space-y-2 w-full">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="w-full">
                        View Details
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle>{job.title}</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-6 py-4">
                        <div className="flex flex-wrap gap-3">
                          <Badge variant="outline">{job.department}</Badge>
                          <Badge variant="secondary">{job.type}</Badge>
                          <Badge variant="outline">{job.location}</Badge>
                          <Badge variant="outline">
                            ${job.salary_min.toLocaleString()} - ${job.salary_max.toLocaleString()}
                          </Badge>
                        </div>
                        <div>
                          <h4 className="font-semibold mb-2">Description</h4>
                          <p className="whitespace-pre-line">{job.description}</p>
                        </div>
                        <Separator />
                        <div>
                          <h4 className="font-semibold mb-2">Requirements</h4>
                          <p className="whitespace-pre-line">{job.requirements}</p>
                        </div>
                        <Separator />
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">
                              Application Deadline: {format(new Date(job.deadline), "PPP")}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {job.applications_count} applications so far
                            </p>
                          </div>
                          <Button
                            onClick={() => handleApply(job.id)}
                            disabled={userHasApplied || applyingToId === job.id}
                          >
                            {applyingToId === job.id ? (
                              <>
                                <Spinner /> Applying...
                              </>
                            ) : userHasApplied && userCV?.job_id === job.id ? (
                              <>
                                <CheckCircle /> Applied
                              </>
                            ) : userHasApplied ? (
                              "Already Applied"
                            ) : (
                              "Apply Now"
                            )}
                          </Button>
                        </div>
                      </div>
                    </DialogContent>
                  </Dialog>

                  {userHasApplied && userCV?.job_id === job.id && (
                    <Button
                      onClick={() => withdrawMutation.mutate()}
                      variant="outline"
                      className="w-full"
                    >
                      {withdrawMutation.status === "pending" ? (
                        <>
                          <Spinner /> Withdrawing...
                        </>
                      ) : (
                        "Withdraw Application"
                      )}
                    </Button>
                  )}

                  {!userHasApplied && (
                    <Button
                      onClick={() => handleApply(job.id)}
                      disabled={applyingToId === job.id}
                      className="w-full"
                    >
                      {applyingToId === job.id ? (
                        <>
                          <Spinner /> Applying...
                        </>
                      ) : (
                        "Apply Now"
                      )}
                    </Button>
                  )}
                </div>
              </CardFooter>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default JobListings;
