
import { Label } from "@/components/ui/label";

interface ProfileDetailsProps {
  cv: any;
}

const ProfileDetails = ({ cv }: ProfileDetailsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <Label className="text-sm font-medium">Current Job Title</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {cv?.current_job_title || 'Not specified'}
        </p>
      </div>
      <div>
        <Label className="text-sm font-medium">Phone</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {cv?.phone || 'Not specified'}
        </p>
      </div>
      <div>
        <Label className="text-sm font-medium">Address</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {cv?.address || 'Not specified'}
        </p>
      </div>
      <div>
        <Label className="text-sm font-medium">Years of Experience</Label>
        <p className="text-sm text-muted-foreground mt-1">
          {cv?.years_experience || 'Not specified'}
        </p>
      </div>
    </div>
  );
};

export default ProfileDetails;
