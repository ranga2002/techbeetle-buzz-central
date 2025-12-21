import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Tables } from "@/integrations/supabase/types";
import { Loader2, Edit3, ShieldCheck, LogOut, UserRound, Mail, Calendar, Bell } from "lucide-react";

type Profile = Tables<"profiles">;

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
   // Preserve local edits before persisting
  const [formState, setFormState] = useState({
    full_name: "",
    username: "",
    bio: "",
    avatar_url: "",
  });
  const [emailNotifications, setEmailNotifications] = useState<boolean>(true);

  const initials = useMemo(() => {
    const source = formState.full_name || formState.username || user?.email || "U";
    return source
      .split(" ")
      .map((part) => part.charAt(0))
      .join("")
      .slice(0, 2)
      .toUpperCase();
  }, [formState.full_name, formState.username, user?.email]);

  const dirty = useMemo(() => {
    if (!profile) return true;
    return (
      formState.full_name !== (profile.full_name || "") ||
      formState.username !== (profile.username || "") ||
      formState.bio !== (profile.bio || "") ||
      formState.avatar_url !== (profile.avatar_url || "") ||
      emailNotifications !== (profile.email_notifications ?? true)
    );
  }, [profile, formState, emailNotifications]);

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    const fetchProfile = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, username, bio, avatar_url, role, is_active, email_notifications, created_at, updated_at")
        .eq("id", user.id)
        .single();

      if (error) {
        toast({
          title: "Unable to load profile",
          description: error.message,
          variant: "destructive",
        });
      }

      const meta = user.user_metadata || {};
      const mergedProfile = {
        ...data,
        full_name: data?.full_name || meta.full_name || meta.name || "",
        username: data?.username || meta.username || meta.preferred_username || "",
        avatar_url: data?.avatar_url || meta.avatar_url || "",
        bio: data?.bio || "",
        email_notifications: data?.email_notifications ?? true,
      } as Profile | null;

      setProfile(mergedProfile);
      setFormState({
        full_name: mergedProfile?.full_name || "",
        username: mergedProfile?.username || "",
        bio: mergedProfile?.bio || "",
        avatar_url: mergedProfile?.avatar_url || "",
      });
      setEmailNotifications(mergedProfile?.email_notifications ?? true);
      setLoading(false);
    };

    fetchProfile();
  }, [navigate, toast, user]);

  if (!user) return null;

  const handleInputChange = (key: keyof typeof formState, value: string) => {
    setFormState((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const updates = {
      full_name: formState.full_name || null,
      username: formState.username || null,
      bio: formState.bio || null,
      avatar_url: formState.avatar_url || null,
      email_notifications: emailNotifications,
      updated_at: new Date().toISOString(),
    };

    const { error, data } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select("id, full_name, username, bio, avatar_url, role, is_active, email_notifications, created_at, updated_at")
      .single();

    if (error) {
      toast({
        title: "Save failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      const merged = { ...profile, ...data } as Profile;
      setProfile(merged);
      setFormState({
        full_name: merged.full_name || "",
        username: merged.username || "",
        bio: merged.bio || "",
        avatar_url: merged.avatar_url || "",
      });
      setEmailNotifications(merged.email_notifications ?? true);
      setEditMode(false);
      toast({
        title: "Profile updated",
        description: "Your changes have been saved.",
      });
    }
    setSaving(false);
  };

  const resetForm = () => {
    setFormState({
      full_name: profile?.full_name || "",
      username: profile?.username || "",
      bio: profile?.bio || "",
      avatar_url: profile?.avatar_url || "",
    });
    setEmailNotifications(profile?.email_notifications ?? true);
    setEditMode(false);
  };

  const renderSkeleton = () => (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="border border-white/10 bg-slate-950/60 shadow-xl">
        <CardHeader className="space-y-3">
          <Skeleton className="h-6 w-48 bg-white/10" />
          <Skeleton className="h-4 w-64 bg-white/5" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-16 w-16 rounded-full bg-white/10" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-40 bg-white/10" />
              <Skeleton className="h-4 w-24 bg-white/5" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-16 w-full bg-white/5" />
            <Skeleton className="h-16 w-full bg-white/5" />
            <Skeleton className="h-16 w-full bg-white/5" />
            <Skeleton className="h-16 w-full bg-white/5" />
          </div>
        </CardContent>
      </Card>
      <Card className="border border-white/10 bg-white/5 shadow-xl">
        <CardHeader>
          <Skeleton className="h-6 w-32 bg-white/10" />
          <Skeleton className="h-4 w-48 bg-white/5 mt-2" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-10 w-full bg-white/5" />
          <Skeleton className="h-10 w-full bg-white/5" />
          <Skeleton className="h-20 w-full bg-white/5" />
          <Skeleton className="h-10 w-32 bg-white/10" />
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-background text-white">
      <Helmet>
        <title>Profile | Tech Beetle</title>
        <meta name="description" content="Manage your Tech Beetle profile and account settings." />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-10 max-w-5xl text-slate-50">
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 rounded-full bg-white/10 px-4 py-2 backdrop-blur">
            <UserRound className="h-5 w-5 text-sky-200" />
            <span className="text-sm font-medium text-sky-100">Account · Profile</span>
          </div>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-white">Your profile, refreshed</h1>
          <p className="mt-2 text-lg text-slate-200">
            Review your details, update your identity, and keep your Tech Beetle presence sharp.
          </p>
        </div>

        {loading ? (
          renderSkeleton()
        ) : (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border border-white/10 bg-slate-950/60 shadow-xl text-slate-50">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="text-2xl text-white">Profile overview</CardTitle>
                <CardDescription className="text-slate-300">
                  Identity, access, and account status in one view.
                </CardDescription>
              </div>
              <Badge variant="secondary" className="gap-2 bg-sky-900/70 text-sky-100">
                <ShieldCheck className="h-4 w-4" />
                {profile?.role || "user"}
              </Badge>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16 ring-2 ring-sky-500/50">
                  <AvatarImage src={formState.avatar_url || undefined} />
                  <AvatarFallback className="bg-slate-800 text-lg font-semibold">{initials}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-xl font-semibold text-white">
                    {formState.full_name || "Name not set"}
                  </div>
                  <div className="text-slate-300">{formState.username ? `@${formState.username}` : "username"}</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Email</p>
                  <p className="text-base font-semibold text-white flex items-center gap-2 mt-1">
                    <Mail className="h-4 w-4 text-sky-300" />
                    {user.email}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Member since</p>
                  <p className="text-base font-semibold text-white flex items-center gap-2 mt-1">
                    <Calendar className="h-4 w-4 text-sky-300" />
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : "—"}
                  </p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Account ID</p>
                  <p className="text-sm text-slate-200 mt-1 break-all">{user.id}</p>
                </div>
                <div className="rounded-xl border border-white/5 bg-white/5 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                  <Badge variant="outline" className={profile?.is_active ? "border-green-500/60 text-green-200 mt-2" : "border-amber-500/60 text-amber-200 mt-2"}>
                    {profile?.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </div>

              {!editMode && (
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="secondary" onClick={() => setEditMode(true)}>
                    <Edit3 className="mr-2 h-4 w-4" />
                    Edit profile
                  </Button>
                  <Button variant="ghost" onClick={() => navigate("/preferences")}>
                    Preferences
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border border-white/10 bg-white/5 shadow-xl text-slate-50">
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div>
                <CardTitle className="flex items-center gap-2 text-white">
                  <Edit3 className="h-5 w-5 text-sky-300" />
                  {editMode ? "Edit profile" : "Profile content"}
                </CardTitle>
                <CardDescription className="text-slate-300">
                  {editMode
                    ? "Update your public-facing details."
                    : "What others read about you. Switch to edit to change it."}
                </CardDescription>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {editMode ? (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="full_name" className="text-slate-200">Full name</Label>
                    <Input
                      id="full_name"
                      value={formState.full_name}
                      onChange={(e) => handleInputChange("full_name", e.target.value)}
                      placeholder="Ada Lovelace"
                      className="bg-slate-900/70 text-slate-50 border-white/10 placeholder:text-slate-500"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username" className="text-slate-200">Username</Label>
                    <Input
                      id="username"
                      value={formState.username}
                      onChange={(e) => handleInputChange("username", e.target.value)}
                      placeholder="adalabs"
                      className="bg-slate-900/70 text-slate-50 border-white/10 placeholder:text-slate-500"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bio" className="text-slate-200">Bio</Label>
                    <Textarea
                      id="bio"
                      value={formState.bio}
                      onChange={(e) => handleInputChange("bio", e.target.value)}
                      placeholder="Short bio for your Tech Beetle profile."
                      className="bg-slate-900/70 text-slate-50 border-white/10 placeholder:text-slate-500 min-h-[120px]"
                      disabled={loading}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avatar_url" className="text-slate-200">Avatar URL</Label>
                    <Input
                      id="avatar_url"
                      value={formState.avatar_url}
                      onChange={(e) => handleInputChange("avatar_url", e.target.value)}
                      placeholder="https://images.example.com/avatar.jpg"
                      className="bg-slate-900/70 text-slate-50 border-white/10 placeholder:text-slate-500"
                      disabled={loading}
                    />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3">
                    <div>
                      <p className="text-sm text-slate-200 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-sky-300" />
                        Email notifications
                      </p>
                      <p className="text-xs text-slate-400">Receive updates about replies, mentions, and features.</p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                      disabled={loading}
                    />
                  </div>

                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Button onClick={handleSave} disabled={saving || loading || !dirty}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Save changes
                    </Button>
                    <Button variant="ghost" onClick={resetForm} disabled={saving || loading}>
                      Reset
                    </Button>
                    <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                      Cancel
                    </Button>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3">
                    <p className="text-xs uppercase tracking-wide text-slate-400">Bio</p>
                    <p className="mt-1 text-base text-white whitespace-pre-wrap">
                      {formState.bio || "Tell the community a little about yourself."}
                    </p>
                  </div>
                  <div className="flex items-center justify-between rounded-lg border border-white/10 bg-slate-900/60 px-4 py-3">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-400 flex items-center gap-2">
                        <Bell className="h-4 w-4 text-sky-300" />
                        Email notifications
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {emailNotifications ? "Enabled" : "Disabled"}
                      </p>
                    </div>
                    <Badge variant="outline" className={emailNotifications ? "border-green-500/60 text-green-200" : "border-amber-500/60 text-amber-200"}>
                      {emailNotifications ? "On" : "Off"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-end">
                    <Button variant="secondary" onClick={() => setEditMode(true)}>
                      <Edit3 className="mr-2 h-4 w-4" />
                      Edit profile
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        )}

        <div className="mt-6 grid gap-4 sm:flex sm:items-center sm:justify-between">
          <div className="text-slate-200">
            Changes sync immediately to your Tech Beetle profile. Need help? Visit support or contact an admin.
          </div>
          <Button variant="outline" className="border-red-500/50 text-red-100 hover:bg-red-500/10" onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            Sign out
          </Button>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
