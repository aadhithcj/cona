
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LoginPage from "@/components/LoginPage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const ApplicantLogin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user is already logged in
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        console.log("User already authenticated, redirecting to dashboard");
        navigate("/client/dashboard");
      }
    };
    
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth state changed:", event);
      if (event === 'SIGNED_IN' && session) {
        console.log("User signed in, redirecting to dashboard");
        navigate("/client/dashboard");
      } else if (event === 'SIGNED_OUT') {
        console.log("User signed out");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <LoginPage 
      type="applicant" 
      onSuccess={(user) => {
        console.log("Login successful", user);
        toast({
          title: "Login Successful",
          description: "Welcome back! You're now signed in.",
        });
      }}
      onError={(error) => {
        console.error("Login error", error);
        toast({
          title: "Login Failed",
          description: error.message,
          variant: "destructive",
        });
      }}
    />
  );
};

export default ApplicantLogin;
