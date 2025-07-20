import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { FileText, MessageSquare, User, Calendar, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import Messages from "@/components/Messages";
import InterviewTab from "@/components/InterviewTab";
import { supabase } from "@/integrations/supabase/client";
import JobListings from "@/components/JobListings";
import ProfileTab from "@/components/ProfileTab";
import { motion } from "framer-motion";

const ClientDashboard = () => {
  const [authCheckComplete, setAuthCheckComplete] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Authentication Required",
          description: "Please log in to access this page",
          variant: "destructive",
        });
        navigate("/applicant/login");
      } else {
        setAuthCheckComplete(true);
      }
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT") {
        navigate("/applicant/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate, toast]);

  const { data: existingCV, isLoading, error: cvError } = useQuery({
    queryKey: ["userCV"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: authCheckComplete,
  });

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      toast({
        title: "Success",
        description: "You have been logged out successfully",
      });
      navigate("/");
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to log out",
        variant: "destructive",
      });
    }
  };

  if (!authCheckComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <motion.div
          className="flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Spinner />
        </motion.div>
        <span className="ml-2">Checking authentication...</span>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-primary">
        <motion.div
          className="flex items-center justify-center"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1 }}
        >
          <Spinner />
        </motion.div>
        <span className="ml-2">Loading your profile...</span>
      </div>
    );
  }

  if (cvError) {
    return (
      <div className="min-h-screen flex items-center justify-center flex-col bg-primary p-8">
        <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-4 max-w-md flex items-center">
          <p>Error loading your CV: {cvError.message}</p>
        </div>
        <Button variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["userCV"] })}>
          Try Again
        </Button>
        <Button variant="ghost" onClick={handleLogout} className="mt-2">
          Logout
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16404D] to-[#2C768D] relative overflow-hidden">
      {/* Decorative Circles */}
      <div className="absolute w-[500px] h-[500px] bg-indigo-100/30 rounded-full -top-64 -right-64" />
      <div className="absolute w-[500px] h-[500px] bg-blue-100/30 rounded-full -bottom-64 -left-64" />

      <div className="max-w-4xl mx-auto space-y-8 relative z-10 pt-16">
        {/* Header */}
        <div className="flex justify-between items-center">
          <motion.h1
            className="text-4xl font-karla font-semibold text-white"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            {existingCV ? `Welcome back, ${existingCV.applicant_name}` : "Welcome to the Recruitment Portal"}
          </motion.h1>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button variant="destructive" className="rounded-xl gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </motion.div>
        </div>

        {/* Tabs */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Tabs defaultValue="jobs" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="jobs" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Job Listings
              </TabsTrigger>
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="interviews" className="flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Interviews
              </TabsTrigger>
              <TabsTrigger value="messages" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Messages
              </TabsTrigger>
            </TabsList>

            <TabsContent value="jobs">
              <JobListings />
            </TabsContent>

            <TabsContent value="profile">
              <ProfileTab />
            </TabsContent>

            <TabsContent value="interviews">
              <InterviewTab />
            </TabsContent>

            <TabsContent value="messages">
              <Card>
                <CardHeader>
                  <h2 className="text-2xl font-medium font-karla">Messages</h2>
                  <p className="text-muted-foreground font-inconsolata">
                    View messages from administrators
                  </p>
                </CardHeader>
                <CardContent>
                  <Messages />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </motion.div>
      </div>
    </div>
  );
};

export default ClientDashboard;
