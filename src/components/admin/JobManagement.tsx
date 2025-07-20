
// components/admin/JobManagement.tsx
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Pencil, Trash2, Eye, Briefcase, Clock, Users, XCircle, Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import * as z from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";

// Schema for form validation
const jobFormSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  department: z.string().min(1, "Department is required"),
  type: z.string().min(1, "Job type is required"),
  location: z.string().min(1, "Location is required"),
  officeLocation: z.string().optional(),
  salaryMin: z.number().min(0, "Salary must be positive"),
  salaryMax: z.number().min(0, "Salary must be positive"),
  description: z.string().min(10, "Description must be at least 20 characters"),
  requirements: z.string().min(10, "Requirements must be at least 20 characters"),
  deadline: z.date({
    required_error: "Deadline is required",
  }),
  status: z.enum(["active", "inactive"]),
});

type JobFormValues = z.infer<typeof jobFormSchema>;

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
  applications_count: number; // Fixed property name
  created_at: string;
}

export const JobManagement = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isCreating, setIsCreating] = useState(false);
  const [editingJob, setEditingJob] = useState<JobPosting | null>(null);
  const [viewingJob, setViewingJob] = useState<JobPosting | null>(null);

  // Form setup
  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      status: "active",
    },
  });

  // Fetch job postings
  const { data: jobPostings, isLoading } = useQuery<JobPosting[]>({
    queryKey: ["job_postings"],
    queryFn: async (): Promise<JobPosting[]> => {
      const { data, error } = await supabase
        .from("job_postings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as JobPosting[];
    },
  });

  // Calculate job statistics
  const { totalJobs, activeJobs, inactiveJobs, totalApplications } = useMemo(() => {
    if (!jobPostings) return { totalJobs: 0, activeJobs: 0, inactiveJobs: 0, totalApplications: 0 };
    
    const total = jobPostings.length;
    const active = jobPostings.filter(job => job.status === "active").length;
    const inactive = total - active;
    const applications = jobPostings.reduce((sum, job) => sum + (job.applications_count || 0), 0); // Fixed property name
    
    return {
      totalJobs: total,
      activeJobs: active,
      inactiveJobs: inactive,
      totalApplications: applications
    };
  }, [jobPostings]);

  // Create/Update job mutation
  const jobMutation = useMutation({
    mutationFn: async (values: JobFormValues) => {
      const jobData = {
        title: values.title,
        department: values.department,
        type: values.type,
        location: values.location,
        office_location: values.officeLocation,
        salary_min: values.salaryMin,
        salary_max: values.salaryMax,
        description: values.description,
        requirements: values.requirements,
        deadline: format(values.deadline, "yyyy-MM-dd"),
        status: values.status,
      };

      if (editingJob) {
        const { error } = await supabase
          .from("job_postings")
          .update(jobData)
          .eq("id", editingJob.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("job_postings")
          .insert([{ ...jobData, applications_count: 0 }]); // Fixed property name
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_postings"] });
      toast({
        title: editingJob ? "Job updated" : "Job posted",
        description: editingJob 
          ? "The job listing has been updated" 
          : "The job listing is now live",
      });
      setIsCreating(false);
      setEditingJob(null);
      form.reset();
    },
    onError: (error: { message: string }) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete job mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("job_postings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["job_postings"] });
      toast({
        title: "Job deleted",
        description: "The job listing has been removed",
      });
    },
    onError: (error: { message: string }) => {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle form submit
  const onSubmit = (values: JobFormValues) => {
    if (!values.description.trim()) {
      form.setError("description", {
        type: "manual",
        message: "Description is required",
      });
      return;
    }
  
    if (!values.requirements.trim()) {
      form.setError("requirements", {
        type: "manual",
        message: "Requirements are required",
      });
      return;
    }
  
    jobMutation.mutate(values);
  };

  // Set form values when editing
  const handleEdit = (job: JobPosting) => {
    setEditingJob(job);
    form.reset({
      title: job.title,
      department: job.department,
      type: job.type,
      location: job.location,
      officeLocation: job.office_location,
      salaryMin: job.salary_min,
      salaryMax: job.salary_max,
      description: job.description,
      requirements: job.requirements,
      deadline: new Date(job.deadline),
      status: job.status,
    });
    setIsCreating(true);
  };

  // Reset form when canceling
  const handleCancel = () => {
    setIsCreating(false);
    setEditingJob(null);
    form.reset();
  };

  return (
    <div className="space-y-6 bg-secondary rounded-xl p-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Job Management Dashboard</h2>
        <Button onClick={() => setIsCreating(true)} className="bg-primary hover:bg-primary/90 text-white">
          + Create New Job Posting
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-white/80 backdrop-blur border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Briefcase className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalJobs}</p>
                <p className="text-sm text-gray-500">Total job postings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{activeJobs}</p>
                <p className="text-sm text-gray-500">Active job postings</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{totalApplications}</p>
                <p className="text-sm text-gray-500">Total applications</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-none shadow-none">
          <CardContent className="p-6">
            <div className="flex items-start space-x-4">
              <div className="bg-primary/10 p-3 rounded-full">
                <XCircle className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold">{inactiveJobs}</p>
                <p className="text-sm text-gray-500">Inactive job postings</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {(isCreating || editingJob) && (
        <Card className="bg-white/80 backdrop-blur border-none shadow-none rounded-xl">
          <CardHeader>
            <h3 className="text-lg font-semibold">
              {editingJob ? "Edit Job Posting" : "Create New Job Posting"}
            </h3>
          </CardHeader>
          <CardContent>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Job Title*</Label>
                  <Input
                    {...form.register("title")}
                    className={form.formState.errors.title ? "border-red-500" : ""}
                  />
                  {form.formState.errors.title && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.title.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Department*</Label>
                  <Select
                    onValueChange={(value) => form.setValue("department", value)}
                    value={form.watch("department")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="engineering">Engineering</SelectItem>
                      <SelectItem value="design">Design</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="hr">Human Resources</SelectItem>
                      <SelectItem value="operations">Operations</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.department && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.department.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Job Type*</Label>
                  <Select
                    onValueChange={(value) => form.setValue("type", value)}
                    value={form.watch("type")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select job type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full-time">Full-time</SelectItem>
                      <SelectItem value="part-time">Part-time</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="internship">Internship</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.type && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.type.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Location*</Label>
                  <Select
                    onValueChange={(value) => form.setValue("location", value)}
                    value={form.watch("location")}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select location" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="remote">Remote</SelectItem>
                      <SelectItem value="office">Office</SelectItem>
                      <SelectItem value="hybrid">Hybrid</SelectItem>
                    </SelectContent>
                  </Select>
                  {form.formState.errors.location && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.location.message}
                    </p>
                  )}
                  {form.watch("location") !== "remote" && (
                    <Input
                      placeholder="Office location"
                      {...form.register("officeLocation")}
                      className="mt-2"
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Salary Range*</Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Minimum"
                      {...form.register("salaryMin", { valueAsNumber: true })}
                      className={form.formState.errors.salaryMin ? "border-red-500" : ""}
                    />
                    <Input
                      type="number"
                      placeholder="Maximum"
                      {...form.register("salaryMax", { valueAsNumber: true })}
                      className={form.formState.errors.salaryMax ? "border-red-500" : ""}
                    />
                  </div>
                  {(form.formState.errors.salaryMin || form.formState.errors.salaryMax) && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.salaryMin?.message || form.formState.errors.salaryMax?.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Application Deadline*</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !form.watch("deadline") && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {form.watch("deadline") ? (
                          format(form.watch("deadline"), "PPP")
                        ) : (
                          <span>Pick a date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={form.watch("deadline")}
                        onSelect={(date) => form.setValue("deadline", date as Date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {form.formState.errors.deadline && (
                    <p className="text-sm text-red-500">
                      {form.formState.errors.deadline.message}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label>Job Description*</Label>
                <Textarea
                  {...form.register("description")}
                  className={form.formState.errors.description ? "border-red-500" : ""}
                  rows={5}
                />
                {form.formState.errors.description && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.description.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label>Requirements*</Label>
                <Textarea
                  {...form.register("requirements")}
                  className={form.formState.errors.requirements ? "border-red-500" : ""}
                  rows={5}
                />
                {form.formState.errors.requirements && (
                  <p className="text-sm text-red-500">
                    {form.formState.errors.requirements.message}
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Switch
                    checked={form.watch("status") === "active"}
                    onCheckedChange={(checked) =>
                      form.setValue("status", checked ? "active" : "inactive")
                    }
                    id="job-status"
                  />
                  <Label htmlFor="job-status">
                    {form.watch("status") === "active" ? "Active" : "Inactive"}
                  </Label>
                </div>

                <div className="space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={jobMutation.isPending}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={jobMutation.isPending}>
                    {jobMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : editingJob ? (
                      "Update Job"
                    ) : (
                      "Post Job"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card className="bg-white/80 backdrop-blur border-none shadow-none rounded-xl overflow-hidden">
        <CardHeader>
          <h3 className="text-lg font-semibold">Job Listings</h3>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-secondary/50">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Deadline</TableHead>
                <TableHead>Applications</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : jobPostings?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No job postings yet. Create your first one!
                  </TableCell>
                </TableRow>
              ) : (
                jobPostings?.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.title}</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {job.department.charAt(0).toUpperCase() + job.department.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {job.type.charAt(0).toUpperCase() + job.type.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {job.deadline ? format(new Date(job.deadline), "MMM dd, yyyy") : "N/A"}
                    </TableCell>
                    <TableCell>{job.applications_count || 0}</TableCell>
                    <TableCell>
                      <Badge variant={job.status === "active" ? "default" : "outline"}>
                        {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(job)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            type="button"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl">
                          <DialogHeader>
                            <DialogTitle>{job.title}</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label>Department</Label>
                                <p>{job.department}</p>
                              </div>
                              <div>
                                <Label>Job Type</Label>
                                <p>{job.type}</p>
                              </div>
                              <div>
                                <Label>Location</Label>
                                <p>
                                  {job.location === "remote" 
                                    ? "Remote" 
                                    : job.office_location || job.location}
                                </p>
                              </div>
                              <div>
                                <Label>Salary Range</Label>
                                <p>
                                  ${job.salary_min} - ${job.salary_max}
                                </p>
                              </div>
                              <div>
                                <Label>Deadline</Label>
                                <p>
                                  {job.deadline ? format(new Date(job.deadline), "MMM dd, yyyy") : "N/A"}
                                </p>
                              </div>
                              <div>
                                <Label>Status</Label>
                                <p>
                                  <Badge variant={job.status === "active" ? "default" : "outline"}>
                                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                                  </Badge>
                                </p>
                              </div>
                            </div>
                            <div>
                              <Label>Description</Label>
                              <div className="prose max-w-none">
                                {job.description}
                              </div>
                            </div>
                            <div>
                              <Label>Requirements</Label>
                              <div className="prose max-w-none">
                                {job.requirements}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteMutation.mutate(job.id)}
                        disabled={deleteMutation.isPending}
                      >
                        {deleteMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-500" />
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
