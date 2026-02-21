'use client';

import React, { useMemo } from 'react';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  usePersonalWallets,
  useAllWalletsWithTransactions,
  useBusinessWallets,
  useSystemConfig,
} from '@/hooks/useHasuraApi';
import { Loader2, Wallet, User as UserIcon, Building2, CreditCard, Wifi } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UserWalletData {
  userId: string;
  name: string;
  email: string;
  profilePicture?: string;
  personalBalance: number;
  shopperAvailable: number;
  shopperReserved: number;
  hasPersonalWallet: boolean;
  hasShopperWallet: boolean;
}

export default function ShopperWalletsPage() {
  const { data: systemConfig } = useSystemConfig();
  const { data: personalData, isLoading: loadingPersonal } = usePersonalWallets();
  const { data: shopperData, isLoading: loadingShopper } = useAllWalletsWithTransactions();
  const { data: businessData, isLoading: loadingBusiness } = useBusinessWallets();

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num || 0);
  };

  const { usersData, totalPersonal, totalShopperAvailable, totalShopperReserved } = useMemo(() => {
    const map = new Map<string, UserWalletData>();
    let pTotal = 0;
    let sAvail = 0;
    let sRes = 0;

    // Process Personal Wallets
    const personalWallets = personalData?.personalWallet || [];
    personalWallets.forEach((pw: any) => {
      if (!pw.Users) return;
      const uid = pw.Users.id;
      if (!map.has(uid)) {
        map.set(uid, {
          userId: uid,
          name: pw.Users.name || 'Unknown User',
          email: pw.Users.email || '',
          profilePicture: pw.Users.profile_picture,
          personalBalance: 0,
          shopperAvailable: 0,
          shopperReserved: 0,
          hasPersonalWallet: false,
          hasShopperWallet: false,
        });
      }
      const data = map.get(uid)!;
      const bal = parseFloat(pw.balance || '0');
      data.personalBalance += bal;
      data.hasPersonalWallet = true;
      pTotal += bal;
    });

    // Process Shopper Wallets
    // The shopper's user info is slightly buried in the new query:
    // User -> shopper -> full_name, etc. OR we might have to just match by shopper_id if we know it equals user_id
    const shopperWallets = shopperData?.Wallets || [];
    shopperWallets.forEach((sw: any) => {
      // Safely extract name. The new query returns User { shopper: { full_name, user_id, profile_photo } }
      const shopperInfo = sw.User?.shopper;
      const uid = sw.shopper_id || shopperInfo?.user_id;
      if (!uid) return;

      if (!map.has(uid)) {
        map.set(uid, {
          userId: uid,
          name: shopperInfo?.full_name || 'Unknown Shopper',
          email: '', // We don't get email directly in the shopper sub-query without another relation
          profilePicture: shopperInfo?.profile_photo,
          personalBalance: 0,
          shopperAvailable: 0,
          shopperReserved: 0,
          hasPersonalWallet: false,
          hasShopperWallet: false,
        });
      }
      const data = map.get(uid)!;
      const avail = parseFloat(sw.available_balance || '0');
      const res = parseFloat(sw.reserved_balance || '0');

      data.shopperAvailable += avail;
      data.shopperReserved += res;
      data.hasShopperWallet = true;

      sAvail += avail;
      sRes += res;
    });

    return {
      usersData: Array.from(map.values()),
      totalPersonal: pTotal,
      totalShopperAvailable: sAvail,
      totalShopperReserved: sRes,
    };
  }, [personalData, shopperData]);

  const { businesses, totalBusiness } = useMemo(() => {
    let bTotal = 0;
    const bWallets = businessData?.business_wallet || [];
    const bs = bWallets.map((bw: any) => {
      const amt = parseFloat(bw.amount || '0');
      bTotal += amt;
      return {
        id: bw.id,
        businessId: bw.business_id,
        name: bw.business_account?.business_name || 'Unknown Business',
        email: bw.business_account?.business_email,
        phone: bw.business_account?.business_phone,
        location: bw.business_account?.business_location,
        amount: amt,
      };
    });
    return { businesses: bs, totalBusiness: bTotal };
  }, [businessData]);

  const totalWalletsCount = useMemo(() => {
    const personalCount = usersData.filter(u => u.hasPersonalWallet).length;
    const shopperCount = usersData.filter(u => u.hasShopperWallet).length;
    const businessCount = businesses.length;
    return personalCount + shopperCount + businessCount;
  }, [usersData, businesses]);

  const isLoading = loadingPersonal || loadingShopper || loadingBusiness;

  if (isLoading) {
    return (
      <ProtectedRoute requiredPrivilege="wallet" requiredAction="view_wallets">
        <AdminLayout>
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
          </div>
        </AdminLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute requiredPrivilege="wallet" requiredAction="view_wallets">
      <AdminLayout>
        <PageHeader
          title="Wallets"
          description="View and manage all wallets across the system."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-slate-500/10 to-slate-600/5 border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-slate-800">
                <CreditCard className="h-4 w-4" /> Total Connected Wallets
              </div>
              <div className="text-3xl font-bold mt-2 text-slate-900">
                {totalWalletsCount}
              </div>
              <p className="text-xs text-slate-700/80 mt-1">
                Across all categories
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-green-800">
                <UserIcon className="h-4 w-4" /> Total Personal Balance
              </div>
              <div className="text-3xl font-bold mt-2 text-green-900">
                {formatCurrency(totalPersonal)}
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-blue-800">
                <Wallet className="h-4 w-4" /> Total Shopper Balance
              </div>
              <div className="text-3xl font-bold mt-2 text-blue-900">
                {formatCurrency(totalShopperAvailable)}
              </div>
              <p className="text-xs text-blue-700/80 mt-1">
                Reserved: {formatCurrency(totalShopperReserved)}
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-200">
            <CardContent className="pt-6">
              <div className="flex items-center gap-2 text-sm font-medium text-purple-800">
                <Building2 className="h-4 w-4" /> Total Business Balance
              </div>
              <div className="text-3xl font-bold mt-2 text-purple-900">
                {formatCurrency(totalBusiness)}
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="personal" className="text-base px-6 py-3">Personal Wallets</TabsTrigger>
            <TabsTrigger value="shopper" className="text-base px-6 py-3">Wallets</TabsTrigger>
            <TabsTrigger value="business" className="text-base px-6 py-3">Businesses</TabsTrigger>
          </TabsList>

          <TabsContent value="personal" className="space-y-6">
            {usersData.filter(u => u.hasPersonalWallet).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No personal wallets found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {usersData.filter(u => u.hasPersonalWallet).map((user) => (
                  <div key={`personal-${user.userId}`} className="relative group w-full aspect-[1.58] rounded-xl text-white shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden bg-gradient-to-br from-teal-500 via-green-600 to-emerald-800">
                    {/* Subtle background pattern */}
                    <div className="absolute inset-0 opacity-20 mix-blend-overlay bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white via-transparent to-transparent pointer-events-none"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-30">
                      <Wifi className="w-6 h-6 rotate-90" />
                    </div>

                    <div className="flex flex-col h-full p-6 relative z-10">
                      <div className="flex justify-between items-start w-full mb-auto text-green-100">
                        <span className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 opacity-90">
                          <UserIcon className="w-3.5 h-3.5" /> Personal Wallet
                        </span>
                      </div>

                      <div className="mb-6">
                        <div className="text-[10px] text-green-100/70 uppercase tracking-widest mb-1">Available Balance</div>
                        <div className="text-3xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(user.personalBalance)}</div>
                      </div>

                      <div className="flex justify-between items-end mt-auto">
                        <div className="flex items-center gap-2">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full border border-white/40 shadow-sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shadow-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="font-medium text-sm tracking-wide drop-shadow-sm truncate max-w-[120px]" title={user.name}>{user.name}</div>
                        </div>
                        <div className="flex items-center">
                          {/* Fake chip */}
                          <div className="w-8 h-6 rounded bg-yellow-400/80 border border-yellow-300 overflow-hidden relative shadow-inner">
                            <div className="absolute top-1/2 left-0 w-full h-px bg-yellow-500/50"></div>
                            <div className="absolute left-1/2 top-0 w-px h-full bg-yellow-500/50"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-l border-b border-yellow-500/50 rounded-bl"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="shopper" className="space-y-6">
            {usersData.filter(u => u.hasShopperWallet).length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No shopper wallets found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {usersData.filter(u => u.hasShopperWallet).map((user) => (
                  <div key={`shopper-${user.userId}`} className="relative group w-full aspect-[1.58] rounded-xl text-white shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden bg-gradient-to-br from-blue-500 via-indigo-600 to-slate-900">
                    {/* Subtle background pattern */}
                    <div className="absolute -right-20 -top-20 w-64 h-64 bg-white opacity-5 rounded-full blur-3xl pointer-events-none"></div>
                    <div className="absolute top-0 right-0 p-4 opacity-30">
                      <Wifi className="w-6 h-6 rotate-90" />
                    </div>

                    <div className="flex flex-col h-full p-6 relative z-10">
                      <div className="flex justify-between items-start w-full mb-auto text-blue-100">
                        <span className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 opacity-90">
                          <Wallet className="w-3.5 h-3.5" /> Wallet
                        </span>
                      </div>

                      <div className="mb-1">
                        <div className="text-[10px] text-blue-100/70 uppercase tracking-widest mb-1">Available Balance</div>
                        <div className="text-3xl font-bold tracking-tight drop-shadow-sm flex items-end gap-2">
                          {formatCurrency(user.shopperAvailable)}
                        </div>
                      </div>

                      {user.shopperReserved > 0 ? (
                        <div className="text-xs text-amber-300 font-medium mb-4 flex items-center gap-1 drop-shadow-sm">
                          <span className="opacity-80">Reserved:</span> {formatCurrency(user.shopperReserved)}
                        </div>
                      ) : (
                        <div className="h-4 mb-4"></div>
                      )}

                      <div className="flex justify-between items-end mt-auto">
                        <div className="flex items-center gap-2">
                          {user.profilePicture ? (
                            <img src={user.profilePicture} alt={user.name} className="w-8 h-8 rounded-full border border-white/40 shadow-sm" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm shadow-sm">
                              {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                            </div>
                          )}
                          <div className="font-medium text-sm tracking-wide drop-shadow-sm truncate max-w-[120px]" title={user.name}>{user.name}</div>
                        </div>
                        <div className="flex items-center">
                          {/* Fake chip */}
                          <div className="w-8 h-6 rounded bg-yellow-400/80 border border-yellow-300 overflow-hidden relative shadow-inner">
                            <div className="absolute top-1/2 left-0 w-full h-px bg-yellow-500/50"></div>
                            <div className="absolute left-1/2 top-0 w-px h-full bg-yellow-500/50"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-l border-b border-yellow-500/50 rounded-bl"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="business" className="space-y-6">
            {businesses.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
                No business wallets found.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {businesses.map((bus) => (
                  <div key={bus.id} className="relative group w-full aspect-[1.58] rounded-xl text-white shadow-lg transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl overflow-hidden bg-gradient-to-br from-violet-600 via-fuchsia-700 to-purple-900 border border-white/10">
                    {/* Subtle geometric pattern */}
                    <svg className="absolute inset-0 w-full h-full opacity-10 pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                      <defs>
                        <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                          <path fill="currentColor" d="M24.8 22.4v-8.8l-7.6-4.4-7.6 4.4v8.8l7.6 4.4z"></path>
                        </pattern>
                      </defs>
                      <rect width="100%" height="100%" fill="url(#hexagons)"></rect>
                    </svg>

                    <div className="absolute top-0 right-0 p-4 opacity-30">
                      <Wifi className="w-6 h-6 rotate-90" />
                    </div>

                    <div className="flex flex-col h-full p-6 relative z-10">
                      <div className="flex justify-between items-start w-full mb-auto text-purple-100">
                        <span className="text-xs uppercase tracking-widest font-semibold flex items-center gap-1.5 opacity-90">
                          <Building2 className="w-3.5 h-3.5" /> Corporate Account
                        </span>
                      </div>

                      <div className="mb-6">
                        <div className="text-[10px] text-purple-200/70 uppercase tracking-widest mb-1">Available Balance</div>
                        <div className="text-3xl font-bold tracking-tight drop-shadow-sm">{formatCurrency(bus.amount)}</div>
                      </div>

                      <div className="flex justify-between items-end mt-auto">
                        <div className="flex flex-col">
                          <div className="font-medium text-sm tracking-wider drop-shadow-sm truncate max-w-[160px]" title={bus.name}>{bus.name}</div>
                          {bus.location && <div className="text-[10px] text-purple-200/80 truncate max-w-[140px]" title={bus.location}>{bus.location}</div>}
                        </div>
                        <div className="flex items-center">
                          {/* Fake chip */}
                          <div className="w-8 h-6 rounded bg-yellow-400/80 border border-yellow-300 overflow-hidden relative shadow-inner">
                            <div className="absolute top-1/2 left-0 w-full h-px bg-yellow-500/50"></div>
                            <div className="absolute left-1/2 top-0 w-px h-full bg-yellow-500/50"></div>
                            <div className="absolute top-0 right-0 w-2 h-2 border-l border-b border-yellow-500/50 rounded-bl"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </AdminLayout>
    </ProtectedRoute>
  );
}
