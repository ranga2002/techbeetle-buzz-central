import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate("/auth");
    return null;
  }

  const meta = user.user_metadata || {};

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Profile | TechBeetle</title>
        <meta name="description" content="Manage your TechBeetle profile and account settings." />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Your Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Name</p>
              <p className="text-lg font-semibold">{meta.full_name || "Not set"}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <p className="text-lg font-semibold">{user.email}</p>
            </div>
            {meta.username && (
              <div>
                <p className="text-sm text-muted-foreground">Username</p>
                <p className="text-lg font-semibold">@{meta.username}</p>
              </div>
            )}
            <div className="flex gap-2">
              <Badge variant="secondary">User ID</Badge>
              <span className="text-sm text-muted-foreground">{user.id}</span>
            </div>
            <div className="flex gap-3 pt-2">
              <Button variant="secondary" onClick={() => navigate("/preferences")}>
                Preferences
              </Button>
              <Button variant="outline" onClick={() => signOut()}>
                Sign out
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
      <Footer />
    </div>
  );
};

export default ProfilePage;
