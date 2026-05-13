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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Settings as SettingsIcon, Store, Building2, User, Mail, Phone, Shield, Smartphone, Fingerprint, Sun, Moon } from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';
import SupermarketSettings from './SupermarketSettings';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { hasuraClient } from '@/lib/hasuraClient';
import { GET_PROJECT_USER_BY_ID, GET_ORG_EMPLOYEE_BY_ID, GET_USER_BY_ID_SIMPLE } from '@/lib/graphql/queries';
import { useEffect } from 'react';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';

const themePresets = [
  { name: 'Emerald (Default)', hsl: '142 76% 17%', primary: '#064e3b' },
  { name: 'Ocean Blue', hsl: '221 83% 53%', primary: '#3b82f6' },
  { name: 'Royal Purple', hsl: '262 83% 58%', primary: '#8b5cf6' },
  { name: 'Rose Pink', hsl: '346 84% 61%', primary: '#f43f5e' },
  { name: 'Amber Glow', hsl: '38 92% 50%', primary: '#f59e0b' },
  { name: 'Midnight', hsl: '222 47% 11%', primary: '#0f172a' },
  { name: 'Crimson', hsl: '0 72% 51%', primary: '#dc2626' },
  { name: 'Teal', hsl: '174 75% 39%', primary: '#0d9488' },
];

