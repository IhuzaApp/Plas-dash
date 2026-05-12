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
import { Settings as SettingsIcon, Store, Building2, User, Mail, Phone, Shield, Smartphone, Fingerprint } from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';
import SupermarketSettings from './SupermarketSettings';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { hasuraClient } from '@/lib/hasuraClient';
import { GET_PROJECT_USER_BY_ID, GET_ORG_EMPLOYEE_BY_ID, GET_USER_BY_ID_SIMPLE } from '@/lib/graphql/queries';
import { useEffect } from 'react';

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
  const { data: session } = useSession();
  const user = session?.user as any;
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      let currentUserId = user?.id;
      let currentUserType = user?.type;

      // Fallback to custom localStorage session if NextAuth session is missing
      if (!currentUserId && typeof window !== 'undefined') {
        const localSession = localStorage.getItem('orgEmployeeSession');
        if (localSession) {
          try {
            const parsed = JSON.parse(localSession);
            currentUserId = parsed.id;
            currentUserType = parsed.isProjectUser ? 'project_user' : 'employee';
            console.log('Settings: Found local session:', { currentUserId, currentUserType });
          } catch (e) {
            console.error('Settings: Error parsing local session', e);
          }
        }
      }

      if (!currentUserId) {
        console.warn('Settings: No user ID found in session or localStorage');
        return;
      }

      setIsLoadingUser(true);
      console.log('Settings: Fetching data for:', { id: currentUserId, type: currentUserType });
      
      if (!hasuraClient) {
        console.error('Settings: hasuraClient is null. Check your environment variables.');
        setIsLoadingUser(false);
        return;
      }

      try {
        let data: any;
        if (currentUserType === 'project_user') {
          console.log('Settings: Querying ProjectUsers...');
          data = await hasuraClient.request<any>(GET_PROJECT_USER_BY_ID, { id: currentUserId });
          console.log('Settings: ProjectUsers Raw Data:', data);
          if (data.ProjectUsers_by_pk) {
            const pUser = data.ProjectUsers_by_pk;
            setProfileData({
              ...pUser,
              display_name: pUser.username,
              display_role: pUser.role,
              display_email: pUser.email,
              display_phone: 'N/A',
              display_image: pUser.profile,
              membership_id: pUser.MembershipId
            });
            setIsTwoFactorEnabled(pUser.TwoAuth_enabled);
          }
        } else if (currentUserType === 'employee') {
          console.log('Settings: Querying orgEmployees...');
          data = await hasuraClient.request<any>(GET_ORG_EMPLOYEE_BY_ID, { id: currentUserId });
          console.log('Settings: orgEmployees Raw Data:', data);
          if (data.orgEmployees_by_pk) {
            const eUser = data.orgEmployees_by_pk;
            setProfileData({
              ...eUser,
              display_name: eUser.fullnames,
              display_role: eUser.roleType,
              display_email: eUser.email,
              display_phone: eUser.phone,
              display_image: null
            });
          }
        } else {
          console.log('Settings: Querying Users (Standard)...');
          data = await hasuraClient.request<any>(GET_USER_BY_ID_SIMPLE, { id: currentUserId });
          console.log('Settings: Standard Users Raw Data:', data);
          if (data.Users_by_pk) {
            const uUser = data.Users_by_pk;
            setProfileData({
              ...uUser,
              display_name: uUser.name,
              display_role: uUser.role,
              display_email: uUser.email,
              display_phone: uUser.phone,
              display_image: uUser.profile_picture
            });
          }
        }
      } catch (error) {
        console.error('Settings: Error fetching user data:', error);
      } finally {
        setIsLoadingUser(false);
      }
    };

    fetchUserData();
  }, [user?.id, user?.type]);

  const handleToggle2FA = async (enabled: boolean) => {
    let currentUserId = user?.id;
    if (!currentUserId && typeof window !== 'undefined') {
      const localSession = localStorage.getItem('orgEmployeeSession');
      if (localSession) {
        try {
          const parsed = JSON.parse(localSession);
          currentUserId = parsed.id;
        } catch (e) {}
      }
    }

    if (!currentUserId) return;
    
    // Optimistic update
    setIsTwoFactorEnabled(enabled);
    
    try {
      const response = await fetch('/api/mutations/update-project-user-2fa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, enabled }),
      });
      
      if (!response.ok) throw new Error('Failed to update 2FA');
      
      toast.success(enabled ? '2FA Enabled' : '2FA Disabled');
    } catch (error) {
      console.error('Error updating 2FA:', error);
      setIsTwoFactorEnabled(!enabled); // Rollback
      toast.error('Failed to update 2FA status');
    }
  };


  return (
    <AdminLayout>
      <PageHeader
        title="System Settings"
        description="Configure platform settings and preferences."
        actions={<Button onClick={handleSaveChanges}>Save All Changes</Button>}
        icon={<SettingsIcon className="h-6 w-6" />}
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-xl border">
          <TabsTrigger value="profile" className="rounded-lg px-6">My Profile</TabsTrigger>
          <TabsTrigger value="general" className="rounded-lg px-6">General</TabsTrigger>
          {hasAction('settings', 'view_settings') && (
            <TabsTrigger value="supermarket" className="rounded-lg px-6">Supermarket</TabsTrigger>
          )}
          <TabsTrigger value="appearance" className="rounded-lg px-6">Appearance</TabsTrigger>
          <TabsTrigger value="notifications" className="rounded-lg px-6">Notifications</TabsTrigger>
          <TabsTrigger value="security" className="rounded-lg px-6">Security</TabsTrigger>
          <TabsTrigger value="api" className="rounded-lg px-6">API</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-xl bg-gradient-to-br from-primary/5 via-background to-background rounded-3xl overflow-hidden">
              <div className="h-24 bg-primary/10 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2">
                   <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                      <AvatarImage src={profileData?.display_image || user?.image || user?.profile_picture} />
                      <AvatarFallback className="text-xl font-bold bg-zinc-100">
                        {profileData?.display_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                   </Avatar>
                </div>
              </div>
              <CardHeader className="pt-14 text-center">
                <CardTitle className="text-xl">{profileData?.display_name || user?.name}</CardTitle>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <Badge variant="secondary" className="rounded-full px-3">{profileData?.display_role || user?.role || 'Admin'}</Badge>
                  {profileData?.membership_id && (
                    <Badge variant="outline" className="rounded-full px-3 text-[10px]">ID: {profileData.membership_id}</Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border space-y-3">
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <Mail className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Email</span>
                        <span className="text-sm font-medium">{profileData?.display_email || user?.email}</span>
                      </div>
                   </div>
                   <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                        <User className="h-4 w-4" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Gender</span>
                        <span className="text-sm font-medium capitalize">{profileData?.gender || 'Not specified'}</span>
                      </div>
                   </div>
                </div>
                <Button variant="outline" className="w-full rounded-xl border-dashed">Edit Public Profile</Button>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>Manage your account identity and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Full Name / Username</Label>
                      <Input defaultValue={profileData?.display_name || user?.name} className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label>Account ID</Label>
                      <Input defaultValue={profileData?.membership_id || profileData?.id} disabled className="rounded-xl bg-zinc-100/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Email Address</Label>
                      <Input defaultValue={profileData?.display_email || user?.email} disabled className="rounded-xl bg-zinc-100/50" />
                    </div>
                    <div className="space-y-2">
                      <Label>Phone Number</Label>
                      <Input defaultValue={profileData?.display_phone || user?.phone} className="rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Bio / Signature</Label>
                    <Textarea placeholder="Tell us about yourself..." className="rounded-2xl min-h-[100px]" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

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
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Configure security options and access policies for your account.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                   Authentication
                </h3>
                <div className="grid gap-4 border rounded-2xl p-6 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Smartphone className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <Label htmlFor="2fa" className="text-sm font-bold cursor-pointer">Two-Factor Authentication</Label>
                        <p className="text-[10px] text-muted-foreground">Secure your account with SMS OTP via Pindo</p>
                      </div>
                    </div>
                    <Switch 
                      id="2fa" 
                      checked={isTwoFactorEnabled}
                      onCheckedChange={handleToggle2FA}
                      disabled={isLoadingUser}
                    />
                  </div>
                  
                  <div className="flex items-center justify-between opacity-50 cursor-not-allowed border-t pt-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                        <Fingerprint className="h-5 w-5" />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-sm font-bold">Biometric Login</p>
                        <p className="text-[10px] text-muted-foreground">Unlock with FaceID or Fingerprint</p>
                      </div>
                    </div>
                    <Switch disabled />
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                   System Policies
                </h3>
                <div className="grid gap-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Session Timeout</h3>
                      <p className="text-xs text-muted-foreground">
                        Automatically log out inactive users
                      </p>
                    </div>
                    <Switch id="session-timeout" defaultChecked />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timeout-duration">Timeout Duration (minutes)</Label>
                    <Input id="timeout-duration" type="number" defaultValue="30" className="rounded-xl" />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium">Password Requirements</h3>
                      <p className="text-xs text-muted-foreground">Enforce strong password policy</p>
                    </div>
                    <Switch id="strong-passwords" defaultChecked />
                  </div>
                </div>
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
