
import { useEffect, useState } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

interface DashboardHeaderProps {
  userName?: string;
}

export const DashboardHeader = ({ userName }: DashboardHeaderProps) => {
  const navigate = useNavigate();
  const [recruiterName, setRecruiterName] = useState(userName || "User");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  useEffect(() => {
    async function fetchRecruiterData() {
      try {
        const { data, error } = await supabase
          .from("settings")
          .select("recruiter_name, recruiter_avatar_url")
          .single();

        if (error) {
          console.error("Error fetching recruiter data:", error);
          return;
        }

        if (data) {
          if (data.recruiter_name) {
            setRecruiterName(data.recruiter_name);
          }
          
          if (data.recruiter_avatar_url) {
            setAvatarUrl(data.recruiter_avatar_url);
          }
        }
      } catch (error) {
        console.error("Error in fetching recruiter data:", error);
      }
    }

    fetchRecruiterData();
  }, [userName]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-foreground-secondary font-bold">
        Hello, {recruiterName}!
      </h1>
      <div className="flex items-center space-x-4">
        <Button variant="destructive" className="rounded-xl gap-2" onClick={handleLogout}>
          <LogOut className="w-4 h-4" />
          Logout
        </Button>
        <Avatar className="bg-foreground">
          <AvatarImage src={avatarUrl || "/avatars/batman.jpg"} />
          <AvatarFallback>{recruiterName.charAt(0)}</AvatarFallback>
        </Avatar>
      </div>
    </div>
  );
};
