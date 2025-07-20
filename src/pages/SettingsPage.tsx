
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { LogOut, Upload } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Sidebar } from "@/components/admin/Sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

type SortCriteria = "experience" | "skills" | "rating" | "name" | "date" | "score";
type SortOrder = "asc" | "desc";

interface SettingsFormValues {
  company_name: string;
  recruiter_name: string;
  default_sort_criteria: SortCriteria;
  default_sort_order: SortOrder;
}

// Define a more complete settings interface based on our database fields
interface Settings {
  id: string;
  company_name: string;
  created_at: string | null;
  updated_at: string | null;
  recruiter_name: string | null;
  recruiter_avatar_url: string | null;
  default_sort_criteria: string | null;
  default_sort_order: string | null;
}

const SettingsPage = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  
  const form = useForm<SettingsFormValues>({
    defaultValues: {
      company_name: "",
      recruiter_name: "",
      default_sort_criteria: "score",
      default_sort_order: "desc",
    },
  });

  const { data: settings, isLoading } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("settings")
        .select("*")
        .maybeSingle();

      if (error) {
        console.error("Error fetching settings:", error);
        throw error;
      }

      return data as Settings;
    },
  });

  useEffect(() => {
    if (settings) {
      form.reset({
        company_name: settings.company_name,
        recruiter_name: settings.recruiter_name || "",
        default_sort_criteria: (settings.default_sort_criteria as SortCriteria) || "score",
        default_sort_order: (settings.default_sort_order as SortOrder) || "desc",
      });
      setAvatarUrl(settings.recruiter_avatar_url || null);
    }
  }, [settings, form]);

  const updateSettings = useMutation({
    mutationFn: async (values: SettingsFormValues) => {
      const { error } = await supabase
        .from("settings")
        .update({
          company_name: values.company_name,
          recruiter_name: values.recruiter_name,
          default_sort_criteria: values.default_sort_criteria,
          default_sort_order: values.default_sort_order,
          updated_at: new Date().toISOString(),
        })
        .eq("id", settings?.id);

      if (error) {
        throw error;
      }
      
      return values;
    },
    onSuccess: () => {
      toast({
        title: "Settings updated",
        description: "Company settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating settings",
        description: error.message,
      });
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    updateSettings.mutate(values);
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    
    try {
      // Check if storage bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const avatarBucketExists = buckets?.some(bucket => bucket.name === 'avatars');
      
      if (!avatarBucketExists) {
        await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 1024 * 1024 * 2, // 2MB
        });
      }
      
      // Upload the file
      const fileExt = file.name.split('.').pop();
      const fileName = `recruiter-${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, { upsert: true });
        
      if (uploadError) {
        throw uploadError;
      }
      
      // Get the public URL
      const { data } = supabase.storage.from('avatars').getPublicUrl(fileName);
      const publicUrl = data.publicUrl;
      
      // Update the avatar URL in the settings table
      const { error: updateError } = await supabase
        .from('settings')
        .update({ recruiter_avatar_url: publicUrl })
        .eq('id', settings?.id);
        
      if (updateError) {
        throw updateError;
      }
      
      setAvatarUrl(publicUrl);
      
      toast({
        title: "Avatar uploaded",
        description: "Your profile photo has been updated successfully",
      });
      
      queryClient.invalidateQueries({ queryKey: ["settings"] });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: error.message,
      });
      console.error("Error uploading avatar:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/login");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="bg-primary relative md:flex flex-col items-center justify-center p-8 min-h-screen">
      <Sidebar />

      <div className="ml-[88px] p-6 w-full">
        <div className="bg-secondary backdrop-blur rounded-xl p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold font-['Karla']">Settings</h1>
            <Button variant="destructive" className="rounded-xl gap-2" onClick={handleLogout}>
              <LogOut className="w-4 h-4" />
              Logout
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-['Karla']">Company Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="company_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Company Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter company name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="recruiter_name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Recruiter Name</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your name" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="space-y-4">
                    <div>
                      <Label className="mb-2 block">Default CV Sorting</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="default_sort_criteria"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sort By</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select sort criteria" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="score">Match Score</SelectItem>
                                  <SelectItem value="experience">Experience</SelectItem>
                                  <SelectItem value="name">Name</SelectItem>
                                  <SelectItem value="date">Date</SelectItem>
                                  <SelectItem value="rating">Rating</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="default_sort_order"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Order</FormLabel>
                              <Select
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                              >
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select order" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="desc">Descending</SelectItem>
                                  <SelectItem value="asc">Ascending</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full"
                    disabled={updateSettings.isPending}
                  >
                    {updateSettings.isPending ? <Spinner /> : null}
                    Save Settings
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-['Karla']">Profile Photo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center space-y-6">
                <Avatar className="w-32 h-32 border-2 border-primary">
                  {avatarUrl ? (
                    <AvatarImage src={avatarUrl} alt="Recruiter avatar" />
                  ) : (
                    <AvatarFallback className="text-2xl bg-secondary">
                      {form.watch("recruiter_name")?.charAt(0) || "R"}
                    </AvatarFallback>
                  )}
                </Avatar>

                <div className="w-full">
                  <Label htmlFor="avatar" className="mb-2 block">Upload Profile Photo</Label>
                  <div className="flex items-center justify-center w-full">
                    <label 
                      htmlFor="avatar" 
                      className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-gray-50 hover:bg-gray-100"
                    >
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-2 text-gray-500" />
                        <p className="mb-2 text-sm text-gray-500">
                          <span className="font-semibold">Click to upload</span> or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG or WEBP (MAX. 2MB)</p>
                      </div>
                      <Input 
                        id="avatar" 
                        type="file" 
                        className="hidden" 
                        accept="image/png,image/jpeg,image/webp"
                        onChange={handleAvatarUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                  {uploading && (
                    <div className="mt-2 flex justify-center">
                      <Spinner />
                      <span className="ml-2 text-sm text-gray-500">Uploading...</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
