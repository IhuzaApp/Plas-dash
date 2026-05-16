'use client';

import React, { useState, useEffect } from 'react';
import AdminLayout from '../layout/AdminLayout';
import PageHeader from '../layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '../ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from '../ui/sonner';
import { Settings as SettingsIcon, CreditCard, Landmark, Smartphone, Edit } from 'lucide-react';
import { usePrivilege } from '@/hooks/usePrivilege';
import SupermarketSettings from './SupermarketSettings';
import { useSession } from 'next-auth/react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from 'next-themes';
import { cn } from '@/lib/utils';
import { Switch } from '../ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Badge } from '../ui/badge';
import ProfileTab from './settings/ProfileTab';
import BillingUsageTab from './settings/BillingUsageTab';
import AppearanceTab from './settings/AppearanceTab';
import PaymentMethodsTab from './settings/PaymentMethodsTab';
import SecurityTab from './settings/SecurityTab';
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

  const { theme, setTheme } = useTheme();
  const { color: activeColor, setColor: setActiveColor, setCustomColor } = useThemeColor();
  const { data: systemConfig } = useSystemConfig();
  const currencySymbol = systemConfig?.currency || '$';

  const handleSaveChanges = () => {
    toast.success('Settings saved successfully');
  };

  const { hasAction } = usePrivilege();
  const { data: session, update: updateNextAuthSession } = useSession();
  const { login: updateAuthSession, session: currentAuthSession } = useAuth();
  const user = session?.user as any;
  const [isTwoFactorEnabled, setIsTwoFactorEnabled] = useState(false);
  const [twoFactorSecret, setTwoFactorSecret] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<any>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

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

      // Prioritize local session for organization employees
      if (typeof window !== 'undefined') {
        const localSession = localStorage.getItem('orgEmployeeSession');
        if (localSession) {
          try {
            const parsed = JSON.parse(localSession);
            // If we have a local session, prefer it as it's more specific for this dashboard
            currentUserId = parsed.id;
            currentUserType = parsed.isProjectUser ? 'project_user' : 'employee';
          } catch (e) {}
        }
      }

      if (!currentUserId) {
        setIsLoadingUser(false);
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
              display_image: (pUser as any).profile || (pUser as any).profile_picture || (pUser as any).profile_photo,
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
              display_image: (eUser as any).profile_image || (eUser as any).profile_photo || (eUser as any).profile_picture || (eUser as any).profile,
              membership_id: eUser.employeeID,
            });
            setIsTwoFactorEnabled(eUser.multAuthEnabled || !!eUser.twoFactorSecrets);
            setTwoFactorSecret(eUser.twoFactorSecrets);
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

    const endpoint = currentUserType === 'employee' 
      ? '/api/mutations/update-employee-2fa' 
      : '/api/mutations/update-project-user-2fa';

    try {
      const response = await fetch(endpoint, {
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

  const handleReset2FA = async () => {
    let currentUserId = user?.id;
    let currentUserType = user?.type;
    if (!currentUserId && typeof window !== 'undefined') {
      const localSession = localStorage.getItem('orgEmployeeSession');
      if (localSession) {
        const parsed = JSON.parse(localSession);
        currentUserId = parsed.id;
        currentUserType = parsed.isProjectUser ? 'project_user' : 'employee';
      }
    }

    if (!currentUserId) return;

    try {
      const endpoint = currentUserType === 'employee' 
        ? '/api/mutations/update-employee-2fa-secret' 
        : '/api/mutations/update-project-user-2fa-secret';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: currentUserId, secret: null }),
      });

      if (!response.ok) throw new Error('Failed to reset 2FA');

      setTwoFactorSecret(null);
      setIsTwoFactorEnabled(false);
      toast.success('2FA has been reset. You can now set it up again.');
    } catch (error) {
      console.error('Error resetting 2FA:', error);
      toast.error('Failed to reset 2FA');
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
  const [previewAvatar, setPreviewAvatar] = useState<string | null>(null);

  useEffect(() => {
    if (isAvatarDialogOpen) {
      setPreviewAvatar(profileData?.display_image || null);
    }
  }, [isAvatarDialogOpen, profileData?.display_image]);

  const avatarStyles = [
    { id: 'fun-emoji', name: 'Fun Emojis' },
    { id: 'adventurer-neutral', name: 'Grocery Staff' },
    { id: 'lorelei-neutral', name: 'Store Clerks' },
    { id: 'miniavs', name: 'Mini Heroes' },
    { id: 'personas', name: 'Comic Personas' },
    { id: 'bottts', name: 'Sci-Fi Robots' },
    { id: 'bottts-neutral', name: 'Friendly Robots' },
    { id: 'adventurer', name: 'Action Heroes' },
    { id: 'micah', name: 'Modern Characters' },
    { id: 'avataaars', name: 'Classic Avatars' },
    { id: 'lorelei', name: 'Cute Characters' },
    { id: 'open-peeps', name: 'Hand Drawn' },
    { id: 'notionists', name: 'Notion Style' },
    { id: 'croodles', name: 'Sketch Art' },
    { id: 'big-smile', name: 'Big Smile' },
    { id: 'big-ears', name: 'Big Ears' },
    { id: 'pixel-art', name: 'Retro 8-bit' },
    { id: 'identicon', name: 'Tech Patterns' },
    { id: 'rings', name: 'Magic Rings' },
    { id: 'shapes', name: 'Geometric' },
    { id: 'thumbs', name: 'Abstract' },
    { id: 'icons', name: 'System Icons' },
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
      
      // Update global session so header re-renders
      if (currentAuthSession) {
        updateAuthSession({
          ...currentAuthSession,
          profile_image: imageUrl,
          profile_photo: imageUrl,
        });
      }

      if (session && updateNextAuthSession) {
        updateNextAuthSession({ profile_image: imageUrl, image: imageUrl });
      }
      
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
    <AdminLayout isLoading={isLoadingUser}>
      {!profileData && !isLoadingUser ? (
        <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
          <div className="p-4 rounded-full bg-red-500/10 text-red-600">
            <SettingsIcon className="h-12 w-12" />
          </div>
          <h2 className="text-2xl font-bold">Profile Not Found</h2>
          <p className="text-muted-foreground">We couldn't load your profile information. Please try logging in again.</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <>
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
                <TabsTrigger value="payment-methods" className="rounded-lg px-6">
                  Payment Methods
                </TabsTrigger>
              )}
          <TabsTrigger value="security" className="rounded-lg px-6">
            Security
          </TabsTrigger>
        </TabsList>

        <TabsContent
          value="profile"
          className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500"
        >
          <ProfileTab 
            profileData={profileData} 
            setIsAvatarDialogOpen={setIsAvatarDialogOpen} 
            handleSaveChanges={handleSaveChanges} 
          />
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <BillingUsageTab 
            subscriptionData={subscriptionData} 
            usageData={usageData} 
            isLoadingSubscription={isLoadingSubscription} 
            currencySymbol={currencySymbol}
          />
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
          <AppearanceTab 
            theme={theme} 
            setTheme={setTheme} 
            activeColor={activeColor} 
            setActiveColor={setActiveColor}
            setCustomColor={setCustomColor} 
            handleSaveChanges={handleSaveChanges} 
          />
        </TabsContent>


        <TabsContent value="payment-methods" className="space-y-6">
          <PaymentMethodsTab 
            profileData={profileData}
            paymentMethods={paymentMethods}
            selectedPayoutType={selectedPayoutType}
            setSelectedPayoutType={setSelectedPayoutType}
            isEditingPayout={isEditingPayout}
            setIsEditingPayout={setIsEditingPayout}
            isSavingPayout={isSavingPayout}
            payoutForm={payoutForm}
            setPayoutForm={setPayoutForm}
            handleSavePayoutMethod={handleSavePayoutMethod}
            maskAccountNumber={maskAccountNumber}
          />
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <SecurityTab 
            passwordState={passwordState}
            setPasswordState={setPasswordState}
            handleChangePassword={handleChangePassword}
            isUpdatingPassword={isUpdatingPassword}
            isTwoFactorEnabled={isTwoFactorEnabled}
            handleToggle2FA={handleToggle2FA}
            handleReset2FA={handleReset2FA}
          />
        </TabsContent>
      </Tabs>

      <Dialog open={isAvatarDialogOpen} onOpenChange={setIsAvatarDialogOpen}>
        <DialogContent className="max-w-3xl rounded-3xl overflow-hidden border-none shadow-2xl p-0">
          <div className="bg-gradient-to-br from-primary/20 via-background to-background p-8">
            <DialogHeader className="mb-8">
              <DialogTitle className="text-3xl font-black tracking-tight">Personalize Your Identity</DialogTitle>
              <p className="text-muted-foreground mt-2">Choose an avatar that represents you or upload your own.</p>
            </DialogHeader>

            <div className="space-y-8">
              <div className="flex flex-col items-center justify-center p-8 rounded-3xl bg-background/50 border-2 border-dashed border-primary/20 group hover:border-primary/50 transition-all">
                <Avatar className="h-32 w-32 border-4 border-background shadow-2xl mb-4 group-hover:scale-105 transition-transform">
                  <AvatarImage src={previewAvatar || profileData?.display_image} />
                  <AvatarFallback className="text-3xl font-black bg-primary/10 text-primary">
                    {profileData?.display_name?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex gap-3">
                  <Input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="avatar-upload"
                    onChange={handleFileUpload}
                  />
                  <Button variant="outline" className="rounded-xl border-primary text-primary hover:bg-primary/10 font-bold" asChild>
                    <label htmlFor="avatar-upload" className="cursor-pointer">Upload Photo</label>
                  </Button>
                  <Button variant="ghost" className="rounded-xl font-bold" onClick={() => setPreviewAvatar(`https://api.dicebear.com/7.x/${avatarStyle}/svg?seed=${Math.random()}`)}>
                    Randomize
                  </Button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <Label className="text-sm font-bold uppercase tracking-widest text-muted-foreground">Avatar Styles</Label>
                  <Button 
                    onClick={() => previewAvatar && handleUpdateAvatar(previewAvatar)} 
                    disabled={!previewAvatar || previewAvatar === profileData?.display_image || isUpdatingAvatar}
                    className="rounded-xl font-bold shadow-lg shadow-primary/20"
                  >
                    {isUpdatingAvatar ? 'Saving...' : 'Save Avatar'}
                  </Button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-3">
                  {avatarStyles.map((style) => (
                    <button
                      key={style.id}
                      onClick={() => {
                        setAvatarStyle(style.id);
                        const seed = encodeURIComponent(profileData?.display_name || user?.name || 'default');
                        setPreviewAvatar(`https://api.dicebear.com/7.x/${style.id}/svg?seed=${seed}`);
                      }}
                      className={cn(
                        "p-2 rounded-xl text-[10px] font-bold border-2 transition-all text-center",
                        avatarStyle === style.id ? "border-primary bg-primary/5 text-primary" : "border-muted-foreground/10 hover:border-primary/30"
                      )}
                    >
                      {style.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
        </>
      )}
    </AdminLayout>
  );
};

export default Settings;
