'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import PageHeader from '../layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../ui/card';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Switch } from '../ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import { toast } from '../ui/sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import {
  Settings as SettingsIcon,
  Store,
  Building2,
  User,
  Mail,
  Phone,
  Shield,
  Smartphone,
  Fingerprint,
  Sun,
  Moon,
  Zap,
  Video,
  CreditCard,
  ArrowUpCircle,
  Activity,
  CheckCircle2,
  Layers,
  History,
  TrendingUp,
  Edit,
  Landmark,
} from 'lucide-react';
import { Progress } from '../ui/progress';
import { usePrivilege } from '@/hooks/usePrivilege';
import SupermarketSettings from './SupermarketSettings';
import { useSession } from 'next-auth/react';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import { hasuraClient } from '@/lib/hasuraClient';
import {
  GET_PROJECT_USER_BY_ID,
  GET_ORG_EMPLOYEE_BY_ID,
  GET_USER_BY_ID_SIMPLE,
  GET_SHOP_SUBSCRIPTIONS,
  GET_LATEST_USAGE,
  GET_PAYMENT_METHODS,
  ADD_PAYMENT_METHOD,
  UPDATE_PAYMENT_METHOD,
} from '@/lib/graphql/queries';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';
import { format } from 'date-fns';
import { useSystemConfig } from '@/hooks/useSystemConfig';

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
  const { data: systemConfig } = useSystemConfig();
  const currencySymbol = systemConfig?.currency || '$';

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

  const [subscriptionData, setSubscriptionData] = useState<any>(null);
  const [usageData, setUsageData] = useState<any>(null);
  const [paymentMethods, setPaymentMethods] = useState<any[]>([]);
  const [selectedPayoutType, setSelectedPayoutType] = useState<'momo' | 'bank'>('momo');
  const [isLoadingSubscription, setIsLoadingSubscription] = useState(false);
  const [isSavingPayout, setIsSavingPayout] = useState(false);
  const [isEditingPayout, setIsEditingPayout] = useState(false);

  // Payout Form State
  const [payoutForm, setPayoutForm] = useState({
    id: '', // Track existing ID for updates
    names: '',
    number: '',
    provider: 'mtn',
    bankName: '',
    bankBranch: '',
    bankSwift: '',
  });

  useEffect(() => {
    const fetchSubscriptionData = async () => {
      if (!profileData || !hasuraClient) return;

      const shopId = profileData.shop_id;
      const restaurantId = profileData.restaurant_id;

      if (!shopId && !restaurantId) return;

      setIsLoadingSubscription(true);
      try {
        const where: any = {};
        if (shopId) where.shop_id = { _eq: shopId };
        else if (restaurantId) where.restaurant_id = { _eq: restaurantId };


        const subData = await hasuraClient.request<any>(GET_SHOP_SUBSCRIPTIONS, { where });
        if (subData.shop_subscriptions?.[0]) {
          setSubscriptionData(subData.shop_subscriptions[0]);
        }

        // Fetch usage data separately
        const businessId = subData.shop_subscriptions?.[0]?.business_id || profileData.business_id;
        const usageWhere: any = { _or: [] };
        if (shopId) usageWhere._or.push({ shop_id: { _eq: shopId } });
        if (restaurantId) usageWhere._or.push({ restaurant_id: { _eq: restaurantId } });
        if (businessId) usageWhere._or.push({ business_id: { _eq: businessId } });


        if (usageWhere._or.length > 0) {
          const usageResponse = await hasuraClient.request<any>(GET_LATEST_USAGE, {
            aiWhere: usageWhere,
            reelWhere: usageWhere,
          });
          setUsageData(usageResponse);
        }

        // Fetch payment methods
        if (shopId) {
          const pmData = await hasuraClient.request<any>(GET_PAYMENT_METHODS, { _eq: shopId });
          if (pmData.Payment_Methods && pmData.Payment_Methods.length > 0) {
            setPaymentMethods(pmData.Payment_Methods);
            // Pre-fill with the first method (usually default)
            const firstMethod = pmData.Payment_Methods[0];
            setSelectedPayoutType(firstMethod.method as 'momo' | 'bank');
            
            let bankName = '';
            let accNumber = firstMethod.number;
            if (firstMethod.method === 'bank') {
              const parts = firstMethod.number.split(' - ');
              if (parts.length > 1) {
                bankName = parts[0];
                accNumber = parts[1];
              }
            }

            setPayoutForm({
              id: firstMethod.id,
              names: firstMethod.names,
              number: accNumber,
              provider: 'mtn', // Default for now
              bankName: bankName,
              bankBranch: '', // Not in DB yet but UI shows it
              bankSwift: '',
            });
            setIsEditingPayout(false); // Start in read-only mode if data exists
          } else {
            setIsEditingPayout(true); // Allow adding if none exist
          }
        }
      } catch (error) {
        console.error('Error fetching subscription data:', error);
      } finally {
        setIsLoadingSubscription(false);
      }
    };

    fetchSubscriptionData();
  }, [profileData?.shop_id, profileData?.restaurant_id]);

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
              membership_id: pUser.MembershipId,
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
              display_image: eUser.profile,
              membership_id: eUser.MembershipId,
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
              display_image: uUser.profile_picture,
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
          Authorization: `Bearer ${currentUserId}`,
        },
        body: JSON.stringify({
          currentPassword: passwordState.current,
          newPassword: passwordState.new,
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
          Authorization: `Bearer ${currentUserId}`,
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
      setIsLoadingUser(false);
    }
  };

  const handleSavePayoutMethod = async () => {
    if (!payoutForm.names || !payoutForm.number) {
      toast.error('Please fill in the required fields');
      return;
    }

    setIsSavingPayout(true);
    try {
      const shopId = profileData.shop_id || profileData.id;
      const restaurantId = profileData.restaurant_id;

      const formattedNumber = selectedPayoutType === 'bank' ? `${payoutForm.bankName} - ${payoutForm.number}` : payoutForm.number;

      if (payoutForm.id) {
        // Update existing
        await hasuraClient.request(UPDATE_PAYMENT_METHOD, {
          id: payoutForm.id,
          set: {
            method: selectedPayoutType,
            names: payoutForm.names,
            number: formattedNumber,
            user_id: null,
          }
        });
        toast.success('Payout method updated successfully');
      } else {
        // Add new
        const object: any = {
          method: selectedPayoutType,
          names: payoutForm.names,
          number: formattedNumber,
          shop_id: shopId,
          restaurant_id: restaurantId,
          user_id: null,
          is_default: paymentMethods.length === 0,
        };
        await hasuraClient.request(ADD_PAYMENT_METHOD, { object });
        toast.success('Payout method added successfully');
      }
      
      // Refresh list
      const pmData = await hasuraClient.request<any>(GET_PAYMENT_METHODS, { _eq: shopId });
      if (pmData.Payment_Methods) {
        setPaymentMethods(pmData.Payment_Methods);
        // Pre-fill again with the first one
        if (pmData.Payment_Methods.length > 0) {
          const firstMethod = pmData.Payment_Methods[0];
          setPayoutForm(prev => ({ ...prev, id: firstMethod.id }));
        }
      }
      setIsEditingPayout(false);
    } catch (error) {
      console.error('Error saving payout method:', error);
      toast.error('Failed to save payout method');
    } finally {
      setIsSavingPayout(false);
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

  const maskAccountNumber = (number: string) => {
    if (!number) return '';
    if (number.length <= 4) return number;
    const visible = number.slice(-4);
    const masked = '*'.repeat(number.length - 4);
    return `${masked}${visible}`;
  };

  return (
    <AdminLayout isLoading={isLoadingUser || !profileData}>
      <PageHeader
        title="Settings"
        description="Manage your account preferences and security settings."
        icon={<SettingsIcon className="h-8 w-8" />}
      />

      <Tabs defaultValue="profile">
        <TabsList className="mb-4 bg-muted/40 backdrop-blur-md p-1 rounded-2xl border border-muted-foreground/10">
          <TabsTrigger value="profile" className="rounded-lg px-6">
            My Profile
          </TabsTrigger>
          {(profileData?.display_role === 'globalAdmin' ||
            profileData?.display_role === 'storeAdministrator') && (
            <>
              <TabsTrigger value="general" className="rounded-lg px-6">
                Billing & Usage
              </TabsTrigger>
              <TabsTrigger value="supermarket" className="rounded-lg px-6">
                Supermarket
              </TabsTrigger>
            </>
          )}
          <TabsTrigger value="appearance" className="rounded-lg px-6">
            Appearance
          </TabsTrigger>
          {(profileData?.display_role === 'globalAdmin' ||
            profileData?.display_role === 'storeAdministrator') && (
            <>
              <TabsTrigger value="notifications" className="rounded-lg px-6">
                Notifications
              </TabsTrigger>
              {(profileData?.display_role === 'globalAdmin' ||
                profileData?.display_role === 'storeAdministrator') && (
                <TabsTrigger value="payment-methods" className="rounded-lg px-6">
                  Payment Methods
                </TabsTrigger>
              )}
            </>
          )}
          <TabsTrigger value="security" className="rounded-lg px-6">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="profile"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 border-none shadow-xl bg-gradient-to-br from-primary/5 via-background to-background rounded-3xl overflow-hidden">
              <div className="h-24 bg-primary/10 relative">
                <div
                  className="absolute -bottom-10 left-1/2 -translate-x-1/2 group cursor-pointer"
                  onClick={() => setIsAvatarDialogOpen(true)}
                >
                  <Avatar className="h-20 w-20 border-4 border-background shadow-lg transition-transform group-hover:scale-105">
                    <AvatarImage
                      src={profileData?.display_image || user?.image || user?.profile_picture}
                    />
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
                  <Badge variant="secondary" className="rounded-full px-3">
                    {profileData?.display_role || user?.role || 'Admin'}
                  </Badge>
                  {profileData?.membership_id && (
                    <Badge variant="outline" className="rounded-full px-3 text-[10px]">
                      ID: {profileData.membership_id}
                    </Badge>
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
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Email
                      </span>
                      <span className="text-sm font-medium">
                        {profileData?.display_email || user?.email}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
                        Gender
                      </span>
                      <span className="text-sm font-medium capitalize">
                        {profileData?.gender || 'Not specified'}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
                <CardHeader className="border-b border-muted-foreground/10 bg-zinc-50/50 dark:bg-zinc-900/50">
                  <CardTitle className="text-lg font-bold">Personal Details</CardTitle>
                  <CardDescription className="text-xs">
                    View your account identity and contact information.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name / Username</Label>
                      <Input
                        defaultValue={profileData?.display_name || user?.name}
                        disabled
                        className="rounded-xl bg-muted/30 border-muted-foreground/10 text-foreground font-semibold opacity-100 disabled:opacity-100 disabled:cursor-default"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Account ID</Label>
                      <Input
                        defaultValue={profileData?.membership_id || profileData?.id}
                        disabled
                        className="rounded-xl bg-muted/30 border-muted-foreground/10 text-foreground font-mono text-xs opacity-100 disabled:opacity-100 disabled:cursor-default"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Email Address</Label>
                      <Input
                        defaultValue={profileData?.display_email || user?.email}
                        disabled
                        className="rounded-xl bg-muted/30 border-muted-foreground/10 text-foreground font-semibold opacity-100 disabled:opacity-100 disabled:cursor-default"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</Label>
                      <Input
                        defaultValue={profileData?.display_phone || user?.phone}
                        disabled
                        className="rounded-xl bg-muted/30 border-muted-foreground/10 text-foreground font-semibold opacity-100 disabled:opacity-100 disabled:cursor-default"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>Position / Role</Label>
                      <Input
                        defaultValue={profileData?.display_role || 'General User'}
                        disabled
                        className="rounded-xl bg-muted/30 border-muted-foreground/10 text-foreground font-medium capitalize"
                      />
                    </div>
                  </div>
                  <div className="space-y-4 pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                        Account Privileges
                      </Label>
                      <Badge variant="outline" className="rounded-full text-[10px]">
                        {profileData?.display_role || 'General Access'}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {profileData?.privileges ? (
                        Object.entries(profileData.privileges)
                          .filter(
                            ([_, value]) =>
                              value &&
                              (typeof value === 'object'
                                ? Object.values(value).some(v => v === true)
                                : value === true)
                          )
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
                        <p className="text-xs text-muted-foreground italic">
                          No specific privileges assigned.
                        </p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Current Plan Card - Made Smaller (1 column) */}
            <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 via-background to-background rounded-3xl overflow-hidden">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-xl font-bold flex flex-wrap items-center gap-2">
                      {subscriptionData?.plan?.name || 'Standard Plan'}
                      <Badge className={cn(
                        "border-none text-[10px] h-5",
                        subscriptionData?.status === 'active' ? "bg-primary/20 text-primary" : "bg-zinc-500/20 text-zinc-500"
                      )}>
                        {subscriptionData?.status?.toUpperCase() || 'INACTIVE'}
                      </Badge>
                    </CardTitle>
                    <CardDescription className="text-xs line-clamp-1">
                      {subscriptionData?.plan?.description || 'Managed subscription'}
                    </CardDescription>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <Zap className="h-5 w-5 text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pt-4">
                <div className="space-y-3">
                  <div className="p-3 rounded-2xl bg-muted/30 border border-muted-foreground/5 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Renewal</p>
                    <div className="flex items-center gap-2">
                      <History className="h-3 w-3 text-primary" />
                      <span className="font-semibold text-sm">
                        {subscriptionData?.end_date ? format(new Date(subscriptionData.end_date), 'MMM dd, yyyy') : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="p-3 rounded-2xl bg-muted/30 border border-muted-foreground/5 flex items-center justify-between">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Pricing</p>
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-3 w-3 text-primary" />
                      <span className="font-semibold text-sm">
                        {currencySymbol}{subscriptionData?.billing_cycle === 'yearly' ? subscriptionData?.plan?.price_yearly : subscriptionData?.plan?.price_monthly || '0.00'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button size="sm" className="w-full rounded-xl h-10 shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-transform flex items-center justify-center gap-2">
                    <ArrowUpCircle className="h-4 w-4" />
                    Upgrade
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payment Method Card (Merchant Wallet) - Made Bigger (2 columns) */}
            <Card className="md:col-span-2 border-none shadow-xl rounded-3xl overflow-hidden bg-muted/10">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <CardTitle className="text-2xl font-bold">Merchant Wallet</CardTitle>
                    <CardDescription>Primary funding source for your business operations</CardDescription>
                  </div>
                  <Badge className="bg-primary/10 text-primary border-none hover:bg-primary/20 transition-colors">
                    ACTIVE WALLET
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-center">
                  <div className="lg:col-span-3 p-6 rounded-[2rem] bg-zinc-950 dark:bg-zinc-900 text-white shadow-2xl relative overflow-hidden group min-h-[220px] flex flex-col justify-between">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-all duration-700 scale-150 group-hover:rotate-12">
                      <Layers className="h-32 w-32" />
                    </div>
                    
                    <div className="relative z-10 space-y-8">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/40 font-mono tracking-widest uppercase">Available Balance</p>
                          <p className="text-4xl font-mono tracking-tighter font-bold text-primary">
                            {currencySymbol}{(subscriptionData?.Shop?.merchant_wallet?.balance || subscriptionData?.Restaurant?.merchant_wallet?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </p>
                        </div>
                        <div className="h-10 w-16 bg-zinc-800/50 backdrop-blur-md rounded-xl flex items-center justify-center border border-white/10">
                          <div className="h-6 w-10 bg-primary/60 rounded-lg shadow-[0_0_15px_rgba(34,197,94,0.3)]" />
                        </div>
                      </div>

                      <div className="flex justify-between items-end">
                        <div className="space-y-1">
                          <p className="text-[10px] text-white/40 uppercase tracking-widest">Wallet Holder</p>
                          <p className="text-sm font-semibold uppercase tracking-wider">
                            {subscriptionData?.Shop?.name || subscriptionData?.Restaurant?.name || 'Admin User'}
                          </p>
                        </div>
                        <div className="flex -space-x-3">
                          <div className="h-10 w-10 rounded-full bg-white/10 border border-white/20 backdrop-blur-sm flex items-center justify-center">
                            <Zap className="h-5 w-5 text-white/20" />
                          </div>
                          <div className="h-10 w-10 rounded-full bg-primary/40 border border-white/20 backdrop-blur-sm shadow-xl flex items-center justify-center">
                            <TrendingUp className="h-5 w-5 text-white" />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="lg:col-span-2 space-y-4">
                    <div className="p-4 rounded-2xl bg-background border border-primary/10 space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Linked Business</p>
                      <p className="text-sm font-semibold truncate">
                        {subscriptionData?.Shop?.name || subscriptionData?.Restaurant?.name || 'Main Entity'}
                      </p>
                    </div>
                    <div className="p-4 rounded-2xl bg-background border border-primary/10 space-y-1">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Last Transaction</p>
                      <p className="text-sm font-semibold">
                        {subscriptionData?.Shop?.merchant_wallet?.update_at ? format(new Date(subscriptionData.Shop.merchant_wallet.update_at), 'MMM dd, HH:mm') : 'Recently'}
                      </p>
                    </div>
                    <Button className="w-full rounded-2xl h-12 shadow-lg shadow-primary/20 bg-primary hover:scale-[1.02] transition-all duration-300 flex items-center justify-center gap-2">
                      <ArrowUpCircle className="h-5 w-5" />
                      Top Up Wallet
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Usage Tracker */}
            {(() => {
              const aiData = usageData?.ai_usage?.[0];
              const aiLimit = aiData?.request_count !== undefined ? aiData.request_count : (subscriptionData?.plan?.ai_request_limit || 0);
              const aiUsed = aiData?.requests_sent || 0;
              const isUnlimited = aiLimit === -1;
              const aiPercentage = isUnlimited ? 0 : (aiLimit > 0 ? Math.min(Math.round((aiUsed / aiLimit) * 100), 100) : 0);
              const hasNoSubscription = !aiData && aiLimit <= 5;

              return (
                <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-muted/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Zap className="h-4 w-4 text-primary" />
                          AI Intelligence Usage
                        </CardTitle>
                        <CardDescription>
                          {hasNoSubscription ? 'Unlock AI-powered content generation' : 'Consumption of AI credits for content generation'}
                        </CardDescription>
                      </div>
                      <TrendingUp className="h-5 w-5 text-primary opacity-50" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {hasNoSubscription ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                        <div className="p-4 rounded-full bg-primary/10">
                          <Zap className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold">No AI Subscription</p>
                          <p className="text-xs text-muted-foreground max-w-[200px]">Upgrade your plan to start using AI for your business content.</p>
                        </div>
                        <Button className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2 shadow-lg shadow-primary/20">
                          <ArrowUpCircle className="h-4 w-4" />
                          Subscribe to AI
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold">
                              {isUnlimited ? 'Unlimited' : `${aiUsed.toLocaleString()} / ${aiLimit.toLocaleString()}`} Credits
                            </span>
                            {!isUnlimited && <span className="text-primary font-bold">{aiPercentage}%</span>}
                          </div>
                          <Progress value={isUnlimited ? 0 : aiPercentage} className="h-3 rounded-full bg-muted shadow-inner" />
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Monthly Cap</p>
                            <p className="text-sm font-bold">{isUnlimited ? '∞' : aiLimit.toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Remaining</p>
                            <p className="text-sm font-bold text-primary">{isUnlimited ? '∞' : Math.max(0, aiLimit - aiUsed).toLocaleString()}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase font-bold text-muted-foreground">Reset In</p>
                            <p className="text-sm font-bold">
                              {subscriptionData?.end_date ? Math.max(0, Math.ceil((new Date(subscriptionData.end_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 0} Days
                            </p>
                          </div>
                        </div>
                        <Button className="w-full rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border-none transition-colors gap-2">
                          <ArrowUpCircle className="h-4 w-4" />
                          Purchase More Credits
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })()}

            {/* Reel Production Usage */}
            {(() => {
              const reelData = usageData?.reel_usage?.[0];
              const reelLimit = subscriptionData?.plan?.reel_limit || 0;
              const reelUsed = reelData?.upload_count || 0;
              const reelPercentage = reelLimit > 0 ? Math.min(Math.round((reelUsed / reelLimit) * 100), 100) : 0;
              const hasNoReelSubscription = !reelData && reelLimit <= 0;

              return (
                <Card className="border-none shadow-lg rounded-3xl overflow-hidden bg-muted/5">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <Video className="h-4 w-4 text-primary" />
                          Reel Production Limits
                        </CardTitle>
                        <CardDescription>
                          {hasNoReelSubscription ? 'Create stunning video marketing reels' : 'Monthly video marketing generation quota'}
                        </CardDescription>
                      </div>
                      <Activity className="h-5 w-5 text-primary opacity-50" />
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {hasNoReelSubscription ? (
                      <div className="flex flex-col items-center justify-center py-4 space-y-4 text-center">
                        <div className="p-4 rounded-full bg-primary/10">
                          <Video className="h-8 w-8 text-primary" />
                        </div>
                        <div className="space-y-1">
                          <p className="font-bold">No Reel Quota</p>
                          <p className="text-xs text-muted-foreground max-w-[200px]">Activate your reel production quota to start generating video content.</p>
                        </div>
                        <Button className="w-full rounded-2xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors gap-2 shadow-lg shadow-primary/20">
                          <Layers className="h-4 w-4" />
                          Activate Reel Plan
                        </Button>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="font-semibold">{reelUsed.toLocaleString()} / {reelLimit.toLocaleString()} Reels</span>
                            <span className="text-primary font-bold">{reelPercentage}%</span>
                          </div>
                          <Progress value={reelPercentage} className="h-3 rounded-full bg-muted shadow-inner" />
                        </div>
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/10 flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                            <CheckCircle2 className="h-6 w-6 text-primary" />
                          </div>
                          <div>
                            <p className="text-xs font-bold">Standard Resolution (1080p)</p>
                            <p className="text-[10px] text-muted-foreground">
                              {reelLimit - reelUsed} productions remaining this cycle
                            </p>
                          </div>
                        </div>
                        <Button className="w-full rounded-2xl bg-primary/10 hover:bg-primary/20 text-primary border-none transition-colors gap-2">
                          <Layers className="h-4 w-4" />
                          Manage Quota Settings
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>
              );
            })()}
          </div>

          {/* Subscription Invoices Table */}
          <Card className="border-none shadow-xl rounded-3xl overflow-hidden bg-muted/10">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">Subscription Invoices</CardTitle>
                <CardDescription>Review and download your billing history</CardDescription>
              </div>
              <Button variant="outline" className="rounded-xl border-primary/10 hover:bg-primary/5 text-primary gap-2">
                <History className="h-4 w-4" />
                View Full History
              </Button>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-muted-foreground/10">
                      <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Invoice</th>
                      <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Date</th>
                      <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Amount</th>
                      <th className="py-4 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Status</th>
                      <th className="py-4"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {subscriptionData?.subscription_invoices?.length > 0 ? (
                      subscriptionData.subscription_invoices.map((invoice: any) => (
                        <tr key={invoice.id} className="border-b border-muted-foreground/5 hover:bg-muted/5 transition-colors">
                          <td className="py-4">
                            <p className="font-semibold text-foreground">#{invoice.invoice_number || invoice.id.slice(0, 8)}</p>
                            <p className="text-[10px] text-muted-foreground">{invoice.plan_name}</p>
                          </td>
                          <td className="py-4">
                            <span className="text-muted-foreground">
                              {invoice.created_at ? format(new Date(invoice.created_at), 'MMM dd, yyyy') : 'N/A'}
                            </span>
                          </td>
                          <td className="py-4">
                            <span className="font-bold">
                              {currencySymbol}{invoice.plan_price?.toLocaleString()}
                            </span>
                          </td>
                          <td className="py-4">
                            <Badge className={cn(
                              "rounded-full px-2 py-0 h-5 text-[10px] border-none font-bold",
                              invoice.status === 'paid' ? "bg-primary/20 text-primary" : "bg-zinc-500/20 text-zinc-500"
                            )}>
                              {invoice.status?.toUpperCase() || 'PENDING'}
                            </Badge>
                          </td>
                          <td className="py-4 text-right">
                            <Button variant="ghost" size="sm" className="rounded-lg h-8 text-primary hover:bg-primary/10">
                              Download
                            </Button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="py-12 text-center text-muted-foreground italic">
                          No invoices found for this subscription.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {hasAction('settings', 'view_settings') && (
          <TabsContent value="supermarket" className="space-y-6">
            <SupermarketSettings />
          </TabsContent>
        )}

        <TabsContent
          value="appearance"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <Card className="border-none shadow-lg rounded-3xl overflow-hidden">
            <CardHeader className="border-b bg-zinc-50/50 dark:bg-zinc-900/50">
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize the look and feel of your dashboard experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-6 space-y-8">
              <div className="space-y-4">
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Interface Theme
                </Label>
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { id: 'light', name: 'Light', icon: <Sun className="h-4 w-4" /> },
                    { id: 'dark', name: 'Dark', icon: <Moon className="h-4 w-4" /> },
                    { id: 'system', name: 'System', icon: <Smartphone className="h-4 w-4" /> },
                  ].map(t => (
                    <Button
                      key={t.id}
                      variant={theme === t.id ? 'default' : 'outline'}
                      className={cn(
                        'h-20 flex flex-col gap-2 rounded-2xl transition-all duration-300',
                        theme === t.id
                          ? 'bg-primary shadow-lg shadow-primary/20 scale-105'
                          : 'hover:bg-primary/5 hover:border-primary/30'
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
                <Label className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
                  Primary Color Accent
                </Label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {themePresets.map(p => (
                    <Button
                      key={p.name}
                      variant="outline"
                      className={cn(
                        'h-14 flex items-center justify-start gap-3 rounded-2xl transition-all duration-300 px-3 overflow-hidden',
                        activeColor.name === p.name
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
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
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-tighter truncate',
                          activeColor.name === p.name ? 'text-primary' : 'text-zinc-500'
                        )}
                      >
                        {p.name.split(' ')[0]}
                      </span>
                    </Button>
                  ))}

                  <div className="relative group">
                    <Button
                      variant="outline"
                      className={cn(
                        'h-14 w-full flex items-center justify-start gap-3 rounded-2xl transition-all duration-300 px-3 overflow-hidden',
                        activeColor.name === 'Custom'
                          ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                          : 'hover:bg-zinc-50 dark:hover:bg-zinc-800'
                      )}
                      onClick={() => document.getElementById('custom-color-picker')?.click()}
                    >
                      <div
                        className="h-6 w-6 rounded-lg shadow-inner flex-shrink-0 border-2 border-dashed border-zinc-300 flex items-center justify-center text-[10px]"
                        style={{
                          backgroundColor:
                            activeColor.name === 'Custom' ? activeColor.primary : 'transparent',
                        }}
                      >
                        {activeColor.name !== 'Custom' && '+'}
                      </div>
                      <span
                        className={cn(
                          'text-[10px] font-bold uppercase tracking-tighter truncate',
                          activeColor.name === 'Custom' ? 'text-primary' : 'text-zinc-500'
                        )}
                      >
                        Custom
                      </span>
                    </Button>
                    <input
                      id="custom-color-picker"
                      type="color"
                      className="absolute inset-0 opacity-0 cursor-pointer pointer-events-none"
                      value={activeColor.primary}
                      onChange={e => setCustomColor(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl border border-dashed">
                <div className="space-y-0.5">
                  <Label htmlFor="compact-mode" className="text-sm font-bold">
                    Compact Interface
                  </Label>
                  <p className="text-[10px] text-muted-foreground">
                    Reduce spacing and padding for a denser layout.
                  </p>
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
                    <Label htmlFor="push-offers">New Offers</Label>
                    <Switch id="push-offers" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="push-messages">Direct Messages</Label>
                    <Switch id="push-messages" defaultChecked />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="border-t bg-zinc-50/50 dark:bg-zinc-900/50 pt-6">
              <Button onClick={handleSaveChanges} className="rounded-xl px-8">
                Save Preferences
              </Button>
            </CardFooter>
          </Card>
        </TabsContent>

        <TabsContent value="payment-methods" className="space-y-6">
          <Card className="border-none shadow-xl bg-gradient-to-br from-background to-muted/20 rounded-3xl overflow-hidden">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-primary/10">
                    <CreditCard className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Payout Management</CardTitle>
                    <CardDescription>Configure and manage your payout destinations.</CardDescription>
                  </div>
                </div>
                {profileData?.display_role === 'storeAdministrator' && (
                  <Badge variant="outline" className="rounded-lg bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1">
                    <Shield className="h-3 w-3" />
                    View Only
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-8">
              {/* Existing Methods Table */}
              {paymentMethods.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Registered Payout Methods</h3>
                  <div className="rounded-2xl border border-muted-foreground/10 overflow-hidden bg-background">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-muted/50 text-muted-foreground">
                        <tr>
                          <th className="px-4 py-3 font-semibold">Method</th>
                          <th className="px-4 py-3 font-semibold">Account Name</th>
                          <th className="px-4 py-3 font-semibold">Account Number</th>
                          <th className="px-4 py-3 font-semibold text-center">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-muted-foreground/10">
                        {paymentMethods.map((pm) => (
                          <tr key={pm.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-4">
                              <div className="flex items-center gap-2">
                                {pm.method === 'momo' ? <Smartphone className="h-4 w-4 text-primary" /> : <Landmark className="h-4 w-4 text-primary" />}
                                <span className="capitalize">{pm.method === 'momo' ? 'Mobile Money' : 'Bank Transfer'}</span>
                              </div>
                            </td>
                            <td className="px-4 py-4 font-medium">{pm.names}</td>
                            <td className="px-4 py-4 font-mono text-xs">{maskAccountNumber(pm.number)}</td>
                            <td className="px-4 py-4 text-center">
                              {pm.is_default ? (
                                <Badge className="bg-primary/10 text-primary border-none">Default</Badge>
                              ) : (
                                <span className="text-[10px] text-muted-foreground">Secondary</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {profileData?.display_role === 'globalAdmin' && (
                <div className="space-y-6">
                  <div className="h-px bg-muted-foreground/10" />
                  
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Add New Payout Method</h3>
                    <div className="flex gap-4 p-1 bg-muted rounded-2xl w-fit">
                      <button
                        onClick={() => {
                          if (!isEditingPayout) return;
                          setSelectedPayoutType('momo');
                        }}
                        disabled={!isEditingPayout}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
                          selectedPayoutType === 'momo' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground",
                          !isEditingPayout && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Smartphone className="h-4 w-4" />
                        Mobile Money
                      </button>
                      <button
                        onClick={() => {
                          if (!isEditingPayout) return;
                          setSelectedPayoutType('bank');
                        }}
                        disabled={!isEditingPayout}
                        className={cn(
                          "flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all",
                          selectedPayoutType === 'bank' ? "bg-background shadow-md text-primary" : "text-muted-foreground hover:text-foreground",
                          !isEditingPayout && "opacity-50 cursor-not-allowed"
                        )}
                      >
                        <Landmark className="h-4 w-4" />
                        Bank Account
                      </button>
                    </div>

                    {selectedPayoutType === 'momo' ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label htmlFor="momo-provider">Network Provider</Label>
                          <Select 
                            value={payoutForm.provider} 
                            onValueChange={(v) => setPayoutForm(prev => ({ ...prev, provider: v }))}
                            disabled={!isEditingPayout}
                          >
                            <SelectTrigger id="momo-provider" className="rounded-xl border-muted-foreground/20">
                              <SelectValue placeholder="Select provider" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                              <SelectItem value="airtel">Airtel Money</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="momo-number">Phone Number</Label>
                          <Input 
                            id="momo-number" 
                            placeholder="e.g. 078XXXXXXX" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.number}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, number: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="momo-name">Account Name</Label>
                          <Input 
                            id="momo-name" 
                            placeholder="Full name as it appears on account" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.names}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, names: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                        <div className="space-y-2">
                          <Label htmlFor="bank-name">Bank Name</Label>
                          <Input 
                            id="bank-name" 
                            placeholder="Enter bank name" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.bankName}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, bankName: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-account">Account Number</Label>
                          <Input 
                            id="bank-account" 
                            placeholder="Enter account number" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.number}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, number: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-branch">Branch Name</Label>
                          <Input 
                            id="bank-branch" 
                            placeholder="Enter branch name" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.bankBranch}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, bankBranch: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="bank-swift">SWIFT / BIC Code</Label>
                          <Input 
                            id="bank-swift" 
                            placeholder="Enter SWIFT code" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.bankSwift}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, bankSwift: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                        <div className="space-y-2 md:col-span-2">
                          <Label htmlFor="bank-holder">Account Holder Name</Label>
                          <Input 
                            id="bank-holder" 
                            placeholder="Full name as it appears on bank statement" 
                            className="rounded-xl border-muted-foreground/20" 
                            value={payoutForm.names}
                            onChange={(e) => setPayoutForm(prev => ({ ...prev, names: e.target.value }))}
                            readOnly={!isEditingPayout}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </CardContent>
            {profileData?.display_role === 'globalAdmin' && (
              <CardFooter className="border-t bg-zinc-50/50 dark:bg-zinc-900/50 pt-6 flex justify-between items-center">
                {!isEditingPayout ? (
                  <Button 
                    onClick={() => setIsEditingPayout(true)} 
                    variant="outline"
                    className="rounded-xl px-8 border-primary text-primary hover:bg-primary/10 transition-colors gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modify Payout Method
                  </Button>
                ) : (
                  <div className="flex gap-3">
                    <Button 
                      onClick={handleSavePayoutMethod} 
                      className="rounded-xl px-8 shadow-lg shadow-primary/20"
                      disabled={isSavingPayout}
                    >
                      {isSavingPayout ? 'Saving...' : payoutForm.id ? 'Update Method' : 'Add Method'}
                    </Button>
                    {payoutForm.id && (
                      <Button 
                        onClick={() => setIsEditingPayout(false)} 
                        variant="ghost"
                        className="rounded-xl px-6"
                      >
                        Cancel
                      </Button>
                    )}
                  </div>
                )}
              </CardFooter>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Manage your password and account security options.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-sm font-medium">Change Password</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="current-password">Current Password</Label>
                    <Input
                      id="current-password"
                      type="password"
                      className="rounded-xl"
                      value={passwordState.current}
                      onChange={e =>
                        setPasswordState(prev => ({ ...prev, current: e.target.value }))
                      }
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <Input
                      id="new-password"
                      type="password"
                      className="rounded-xl"
                      value={passwordState.new}
                      onChange={e => setPasswordState(prev => ({ ...prev, new: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirm New Password</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      className="rounded-xl"
                      value={passwordState.confirm}
                      onChange={e =>
                        setPasswordState(prev => ({ ...prev, confirm: e.target.value }))
                      }
                    />
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={isUpdatingPassword}
                  className="rounded-xl"
                >
                  {isUpdatingPassword ? 'Updating...' : 'Update Password'}
                </Button>
              </div>

              <div className="pt-6 border-t">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <h3 className="text-sm font-medium">Two-Factor Authentication</h3>
                    <p className="text-xs text-muted-foreground">
                      Add an extra layer of security to your account.
                    </p>
                  </div>
                  <Switch
                    checked={isTwoFactorEnabled}
                    onCheckedChange={handleToggle2FA}
                    className="data-[state=checked]:bg-primary"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl">
          <div className="grid grid-cols-1 md:grid-cols-2">
            <div className="p-8 bg-muted/30 flex flex-col items-center justify-center border-r">
              <div className="relative group">
                <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl group-hover:bg-primary/30 transition-all duration-500" />
                <Avatar className="h-48 w-48 border-8 border-background shadow-2xl relative z-10 transition-transform duration-500 group-hover:scale-105">
                  <AvatarImage
                    src={`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`}
                  />
                  <AvatarFallback className="text-4xl font-bold bg-zinc-100">
                    {profileData?.display_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
              </div>
              <div className="mt-6 text-center">
                <h3 className="font-bold text-lg">Avatar Preview</h3>
                <p className="text-xs text-muted-foreground">Generated using {avatarStyle}</p>
              </div>
              <Button
                onClick={() =>
                  handleUpdateAvatar(
                    `https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${avatarSeed}`
                  )
                }
                disabled={isUpdatingAvatar}
                className="mt-8 w-full rounded-xl bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
              >
                {isUpdatingAvatar ? 'Saving...' : 'Set as Profile Picture'}
              </Button>
            </div>

            <div className="p-8 space-y-6 bg-background">
              <div>
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Choose Style
                </Label>
                <Select value={avatarStyle} onValueChange={setAvatarStyle}>
                  <SelectTrigger className="w-full mt-2 rounded-xl">
                    <SelectValue placeholder="Select a style" />
                  </SelectTrigger>
                  <SelectContent>
                    {avatarStyles.map(style => (
                      <SelectItem key={style.id} value={style.id}>
                        {style.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Custom Seed
                </Label>
                <Input
                  value={avatarSeed}
                  onChange={e => setAvatarSeed(e.target.value)}
                  placeholder="Type anything to randomize..."
                  className="rounded-xl"
                />
                <p className="text-[10px] text-muted-foreground">
                  Changing the text will generate a unique character.
                </p>
              </div>

              <div className="pt-4 border-t">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-3">
                  Or Upload Photo
                </Label>
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
