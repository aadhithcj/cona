import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Button } from "@/components/ui/button";
import CVDisplay from "@/components/CVDisplay";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Check, X, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const CVDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: cv, isLoading, error } = useQuery({
    queryKey: ["cv", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("cvs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      return data;
    },
  });

  const { data: adminUser } = useQuery({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { isAdmin: false };
      
      const { data, error } = await supabase
        .from("admin_users")
        .select("is_admin")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return { isAdmin: data?.is_admin || false };
    },
  });

  const isAdmin = adminUser?.isAdmin || false;

  const { mutate: updateStatus, isPending } = useMutation({
    mutationFn: async ({ status, reason }: { status: "accepted" | "rejected", reason?: string }) => {
      console.log(`Updating CV status to: ${status}, reason: ${reason || 'N/A'}`);
      
      const { data, error: cvError } = await supabase
        .from("cvs")
        .update({ status })
        .eq("id", id as string)
        .select();
      
      if (cvError) {
        console.error("Error updating CV status:", cvError);
        throw cvError;
      }

      const messageText = status === "accepted" 
        ? "Congratulations! Your application has been accepted. We will contact you soon to schedule an interview." 
        : `We regret to inform you that your application has been rejected. The main area that needs improvement is: ${reason || 'overall profile'}`;

      const { error: messageError } = await supabase
        .from("messages")
        .insert([
          {
            cv_id: id,
            message: messageText,
            read: false,
          },
        ]);
      
      if (messageError) {
        console.error(`Error sending ${status} message:`, messageError);
        throw messageError;
      }

      return { status };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["cvs"] });
      queryClient.invalidateQueries({ queryKey: ["cv", id] });
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      
      toast({
        title: `Application ${data.status === "accepted" ? "Accepted" : "Rejected"}`,
        description: data.status === "accepted" 
          ? "The candidate has been moved to the accepted pool." 
          : "A rejection message has been sent to the candidate.",
      });
    },
    onError: (error) => {
      console.error("Mutation error:", error);
      toast({
        title: "Error",
        description: `Failed to update status: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  const handleEdit = () => {
    console.log("Edit CV clicked");
  };

  const handleBack = () => {
    navigate(-1); // Go back to the previous page
  };

  const findWeakestArea = () => {
    if (!cv) return "overall experience";
    
    if (cv.years_experience < 2) return "work experience";
    if (!cv.languages_known || cv.languages_known.length < 3) return "language proficiency";
    if (!cv.education) return "educational background";
    if (!cv.certifications) return "professional certifications";
    if (cv.skills.length < 3) return "technical skills";
    
    return "overall fit for the position";
  };

  const handleAccept = () => {
    console.log("Accept button clicked");
    updateStatus({ status: "accepted" });
  };

  const handleReject = () => {
    const reason = findWeakestArea();
    console.log("Reject button clicked with reason:", reason);
    updateStatus({ status: "rejected", reason });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-red-500">Error loading CV: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="bg-primary min-h-screen p-8 flex flex-col items-center">
      <div className="w-full max-w-3xl">
        <Button 
          variant="outline" 
          className="mb-4" 
          onClick={handleBack}
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Back
        </Button>
        <Card className="bg-background backdrop-blur border-none">
          <CardHeader className="p-6 border-b border-gray-200">
            <CardTitle className="text-2xl font-bold">CV Detail</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <CVDisplay cv={cv} onEdit={handleEdit} isAdmin={isAdmin} />
          </CardContent>
          <CardFooter className="p-6 border-t border-gray-200 flex justify-between">
            {!isAdmin && <Button onClick={handleEdit}>Edit CV</Button>}
            
            <div className="flex gap-2">
              {/* Always show status action buttons for admin users */}
              {isAdmin && (
                <>
                  {cv.status === "accepted" ? (
                    <Button 
                      variant="destructive" 
                      onClick={handleReject}
                      disabled={isPending}
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Change to Rejected
                    </Button>
                  ) : cv.status === "rejected" ? (
                    <Button 
                      variant="default" 
                      onClick={handleAccept}
                      disabled={isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" /> Change to Accepted
                    </Button>
                  ) : (
                    <>
                      <Button 
                        variant="destructive" 
                        onClick={handleReject}
                        disabled={isPending}
                      >
                        <X className="mr-2 h-4 w-4" /> Reject
                      </Button>
                      <Button 
                        variant="default" 
                        onClick={handleAccept}
                        disabled={isPending}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        <Check className="mr-2 h-4 w-4" /> Accept
                      </Button>
                    </>
                  )}
                </>
              )}
              
              {/* For non-admin users, show read-only status indicators */}
              {!isAdmin && (
                <>
                  {cv.status === "accepted" && (
                    <Button variant="secondary" disabled>
                      <Check className="mr-2 h-4 w-4" /> Accepted
                    </Button>
                  )}
                  {cv.status === "rejected" && (
                    <Button variant="secondary" disabled>
                      <X className="mr-2 h-4 w-4" /> Rejected
                    </Button>
                  )}
                </>
              )}
            </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};

export default CVDetail;