const Settings = () => {
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { theme, setTheme } = useTheme();
  const { color: activeColor, setColor: setActiveColor, setCustomColor } = useThemeColor();

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
          } catch (e) {
            // Silently fail
          }
        }
      }

      if (!currentUserId) {
        return;
      }

      setIsLoadingUser(true);
      
      if (!hasuraClient) {
        setIsLoadingUser(false);
        return;
      }

      try {
        let data: any;
        if (currentUserType === 'project_user') {
          data = await hasuraClient.request<any>(GET_PROJECT_USER_BY_ID, { id: currentUserId });
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
          data = await hasuraClient.request<any>(GET_ORG_EMPLOYEE_BY_ID, { id: currentUserId });
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
          data = await hasuraClient.request<any>(GET_USER_BY_ID_SIMPLE, { id: currentUserId });
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
        // Error fetching user data
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
        body: JSON.stringify({ id: currentUserId, enabled }),
      });
      
      if (!response.ok) throw new Error('Failed to update 2FA');
      
      toast.success(enabled ? '2FA Enabled' : '2FA Disabled');
    } catch (error) {
      console.error('Error updating 2FA:', error);
      setIsTwoFactorEnabled(!enabled); // Rollback
      toast.error('Failed to update 2FA status');
    }
  };

  const [passwordState, setPasswordState] = useState({ current: '', new: '', confirm: '' });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handleChangePassword = async () => {
    if (!passwordState.current || !passwordState.new || !passwordState.confirm) {
      toast.error('All password fields are required');
      return;
    }

    if (passwordState.new !== passwordState.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordState.new.length < 8) {
      toast.error('New password must be at least 8 characters');
      return;
    }

    let currentUserId = user?.id;
    if (!currentUserId && typeof window !== 'undefined') {
      const local = localStorage.getItem('orgEmployeeSession');
      if (local) currentUserId = JSON.parse(local).id;
    }

    setIsUpdatingPassword(true);
    try {
      const response = await fetch('/api/user/change-password', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUserId}`
        },
        body: JSON.stringify({
          currentPassword: passwordState.current,
          newPassword: passwordState.new
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || 'Failed to update password');

      toast.success('Password updated successfully');
      setPasswordState({ current: '', new: '', confirm: '' });
    } catch (error: any) {
      console.error('Error changing password:', error);
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const [isAvatarDialogOpen, setIsAvatarDialogOpen] = useState(false);
  const [avatarStyle, setAvatarStyle] = useState('fun-emoji');
  const [avatarSeed, setAvatarSeed] = useState(user?.name || 'default');
  const [isUpdatingAvatar, setIsUpdatingAvatar] = useState(false);

  const avatarStyles = [
    { id: 'fun-emoji', name: 'Fun Emojis' },
    { id: 'superhero', name: 'Superheroes' },
    { id: 'icons', name: 'System Icons' },
    { id: 'notionists', name: 'Notion Style' },
    { id: 'open-peeps', name: 'Hand Drawn' },
    { id: 'adventurer', name: 'Adventurer' },
    { id: 'big-smile', name: 'Big Smile' },
    { id: 'bottts', name: 'Robots' },
    { id: 'lorelei', name: 'Lorelei' },
    { id: 'pixel-art', name: 'Pixel Art' },
    { id: 'avataaars', name: 'Avatars' },
    { id: 'shapes', name: 'Geometric' },
    { id: 'thumbs', name: 'Abstract' },
    { id: 'micah', name: 'Characters' },
  ];

  const handleUpdateAvatar = async (imageUrl: string) => {
    let currentUserId = user?.id;
    if (!currentUserId && typeof window !== 'undefined') {
      const local = localStorage.getItem('orgEmployeeSession');
      if (local) currentUserId = JSON.parse(local).id;
    }

    setIsUpdatingAvatar(true);
    try {
      const response = await fetch('/api/user/update-profile-image', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${currentUserId}`
        },
        body: JSON.stringify({ profileImage: imageUrl }),
      });

      if (!response.ok) throw new Error('Failed to update avatar');

      setProfileData((prev: any) => ({ ...prev, display_image: imageUrl }));
      toast.success('Profile picture updated');
      setIsAvatarDialogOpen(false);
    } catch (error) {
      console.error('Error updating avatar:', error);
      toast.error('Failed to update profile picture');
    } finally {
      setIsUpdatingAvatar(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      handleUpdateAvatar(base64String);
    };
    reader.readAsDataURL(file);
  };


  return (
    <AdminLayout isLoading={isLoadingUser || !profileData}>
      <PageHeader
        title="Settings"
        description="Manage your account preferences and security settings."
        icon={<SettingsIcon className="h-8 w-8" />}
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 bg-zinc-100/80 dark:bg-zinc-800/50 p-1 rounded-xl border">
          <TabsTrigger value="profile" className="rounded-lg px-6">My Profile</TabsTrigger>
          {(profileData?.display_role === 'globalAdmin' || profileData?.display_role === 'storeAdministrator') && (
            <>
              <TabsTrigger value="general" className="rounded-lg px-6">General</TabsTrigger>
              <TabsTrigger value="supermarket" className="rounded-lg px-6">Supermarket</TabsTrigger>
            </>
          )}
          <TabsTrigger value="appearance" className="rounded-lg px-6">Appearance</TabsTrigger>
          {(profileData?.display_role === 'globalAdmin' || profileData?.display_role === 'storeAdministrator') && (
            <TabsTrigger value="notifications" className="rounded-lg px-6">Notifications</TabsTrigger>
          )}
          <TabsTrigger value="security" className="rounded-lg px-6">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-xl bg-gradient-to-br from-primary/5 via-background to-background rounded-3xl overflow-hidden">
              <div className="h-24 bg-primary/10 relative">
                <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 group cursor-pointer" onClick={() => setIsAvatarDialogOpen(true)}>
                   <Avatar className="h-20 w-20 border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                      <AvatarImage src={profileData?.display_image || user?.image || user?.profile_picture} />
                      <AvatarFallback className="text-xl font-bold bg-zinc-100">
                        {profileData?.display_name?.charAt(0) || user?.name?.charAt(0) || 'U'}
                      </AvatarFallback>
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                        <Smartphone className="h-5 w-5 text-white" />
                      </div>
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
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle>Personal Details</CardTitle>
                  <CardDescription>View your account identity and contact information.</CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Full Name / Username</Label>
                      <Input defaultValue={profileData?.display_name || user?.name} disabled className="rounded-xl bg-zinc-100/50" />
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
                      <Input defaultValue={profileData?.display_phone || user?.phone} disabled className="rounded-xl bg-zinc-100/50" />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Position / Role</Label>
                      <Input defaultValue={profileData?.display_role || 'General User'} disabled className="rounded-xl bg-zinc-100/50 capitalize" />
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Account Privileges</Label>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {profileData?.display_role || 'General Access'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData?.privileges ? (
                        Object.entries(profileData.privileges)
                          .filter(([_, value]) => value && (typeof value === 'object' ? Object.values(value).some(v => v === true) : value === true))
                          .map(([key, _]) => (
                            <Badge 
                              key={key} 
                              variant="secondary" 
                              className="rounded-lg px-3 py-1 bg-primary/5 text-primary border-primary/10 hover:bg-primary/10 transition-colors capitalize text-[11px]"
                            >
                              {key.replace(/_/g, ' ')}
                            </Badge>
                          ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">No specific privileges assigned.</p>
                      )}
                    </div>
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

        <TabsContent value="appearance" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>Customize the look and feel of your dashboard experience.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Interface Theme</Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', name: 'Light', icon: <Sun className="h-4 w-4" /> },
                    { id: 'dark', name: 'Dark', icon: <Moon className="h-4 w-4" /> },
                    { id: 'system', name: 'System', icon: <Smartphone className="h-4 w-4" /> },
                  ].map((t) => (
                    <Button
                      key={t.id}
                      variant={theme === t.id ? 'default' : 'outline'}
                      className={cn(
                        "h-20 flex flex-col gap-2 rounded-2xl transition-all duration-300",
                        theme === t.id ? "bg-primary shadow-lg shadow-primary/20 scale-105" : "hover:bg-primary/5 hover:border-primary/30"
                      )}
                      onClick={() => setTheme(t.id)}
                    >
                      {t.icon}
                      <span className="text-xs font-bold uppercase tracking-tight">{t.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Primary Color Accent</Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {themePresets.map((p) => (
                    <Button
                      key={p.name}
                      variant="outline"
                      className={cn(
                        "h-14 flex items-center justify-start gap-3 rounded-2xl transition-all duration-300 px-3 overflow-hidden",
                        activeColor.name === p.name 
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                      onClick={() => {
                        setActiveColor(p);
                        toast.success(`Theme updated to ${p.name}`);
                      }}
                    >
                      <div 
                        className="h-6 w-6 rounded-lg shadow-inner flex-shrink-0" 
                        style={{ backgroundColor: p.primary }}
                      />
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter truncate",
                        activeColor.name === p.name ? "text-primary" : "text-zinc-500"
                      )}>
                        {p.name.split(' ')[0]}
                      </span>
                    </Button>
                  ))}
                  
                  {/* Custom Color Picker */}
                  <div className="relative group">
                    <Button
                      variant="outline"
                      className={cn(
                        "h-14 w-full flex items-center justify-start gap-3 rounded-2xl transition-all duration-300 px-3 overflow-hidden",
                        activeColor.name === 'Custom' 
                          ? "border-primary bg-primary/5 shadow-md scale-[1.02]" 
                          : "hover:bg-zinc-50 dark:hover:bg-zinc-800"
                      )}
                      onClick={() => document.getElementById('custom-color-picker')?.click()}
                    >
                      <div 
                        className="h-6 w-6 rounded-lg shadow-inner flex-shrink-0 border-2 border-dashed border-zinc-300 flex items-center justify-center text-[10px]" 
                        style={{ backgroundColor: activeColor.name === 'Custom' ? activeColor.primary : 'transparent' }}
                      >
                        {activeColor.name !== 'Custom' && '+'}
                      </div>
                      <span className={cn(
                        "text-[10px] font-bold uppercase tracking-tighter truncate",
                        activeColor.name === 'Custom' ? "text-primary" : "text-zinc-500"
                      )}>
                        Custom
                      </span>
                    </Button>
                    <input 
                      id="custom-color-picker"
                      type="color"
                      className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                      value={activeColor.primary}
                      onChange={(e) => setCustomColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode" className="text-sm font-bold">Compact Interface</Label>
                  <p className="text-[10px] text-muted-foreground">Reduce spacing and padding for a denser layout.</p>
                </div>
                <Switch id="compact-mode" />
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
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider">
                     Security Authentication
                  </h3>
                  <div className="grid gap-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                          <Shield className="h-5 w-5" />
                        </div>
                        <div className="space-y-0.5">
                          <p className="text-sm font-bold">Two-Factor Authentication</p>
                          <p className="text-[10px] text-muted-foreground">Secure your account with SMS verification</p>
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

                <div className="pt-6 border-t">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-muted-foreground uppercase tracking-wider mb-4">
                     Change Password
                  </h3>
                  <div className="grid gap-4 max-w-md">
                    <div className="space-y-2">
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input 
                        id="current-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="rounded-xl"
                        value={passwordState.current}
                        onChange={(e) => setPasswordState({...passwordState, current: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">New Password</Label>
                      <Input 
                        id="new-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="rounded-xl"
                        value={passwordState.new}
                        onChange={(e) => setPasswordState({...passwordState, new: e.target.value})}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">Confirm New Password</Label>
                      <Input 
                        id="confirm-password" 
                        type="password" 
                        placeholder="••••••••" 
                        className="rounded-xl"
                        value={passwordState.confirm}
                        onChange={(e) => setPasswordState({...passwordState, confirm: e.target.value})}
                      />
                    </div>
                    <Button 
                      onClick={handleChangePassword} 
                      disabled={isUpdatingPassword}
                      className="w-full md:w-auto rounded-xl"
                    >
                      {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                    </Button>
                  </div>
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
      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="max-w-2xl rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="sr-only">
            <DialogTitle>Edit Profile Picture</DialogTitle>
            <DialogDescription>Choose a character style or upload your own photo.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="bg-zinc-50 dark:bg-zinc-900/50 p-8 flex flex-col items-center justify-center border-r">
               <div className="relative group">
                 <Avatar className="h-40 w-40 border-8 border-background shadow-2xl transition-transform group-hover:scale-105 duration-500">
                    <AvatarImage src={`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`} />
                    <AvatarFallback className="bg-primary/10 text-primary text-4xl">
                      {avatarSeed.charAt(0)}
                    </AvatarFallback>
                 </Avatar>
                 <div className="absolute -bottom-2 -right-2 bg-primary text-white p-2 rounded-full shadow-lg">
                   <Smartphone className="h-5 w-5" />
                 </div>
               </div>
               <div className="mt-6 text-center">
                 <h3 className="font-bold text-lg">Avatar Preview</h3>
                 <p className="text-xs text-muted-foreground">Generated using {avatarStyle}</p>
               </div>
               <Button 
                 onClick={() => handleUpdateAvatar(`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`)}
                 disabled={isUpdatingAvatar}
                 className="mt-8 w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
               >
                 {isUpdatingAvatar ? 'Saving...' : 'Set as Profile Picture'}
               </Button>
            </div>
            
            <div className="p-8 space-y-6 bg-background">
               <div>
                 <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Choose Style</Label>
                 <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                    <SelectTrigger className="w-full mt-2 rounded-xl">
                      <SelectValue placeholder="Select a style" />
                    </SelectTrigger>
                    <SelectContent>
                      {avatarStyles.map((style) => (
                        <SelectItem key={style.id} value={style.id}>
                          {style.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                 </Select>
               </div>

               <div className="space-y-2">
                 <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Custom Seed</Label>
                 <Input 
                   value={avatarSeed}
                   onChange={(e) => setAvatarSeed(e.target.value)}
                   placeholder="Type anything to randomize..."
                   className="rounded-xl"
                 />
                 <p className="text-[10px] text-muted-foreground">Changing the text will generate a unique character.</p>
               </div>

               <div className="pt-4 border-t">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">Or Upload Photo</Label>
                  <div className="relative">
                    <input
                      type="file"
                      id="avatar-upload"
                      className="hidden"
                      accept="image/*"
                      onChange={handleFileUpload}
                    />
                    <Button 
                      variant="outline" 
                      className="w-full rounded-xl border-dashed py-8 h-auto flex flex-col gap-2 hover:bg-primary/5 hover:border-primary/50 transition-all"
                      onClick={() => document.getElementById('avatar-upload')?.click()}
                    >
                      <Smartphone className="h-6 w-6 text-primary" />
                      <span className="text-xs font-medium">Click to upload image</span>
                    </Button>
                  </div>
               </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Settings;
