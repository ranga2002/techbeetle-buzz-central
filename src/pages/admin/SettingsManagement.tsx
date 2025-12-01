
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';

const SettingsManagement = () => {
  const { toast } = useToast();

  const handleSave = () => {
    toast({
      title: "Settings saved",
      description: "Your settings have been saved successfully.",
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="news-api">News API</TabsTrigger>
          <TabsTrigger value="email">Email</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="site-name">Site Name</Label>
                <Input id="site-name" defaultValue="TechBeetle" />
              </div>
              <div>
                <Label htmlFor="site-description">Site Description</Label>
                <Textarea id="site-description" defaultValue="Your premier destination for tech news and reviews" />
              </div>
              <div>
                <Label htmlFor="contact-email">Contact Email</Label>
                <Input id="contact-email" type="email" defaultValue="contact@techbeetle.com" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="maintenance-mode" />
                <Label htmlFor="maintenance-mode">Maintenance Mode</Label>
              </div>
              <Button onClick={handleSave}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="news-api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>News API Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="news-api-key">News API Key</Label>
                <Input id="news-api-key" type="password" placeholder="Enter your News API key" />
              </div>
              <div>
                <Label htmlFor="api-endpoint">API Endpoint</Label>
                <Input id="api-endpoint" defaultValue="https://newsapi.org/v2/everything" />
              </div>
              <div>
                <Label htmlFor="update-interval">Update Interval (minutes)</Label>
                <Input id="update-interval" type="number" defaultValue="10" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="auto-publish" />
                <Label htmlFor="auto-publish">Auto-publish fetched news</Label>
              </div>
              <Button onClick={handleSave}>Save API Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="email" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Email Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="smtp-host">SMTP Host</Label>
                <Input id="smtp-host" placeholder="smtp.gmail.com" />
              </div>
              <div>
                <Label htmlFor="smtp-port">SMTP Port</Label>
                <Input id="smtp-port" type="number" defaultValue="587" />
              </div>
              <div>
                <Label htmlFor="smtp-username">SMTP Username</Label>
                <Input id="smtp-username" type="email" />
              </div>
              <div>
                <Label htmlFor="smtp-password">SMTP Password</Label>
                <Input id="smtp-password" type="password" />
              </div>
              <div className="flex items-center space-x-2">
                <Switch id="email-notifications" />
                <Label htmlFor="email-notifications">Enable Email Notifications</Label>
              </div>
              <Button onClick={handleSave}>Save Email Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seo" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>SEO Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="meta-title">Default Meta Title</Label>
                <Input id="meta-title" defaultValue="TechBeetle - Latest Tech News & Reviews" />
              </div>
              <div>
                <Label htmlFor="meta-description">Default Meta Description</Label>
                <Textarea id="meta-description" defaultValue="Stay updated with the latest technology news, reviews, and insights at TechBeetle." />
              </div>
              <div>
                <Label htmlFor="meta-keywords">Meta Keywords</Label>
                <Input id="meta-keywords" defaultValue="tech news, technology, reviews, gadgets, smartphones" />
              </div>
              <div>
                <Label htmlFor="google-analytics">Google Analytics ID</Label>
                <Input id="google-analytics" placeholder="G-XXXXXXXXXX" />
              </div>
              <Button onClick={handleSave}>Save SEO Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManagement;
