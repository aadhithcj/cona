
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Edit, Download, CheckCircle } from "lucide-react";
import CVDisplay from "./CVDisplay";
import CVForm from "./CVForm";

const ProfileTab = () => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const { data: cv, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['userCV'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No user found');

      const { data, error } = await supabase
        .from('cvs')
        .select('*, job_postings!inner(*)')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
  });

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }
      setUploading(true);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      const filePath = `${crypto.randomUUID()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('cvs')
        .update({ avatar_url: publicUrl })
        .eq('id', cv?.id);

      if (updateError) throw updateError;

      toast({
        title: "Success",
        description: "Profile picture updated successfully",
      });

      refetch();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to upload profile picture",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleThemeChange = async (theme: string) => {
    if (!cv) return;
    
    try {
      const { error } = await supabase
        .from('cvs')
        .update({ theme })
        .eq('id', cv.id);
      
      if (error) throw error;
      
      refetch();
      
      toast({
        title: "Theme updated",
        description: "Your CV theme has been updated successfully.",
      });
    } catch (error) {
      console.error("Error updating theme:", error);
      toast({
        title: "Error",
        description: "Failed to update theme.",
        variant: "destructive",
      });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-6">
              <Skeleton className="w-24 h-24 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-4 w-48" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="text-center py-8">
        <div className="inline-block p-4 rounded-lg bg-destructive/10 text-destructive">
          Error loading profile: {(error as Error).message}
        </div>
      </div>
    );
  }

  if (!cv || isEditing) {
    return (
      <Card>
        <CardHeader>
          <h2 className="text-2xl font-medium font-karla">
            {cv ? 'Update Your CV' : 'Create Your CV'}
          </h2>
          <p className="text-muted-foreground font-inconsolata">
            {cv ? 'Update your profile information' : 'Please fill in your details'}
          </p>
        </CardHeader>
        <CardContent>
          <CVForm
            existingCV={cv}
            onSubmitSuccess={() => setIsEditing(false)}
          />
        </CardContent>
      </Card>
    );
  }

  const hasAppliedForJob = cv.job_id !== null && cv.job_id !== undefined;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <h3 className="text-2xl font-bold text-primary">Your Profile</h3>
            <p className="text-muted-foreground">Manage your professional information</p>
          </div>
          <Button onClick={() => setIsEditing(true)} className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Edit CV
          </Button>
        </CardHeader>

        <CardContent>
          {hasAppliedForJob && (
            <div className="bg-green-50 border border-green-200 rounded-md p-4 mb-6 flex items-center">
              <CheckCircle className="h-5 w-5 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-green-800">Application Submitted</h4>
                <p className="text-green-700 text-sm">Your CV has been submitted for consideration</p>
              </div>
            </div>
          )}

          <CVDisplay cv={cv} onEdit={() => setIsEditing(true)} onThemeChange={handleThemeChange} />
        </CardContent>

        <CardFooter className="flex justify-end pt-0">
          <Button variant="outline" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download CV
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default ProfileTab;
