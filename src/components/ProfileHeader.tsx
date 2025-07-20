
import { Upload, Camera } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

interface ProfileHeaderProps {
  cv: any;
  uploading: boolean;
  handleAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const ProfileHeader = ({ cv, uploading, handleAvatarUpload }: ProfileHeaderProps) => {
  return (
    <div className="flex items-center space-x-6">
      <div className="relative">
        {cv?.avatar_url ? (
          <img
            src={cv.avatar_url}
            alt="Profile"
            className="w-24 h-24 rounded-full object-cover ring-2 ring-primary"
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-secondary flex items-center justify-center">
            <Upload className="w-10 h-10 text-muted-foreground" />
          </div>
        )}
        <Label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 p-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full cursor-pointer transition-colors"
        >
          <Camera className="w-4 h-4" />
        </Label>
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-full">
            <Loader2 className="animate-spin w-6 h-6 text-primary" />
          </div>
        )}
        <Input
          id="avatar-upload"
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleAvatarUpload}
          disabled={uploading}
        />
      </div>
      <div>
        <h1 className="text-2xl font-bold">{cv?.applicant_name}</h1>
        <p className="text-muted-foreground">{cv?.email}</p>
        <p className="text-muted-foreground">{cv?.current_job_title}</p>
      </div>
    </div>
  );
};

export default ProfileHeader;
