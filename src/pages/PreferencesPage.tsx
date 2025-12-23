import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Settings, Bell, Mail, Bookmark } from 'lucide-react';
import { Helmet } from 'react-helmet-async';

const PreferencesPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [categories, setCategories] = useState<any[]>([]);
  const [followedCategories, setFollowedCategories] = useState<string[]>([]);
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!user) {
      navigate('/auth');
      return;
    }
    fetchPreferences();
  }, [user]);

  const fetchPreferences = async () => {
    try {
      // Fetch user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('email_notifications')
        .eq('id', user?.id)
        .single();

      if (profile) {
        setEmailNotifications(profile.email_notifications);
      }

      // Fetch all categories
      const { data: cats } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true);

      setCategories(cats || []);

      // Fetch followed categories
      const { data: follows } = await supabase
        .from('category_follows')
        .select('category_id')
        .eq('user_id', user?.id);

      setFollowedCategories(follows?.map(f => f.category_id) || []);

      // Check newsletter subscription
      const { data: newsletter } = await supabase
        .from('newsletter_subscriptions')
        .select('is_active')
        .eq('email', user?.email)
        .single();

      if (newsletter) {
        setNewsletterSubscribed(newsletter.is_active);
      }
    } catch (error) {
      console.error('Error fetching preferences:', error);
    }
  };

  const updateEmailNotifications = async (enabled: boolean) => {
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ email_notifications: enabled })
        .eq('id', user?.id);

      if (error) throw error;

      setEmailNotifications(enabled);
      toast({
        title: "Preferences updated",
        description: `Email notifications ${enabled ? 'enabled' : 'disabled'}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update preferences",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const toggleCategoryFollow = async (categoryId: string) => {
    if (!user) return;

    const isFollowing = followedCategories.includes(categoryId);

    try {
      if (isFollowing) {
        const { error } = await supabase
          .from('category_follows')
          .delete()
          .eq('user_id', user.id)
          .eq('category_id', categoryId);

        if (error) throw error;

        setFollowedCategories(prev => prev.filter(id => id !== categoryId));
        toast({
          title: "Unfollowed",
          description: "You will no longer receive notifications for this category",
        });
      } else {
        const { error } = await supabase
          .from('category_follows')
          .insert({ user_id: user.id, category_id: categoryId });

        if (error) throw error;

        setFollowedCategories(prev => [...prev, categoryId]);
        toast({
          title: "Following",
          description: "You will receive notifications for new content in this category",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update category follows",
        variant: "destructive"
      });
    }
  };

  const toggleNewsletterSubscription = async (enabled: boolean) => {
    if (!user?.email) return;

    setIsLoading(true);
    try {
      if (enabled) {
        const { error } = await supabase
          .from('newsletter_subscriptions')
          .upsert({ 
            email: user.email, 
            is_active: true,
            unsubscribed_at: null 
          });

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('newsletter_subscriptions')
          .update({ 
            is_active: false,
            unsubscribed_at: new Date().toISOString()
          })
          .eq('email', user.email);

        if (error) throw error;
      }

      setNewsletterSubscribed(enabled);
      toast({
        title: enabled ? "Subscribed" : "Unsubscribed",
        description: enabled 
          ? "You will receive weekly newsletter digests" 
          : "You will no longer receive newsletter digests",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update newsletter subscription",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <Helmet>
        <title>Preferences | TechBeetle</title>
        <meta name="description" content="Tune your TechBeetle notifications, followed categories, and newsletter preferences." />
        <meta name="robots" content="noindex,follow" />
      </Helmet>
      <Header />
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4 flex items-center gap-3">
            <Settings className="w-10 h-10" />
            Preferences
          </h1>
          <p className="text-muted-foreground text-lg">
            Customize your notification and content preferences
          </p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Email Notifications
              </CardTitle>
              <CardDescription>
                Control how you receive email notifications
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="email-notifications" className="text-base">
                    Enable email notifications
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Receive notifications about comments, replies, and updates
                  </p>
                </div>
                <Switch
                  id="email-notifications"
                  checked={emailNotifications}
                  onCheckedChange={updateEmailNotifications}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Newsletter */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Newsletter Subscription
              </CardTitle>
              <CardDescription>
                Receive weekly digests of top articles
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="newsletter" className="text-base">
                    Subscribe to weekly newsletter
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Get a curated selection of the week's best articles
                  </p>
                </div>
                <Switch
                  id="newsletter"
                  checked={newsletterSubscribed}
                  onCheckedChange={toggleNewsletterSubscription}
                  disabled={isLoading}
                />
              </div>
            </CardContent>
          </Card>

          {/* Category Follows */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bookmark className="w-5 h-5" />
                Follow Categories
              </CardTitle>
              <CardDescription>
                Get notified when new content is published in these categories
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {categories.map((category) => {
                  const isFollowing = followedCategories.includes(category.id);
                  return (
                    <Badge
                      key={category.id}
                      variant={isFollowing ? "default" : "outline"}
                      className="cursor-pointer px-4 py-2 text-sm transition-all hover:scale-105"
                      style={isFollowing ? {
                        backgroundColor: category.color,
                        color: 'white'
                      } : {
                        borderColor: category.color,
                        color: category.color
                      }}
                      onClick={() => toggleCategoryFollow(category.id)}
                    >
                      {category.name}
                      {isFollowing && ' ✓'}
                    </Badge>
                  );
                })}
              </div>
              {followedCategories.length === 0 && (
                <p className="text-sm text-muted-foreground mt-4">
                  Click on categories to start following them
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PreferencesPage;
