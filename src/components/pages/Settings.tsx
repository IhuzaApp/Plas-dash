import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/sonner';
import { Settings as SettingsIcon, Store, Building2 } from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';
import SupermarketSettings from './SupermarketSettings';

const Settings = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleSaveChanges = () => {
    toast.success('Settings saved successfully');
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const { hasAction } = usePrivilege();

  return (
    <AdminLayout>
      <PageHeader
        title="System Settings"
        description="Configure platform settings and preferences."
        actions={<Button onClick={handleSaveChanges}>Save All Changes</Button>}
        icon={<SettingsIcon className="h-6 w-6" />}
      />

      <Tabs defaultValue="general">
        <TabsList className="mb-4">
          <TabsTrigger value="general">General</TabsTrigger>
          {hasAction('settings', 'view_settings') && (
            <TabsTrigger value="supermarket">Supermarket</TabsTrigger>
          )}
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="api">API</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Company Information</CardTitle>
              <CardDescription>
                Update your company details and contact information.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" defaultValue="DeliveryAdmin Inc." />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-email">Contact Email</Label>
                  <Input id="contact-email" type="email" defaultValue="support@deliveryadmin.com" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input id="phone" defaultValue="+1 (555) 123-4567" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <Input id="website" defaultValue="https://deliveryadmin.com" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address">Address</Label>
                <Textarea
                  id="address"
                  defaultValue="123 Delivery Street, Suite 100, San Francisco, CA 94107"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure general platform settings and defaults.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Input id="timezone" defaultValue="America/Los_Angeles" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="currency">Default Currency</Label>
                  <Input id="currency" defaultValue="USD ($)" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="date-format">Date Format</Label>
                <Input id="date-format" defaultValue="MM/DD/YYYY" />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="maintenance" />
                <Label htmlFor="maintenance">Enable Maintenance Mode</Label>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="new-registrations" defaultChecked />
                <Label htmlFor="new-registrations">Allow New User Registrations</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {hasAction('settings', 'view_settings') && (
          <TabsContent value="supermarket" className="space-y-6">
            <SupermarketSettings />
          </TabsContent>
        )}

        <TabsContent value="appearance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of the platform.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Theme</Label>
                <div className="flex flex-wrap gap-4">
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="theme-light" name="theme" defaultChecked />
                    <Label htmlFor="theme-light">Light</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="theme-dark" name="theme" />
                    <Label htmlFor="theme-dark">Dark</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input type="radio" id="theme-system" name="theme" />
                    <Label htmlFor="theme-system">System Default</Label>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    className="w-10 h-10 rounded cursor-pointer"
                    defaultValue="#9b87f5"
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="compact-mode" />
                <Label htmlFor="compact-mode">Enable Compact Mode</Label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how and when you receive notifications.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Email Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-orders">New Orders</Label>
                    <Switch id="email-orders" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-refunds">Refund Requests</Label>
                    <Switch id="email-refunds" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="email-support">Support Tickets</Label>
                    <Switch id="email-support" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-medium">Push Notifications</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-orders">New Orders</Label>
                    <Switch id="push-orders" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-refunds">Refund Requests</Label>
                    <Switch id="push-refunds" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-support">Support Tickets</Label>
                    <Switch id="push-support" defaultChecked />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="notification-email">Notification Email</Label>
                <Input
                  id="notification-email"
                  type="email"
                  defaultValue="alerts@deliveryadmin.com"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security options and access policies.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                  <p className="text-sm text-muted-foreground">Require 2FA for all admin users</p>
                </div>
                <Switch id="2fa" defaultChecked />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Session Timeout</h3>
                  <p className="text-sm text-muted-foreground">
                    Automatically log out inactive users
                  </p>
                </div>
                <Switch id="session-timeout" defaultChecked />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                <Input id="timeout-duration" type="number" defaultValue="30" />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-medium">Password Requirements</h3>
                  <p className="text-sm text-muted-foreground">Enforce strong password policy</p>
                </div>
                <Switch id="strong-passwords" defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Settings</CardTitle>
              <CardDescription>Manage API keys and access permissions.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <div className="flex gap-2">
                  <Input
                    id="api-key"
                    readOnly
                    defaultValue="sk_live_51Abcde1234567890"
                    className="font-mono"
                  />
                  <Button variant="outline">Regenerate</Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="webhook-url">Webhook URL</Label>
                <Input id="webhook-url" defaultValue="https://yourapp.com/api/webhook" />
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="api-active" defaultChecked />
                <Label htmlFor="api-active">API Access Enabled</Label>
              </div>

              <div className="space-y-2">
                <Label>API Rate Limiting</Label>
                <div className="flex gap-4 items-center">
                  <Input type="number" defaultValue="100" className="w-24" />
                  <span>requests per</span>
                  <Input type="number" defaultValue="60" className="w-24" />
                  <span>seconds</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Store Branches</DialogTitle>
            <DialogDescription>
              Configure multiple store locations for your supermarket chain.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Branch Name</Label>
              <Input placeholder="Main Branch" />
            </div>
            <div className="space-y-2">
              <Label>Branch Address</Label>
              <Textarea placeholder="123 Main St, City, State" />
            </div>
            <div className="space-y-2">
              <Label>Branch Manager</Label>
              <Input placeholder="John Doe" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            {hasAction('settings', 'edit_settings') && (
              <Button
                onClick={() => {
                  toast.success('Branch added successfully');
                  setDialogOpen(false);
                }}
              >
                Add Branch
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Settings;
