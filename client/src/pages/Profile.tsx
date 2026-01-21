import { useUserProfile, useUpdateProfile } from "@/hooks/use-profile";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

const profileSchema = z.object({
  academicLevel: z.string().min(1, "Academic level required"),
});

export default function Profile() {
  const { user } = useAuth();
  const { data: profile, isLoading } = useUserProfile();
  const updateMutation = useUpdateProfile();
  const { toast } = useToast();

  const form = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      academicLevel: "",
    },
  });

  useEffect(() => {
    if (profile) {
      form.reset({
        academicLevel: profile.academicLevel || "",
      });
    }
  }, [profile, form]);

  const onSubmit = (values: z.infer<typeof profileSchema>) => {
    updateMutation.mutate(values, {
      onSuccess: () => {
        toast({ title: "Profile updated" });
      }
    });
  };

  if (isLoading) return <div className="p-12 text-center">Loading profile...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <h1 className="text-3xl font-display font-bold">Your Profile</h1>

      {/* User Info Card */}
      <Card>
        <CardContent className="p-8 flex items-center gap-6">
          <Avatar className="w-20 h-20 border-2 border-primary/20">
            <AvatarImage src={user?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xl">{user?.firstName?.[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-xl font-bold">{user?.firstName} {user?.lastName}</h2>
            <p className="text-muted-foreground">{user?.email}</p>
            <div className="mt-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {profile?.learningPace} Learner
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Settings Form */}
      <Card>
        <CardHeader>
          <CardTitle>Academic Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="academicLevel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Academic Level</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your level" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="High School">High School</SelectItem>
                        <SelectItem value="Undergraduate">Undergraduate</SelectItem>
                        <SelectItem value="Postgraduate">Postgraduate</SelectItem>
                        <SelectItem value="Professional">Professional Certification</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />

              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
