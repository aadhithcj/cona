
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";

type CV = Database["public"]["Tables"]["cvs"]["Row"];

interface RecentApplicationsProps {
  cvs: CV[];
}

export const RecentApplications = ({ cvs }: RecentApplicationsProps) => {
  const navigate = useNavigate();

  const recentCVs = [...cvs]
    .sort((a, b) => new Date(b.application_date || b.created_at || '').getTime() - new Date(a.application_date || a.created_at || '').getTime())
    .slice(0, 4);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return diffInHours < 1 ? "Just now" : `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    } else if (diffInHours < 48) {
      return "Yesterday";
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
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
  );
};
