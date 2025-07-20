
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckCircle, Clock, Users, Briefcase, XCircle } from "lucide-react";
import { Database } from "@/integrations/supabase/types";

type CV = Database["public"]["Tables"]["cvs"]["Row"];

interface StatsOverviewProps {
  cvs: CV[];
}

export const StatsOverview = ({ cvs }: StatsOverviewProps) => {
  const totalApplications = cvs.length;
  const pendingApplications = cvs.filter(cv => cv.status === 'pending').length;
  const acceptedApplications = cvs.filter(cv => cv.status === 'accepted').length;
  const rejectedApplications = cvs.filter(cv => cv.status === 'rejected').length;


  return (
    <div className="grid grid-cols-4 gap-4 mt-6">
      <Card className="bg-white/80 backdrop-blur border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <Users className="h-6 w-6" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <h2 className="text-2xl font-bold">{totalApplications}</h2>
          <p className="text-sm text-gray-500">Total applicants</p>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <Clock className="h-6 w-6" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <h2 className="text-2xl font-bold">{pendingApplications}</h2>
          <p className="text-sm text-gray-500">Pending review</p>
        </CardContent>
      </Card>
      
      <Card className="bg-white/80 backdrop-blur border-none shadow-none">
        <CardHeader className="flex flex-row items-center justify-between p-4">
          <CheckCircle className="h-6 w-6" />
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <h2 className="text-2xl font-bold">{acceptedApplications}</h2>
          <p className="text-sm text-gray-500">Accepted applications</p>
        </CardContent>
      </Card>

      


      <Card className="bg-white/80 backdrop-blur border-none shadow-none">
  <CardHeader className="flex flex-row items-center justify-between p-4">
    <XCircle className="h-6 w-6 text-red-500" /> {/* Changed icon and color */}
  </CardHeader>
  <CardContent className="p-4 pt-0">
    <h2 className="text-2xl font-bold">{rejectedApplications}</h2> {/* Changed value */}
    <p className="text-sm text-gray-500">Rejected applications</p> {/* Changed label */}
  </CardContent>
</Card>
    </div>
  );
};
