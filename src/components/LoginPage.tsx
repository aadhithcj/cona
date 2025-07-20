// LoginPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { User2, Lock, ArrowLeft, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "framer-motion";

interface LoginPageProps {
  type: "admin" | "applicant";
  customAuthHandler?: (email: string, password: string) => Promise<boolean>;
  defaultEmail?: string;
  onSuccess?: (user: any) => void;
  onError?: (error: any) => void;
}

const LoginPage = ({
  type,
  customAuthHandler,
  defaultEmail,
  onSuccess,
  onError,
}: LoginPageProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState(defaultEmail || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (type === "applicant") {
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        (event, session) => {
          if (event === "SIGNED_IN" && session) {
            console.log("LoginPage detected sign in");
          }
        }
      );

      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) {
          console.log("Session found in LoginPage");
          navigate("/client/dashboard");
        }
      });

      return () => subscription.unsubscribe();
    }
  }, [navigate, type]);

  const validatePassword = (password: string) => {
    if (password.length < 6) {
      return "Password must be at least 6 characters long";
    }
    return null;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (type === "admin" && customAuthHandler) {
        const success = await customAuthHandler(email, password);
        if (success) {
          toast({ title: "Login successful", description: "Welcome back, admin!" });
          navigate("/admin/dashboard");
        }
        return;
      }

      if (isSignUp) {
        const passwordError = validatePassword(password);
        if (passwordError) {
          toast({
            title: "Validation Error",
            description: passwordError,
            variant: "destructive",
          });
          if (onError) onError({ message: passwordError });
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/client/dashboard`,
          },
        });

        if (error) {
          toast({
            title: "Signup failed",
            description: error.message,
            variant: "destructive",
          });
          if (onError) onError(error);
        } else if (data.user) {
          toast({
            title: "Signup successful",
            description: "Please check your email to verify your account.",
          });
          if (onSuccess) onSuccess(data.user);
          setEmail("");
          setPassword("");
          setIsSignUp(false);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          toast({
            title: "Login failed",
            description: error.message,
            variant: "destructive",
          });
          if (onError) onError(error);
        } else if (data.user) {
          toast({
            title: "Login successful",
            description: "Welcome back!",
          });
          if (onSuccess) onSuccess(data.user);
          navigate("/client/dashboard");
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#16404D] to-[#2C768D] relative overflow-hidden">
      <div className="absolute w-[500px] h-[500px] bg-indigo-100/30 rounded-full -top-64 -right-64" />
      <div className="absolute w-[500px] h-[500px] bg-blue-100/30 rounded-full -bottom-64 -left-64" />

      <div className="relative min-h-screen container grid lg:grid-cols-2">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="hidden lg:flex flex-col items-center justify-center"
        >
          <div className="flex flex-col items-center">
            <h1 className="text-7xl font-bold bg-gradient-to-r from-[#FBF5DD] to-[#AAA591] bg-clip-text text-transparent font-['Karla']">
              Cona
            </h1>
            <p className="text-2xl font-medium text-secondary tracking-wider font-['Inconsolata']">
              CV Ordering and Numbering Application
            </p>
          </div>
        </motion.div>

        <div className="flex items-center justify-center p-8">
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-2xl scale-[1.2]"
          >
            <Card className="relative bg-white/95 backdrop-blur-lg border-0 shadow-xl rounded-2xl overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#A6CDC6] to-[#93BAB3]" />

              <CardHeader className="relative space-y-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate("/")}
                  className="absolute top-6 left-6 text-gray-500 hover:bg-gray-100/50"
                >
                  <ArrowLeft className="h-6 w-6" />
                </Button>

                <div className="space-y-2 text-center pt-8">
                  <CardTitle className="text-4xl font-bold font-karla text-teal">
                    {type === "admin"
                      ? "Admin Portal"
                      : isSignUp
                      ? "Get Started"
                      : "Welcome Back"}
                  </CardTitle>
                  <CardDescription className="text-lg text-teal font-inconsolata">
                    {type === "admin"
                      ? "Manage CV submissions and applications"
                      : isSignUp
                      ? "Create your account in seconds"
                      : "Sign in to continue your journey"}
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="relative space-y-6 pt-4 px-8 pb-10">
                <form onSubmit={handleAuth} className="space-y-6">
                  <div className="space-y-5">
                    <div className="relative">
                      <Input
                        type="email"
                        placeholder="Email address"
                        className="pl-14 h-14 rounded-xl text-lg"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={loading}
                        required
                      />
                      <User2 className="absolute left-4 top-4 h-6 w-6 text-gray-500" />
                    </div>

                    <div className="relative">
                      <Input
                        type="password"
                        placeholder="Password"
                        className="pl-14 h-14 rounded-xl text-lg"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        disabled={loading}
                        required
                        minLength={6}
                      />
                      <Lock className="absolute left-4 top-4 h-6 w-6 text-gray-500" />
                    </div>

                    {isSignUp && (
                      <p className="text-base text-secondary-500 px-2">
                        Password must be at least 6 characters
                      </p>
                    )}
                  </div>

                  <Button
                    type="submit"
                    className="w-full h-14 rounded-xl text-xl font-semibold"
                    disabled={loading}
                  >
                    {loading ? (
                      <Loader2 className="h-6 w-6 animate-spin" />
                    ) : isSignUp ? (
                      "Create Account"
                    ) : (
                      "Continue"
                    )}
                  </Button>
                </form>

                {type === "applicant" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <Button
                      variant="link"
                      onClick={() => setIsSignUp(!isSignUp)}
                      disabled={loading}
                      className="text-lg font-medium"
                    >
                      {isSignUp
                        ? "Already have an account? Sign in"
                        : "Don't have an account? Sign up"}
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </div>

      <div className="absolute bottom-4 w-full text-center text-lg text-white font-inconsolata">
        Created by Aadhith CJ, Sameer, Nafiya
      </div>
    </div>
  );
};

export default LoginPage;