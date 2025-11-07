import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import { Switch } from '@/components/ui/switch';
import { Loader2, Save } from 'lucide-react';

export default function SiteSettingsManagement() {
  const { settings, isLoading, getSetting, updateSetting } = useSiteSettings();
  
  const [bannerEnabled, setBannerEnabled] = useState(getSetting('banner_enabled') ?? false);
  const [bannerText, setBannerText] = useState(getSetting('banner_text') ?? '');
  const [bannerLink, setBannerLink] = useState(getSetting('banner_link') ?? '');
  const [maintenanceMode, setMaintenanceMode] = useState(getSetting('maintenance_mode') ?? false);
  const [maintenanceMessage, setMaintenanceMessage] = useState(getSetting('maintenance_message') ?? '');

  const handleSaveBanner = () => {
    updateSetting.mutate({ key: 'banner_enabled', value: bannerEnabled });
    updateSetting.mutate({ key: 'banner_text', value: bannerText });
    updateSetting.mutate({ key: 'banner_link', value: bannerLink });
  };

  const handleSaveMaintenance = () => {
    updateSetting.mutate({ key: 'maintenance_mode', value: maintenanceMode });
    updateSetting.mutate({ key: 'maintenance_message', value: maintenanceMessage });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Site Settings</h1>
        <p className="text-muted-foreground mt-2">
          Manage global site configurations and announcements
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Announcement Banner</CardTitle>
          <CardDescription>
            Display an announcement banner at the top of the site
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="banner-enabled">Enable Banner</Label>
            <Switch
              id="banner-enabled"
              checked={bannerEnabled}
              onCheckedChange={setBannerEnabled}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="banner-text">Banner Text</Label>
            <Textarea
              id="banner-text"
              value={bannerText}
              onChange={(e) => setBannerText(e.target.value)}
              placeholder="Enter announcement text..."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="banner-link">Banner Link (Optional)</Label>
            <Input
              id="banner-link"
              value={bannerLink}
              onChange={(e) => setBannerLink(e.target.value)}
              placeholder="https://..."
            />
          </div>

          <Button onClick={handleSaveBanner} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Banner Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Maintenance Mode</CardTitle>
          <CardDescription>
            Put the site into maintenance mode
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="maintenance-mode">Enable Maintenance Mode</Label>
            <Switch
              id="maintenance-mode"
              checked={maintenanceMode}
              onCheckedChange={setMaintenanceMode}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="maintenance-message">Maintenance Message</Label>
            <Textarea
              id="maintenance-message"
              value={maintenanceMessage}
              onChange={(e) => setMaintenanceMessage(e.target.value)}
              placeholder="We're currently performing maintenance. We'll be back soon!"
              rows={3}
            />
          </div>

          <Button onClick={handleSaveMaintenance} disabled={updateSetting.isPending}>
            {updateSetting.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Maintenance Settings
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
