
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, Check, X, Clock, AlertCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";
import { useNavigate } from "react-router-dom";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

type Interview = Database["public"]["Tables"]["interviews"]["Row"] & { cvs?: { applicant_name: string } };

interface UpcomingInterviewsProps {
  interviews: Interview[];
}

export const UpcomingInterviews = ({ interviews }: UpcomingInterviewsProps) => {
  const navigate = useNavigate();

  const upcomingInterviews = interviews 
    ? [...interviews]
        .filter(interview => interview.status === 'scheduled' || interview.status === 'confirmed' || interview.status === 'pending' || interview.status === 'declined')
        .sort((a, b) => new Date(a.scheduled_at).getTime() - new Date(b.scheduled_at).getTime())
        .slice(0, 4)
    : [];

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'confirmed':
        return <Check className="h-4 w-4 text-green-500" />;
      case 'declined':
        return <X className="h-4 w-4 text-red-500" />;
      default:
        return <Clock className="h-4 w-4 text-amber-500" />;
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

  return (
    <Card className="bg-secondary backdrop-blur border-none">
      <CardHeader>
        <CardTitle>Upcoming Interviews</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {upcomingInterviews.length > 0 ? (
            upcomingInterviews.map((interview) => (
              <div key={interview.id} className="flex items-center">
                <div className="bg-black text-white rounded-full p-2 mr-4">
                  <Calendar className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="font-medium">{interview.cvs?.applicant_name || "Candidate"}</p>
                    {getStatusBadge(interview.status || 'scheduled')}
                  </div>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium">{format(new Date(interview.scheduled_at), "MMMM d, yyyy")}</span>
                    <span className="mx-1">at</span>
                    <span className="font-medium">{format(new Date(interview.scheduled_at), "h:mm a")}</span>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-2"
                  onClick={() => navigate(`/admin/messages`)}
                >
                  View
                </Button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-4">No upcoming interviews scheduled</p>
          )}
        </div>
      </CardContent>
      <CardFooter className="pt-0">
        <Button 
          variant="ghost" 
          className="w-full"
          onClick={() => navigate("/admin/messages")}
        >
          Manage all interviews
        </Button>
      </CardFooter>
    </Card>
  );
};
