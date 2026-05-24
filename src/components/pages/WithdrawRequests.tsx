'use client';

import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import WithdrawRequestApprovalDialog, {
  type RequestItem,
  type WithdrawRequestData,
  type PayoutData,
} from '@/components/wallet/WithdrawRequestApprovalDialog';

// ─── Types ─────────────────────────────────────────────────────────────────

interface WithdrawRequest {
  Wallets: any;
  id: string;
  amount: string;
  status: string;
  created_at: string;
  update_at: string;
  phoneNumber: string;
  shopper_id?: string;
  shopperWallet_id?: string;
  business_id?: string;
  businessWallet_id?: string;
  shoppers?: {
    full_name: string;
    phone_number: string;
    profile_photo?: string;
    User?: {
      Wallets?: {
        id: string;
        available_balance: string;
        reserved_balance: string;
        last_updated: string;
      }[];
    };
  };
  business_wallets?: {
    amount: string;
    business_id: string;
    id: string;
    created_at: string;
    query_id: string;
    updated_at: string;
  };
  business_accounts?: {
    account_type: string;
    business_email: string;
    business_location: string;
    business_name: string;
    business_phone: string;
    face_image: string;
    id: string;
    status: string;
  };
}

interface Payout {
  shopper: any;
  User: any;
  id: string;
  amount: string;
  status: string;
  created_at: string;
  updated_on: string;
  user_id: string;
  wallet_id: string;
  Wallets?: {
    id: string;
    available_balance: string;
    reserved_balance: string;
    last_updated: string;
    shopper_id: string;
    Wallet_Transactions?: {
      id: string;
      amount: string;
      type: string;
      status: string;
      description?: string;
      created_at: string;
      wallet_id: string;
      related_reel_orderId?: string;
      related_order_id?: string;
      relate_business_order_id?: string;
    }[];
    User?: {
      email: string;
      gender: string;
      id: string;
      is_guest: boolean;
      is_active: boolean;
      name: string;
      phone: string;
      profile_picture?: string;
    };
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────

function fmtAmt(value: string | number) {
  const num = parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-RW', {
    style: 'currency',
    currency: 'RWF',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── Component ─────────────────────────────────────────────────────────────

const WithdrawRequests = () => {
  const queryClient = useQueryClient();
  const [selectedItem, setSelectedItem] = useState<RequestItem | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  // Read current user session from sessionStorage (set during login)
  const rawSession = typeof window !== 'undefined' ? sessionStorage.getItem('userSession') : null;
  const session: { TwoAuth_enabled?: boolean; email?: string } | null = rawSession
    ? (() => {
        try {
          return JSON.parse(rawSession);
        } catch {
          return null;
        }
      })()
    : null;

  // ── Data fetching ─────────────────────────────────────────────────────────
  const withdrawQuery = useQuery({
    queryKey: ['pendingWithdrawRequests'],
    queryFn: () =>
      apiGet<{ requests: WithdrawRequest[] }>('/api/queries/pending-withdraw-requests').then(
        r => r.requests
      ),
  });

  const payoutsQuery = useQuery({
    queryKey: ['pendingPayouts'],
    queryFn: () =>
      apiGet<{ payouts: Payout[] }>('/api/queries/pending-payouts').then(r => r.payouts),
  });

  // ── Handlers ─────────────────────────────────────────────────────────────
  const handleViewWithdraw = (req: WithdrawRequest) => {
    const item: WithdrawRequestData = { kind: 'withdraw', ...req };
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleViewPayout = (payout: Payout) => {
    const item: PayoutData = { kind: 'payout', ...payout };
    setSelectedItem(item);
    setDialogOpen(true);
  };

  const handleSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['pendingWithdrawRequests'] });
    queryClient.invalidateQueries({ queryKey: ['pendingPayouts'] });
  };

  // ── Shared loading/error renders ──────────────────────────────────────────
  const LoadingCell = ({ colSpan }: { colSpan: number }) => (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8">
        <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
      </TableCell>
    </TableRow>
  );

  const EmptyCell = ({ colSpan, label }: { colSpan: number; label: string }) => (
    <TableRow>
      <TableCell colSpan={colSpan} className="text-center py-8 text-muted-foreground">
        {label}
      </TableCell>
    </TableRow>
  );

  const pendingWithdrawCount = withdrawQuery.data?.length ?? 0;
  const pendingPayoutCount = payoutsQuery.data?.length ?? 0;

  return (
    <AdminLayout>
      <PageHeader
        title="Payouts & Withdraw Requests"
        description="Review, approve, or reject pending withdrawal requests and payouts."
      />

      <Tabs defaultValue="withdrawals">
        <TabsList className="mb-4">
          <TabsTrigger value="withdrawals">
            Withdraw Requests
            {pendingWithdrawCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingWithdrawCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="payouts">
            Payouts
            {pendingPayoutCount > 0 && (
              <Badge variant="secondary" className="ml-2 text-xs">
                {pendingPayoutCount}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* ── WITHDRAW REQUESTS TAB ──────────────────────────────────────── */}
        <TabsContent value="withdrawals">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Account Type</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawQuery.isLoading ? (
                  <LoadingCell colSpan={8} />
                ) : withdrawQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-red-500">
                      Failed to load withdraw requests.
                    </TableCell>
                  </TableRow>
                ) : !withdrawQuery.data?.length ? (
                  <EmptyCell colSpan={8} label="No pending withdraw requests." />
                ) : (
                  withdrawQuery.data.map(req => {
                    const isBusiness =
                      !!req.business_id &&
                      req.business_id !== '00000000-0000-0000-0000-000000000000';
                    let accountType = isBusiness ? 'Business' : 'Plasa';

                    const businessAccount = req.business_accounts;
                    const businessWallet = req.business_wallets;
                    const shopper = req.shoppers;
                    const wallet = req.Wallets;

                    if (isBusiness && businessAccount?.account_type === 'personal') {
                      accountType = 'Personal Business';
                    }

                    const name = isBusiness
                      ? businessAccount?.business_name || 'Business Account'
                      : shopper?.full_name || 'Unknown Shopper';

                    const phone =
                      req.phoneNumber ||
                      (isBusiness ? businessAccount?.business_phone : shopper?.phone_number) ||
                      'N/A';

                    const balance = isBusiness
                      ? businessWallet?.amount || '0'
                      : wallet?.available_balance || '0';

                    return (
                      <TableRow key={req.id}>
                        <TableCell>
                          {format(new Date(req.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize">
                            {accountType}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{name}</TableCell>
                        <TableCell>{phone}</TableCell>
                        <TableCell className="font-semibold">{fmtAmt(req.amount)}</TableCell>
                        <TableCell>{balance != null ? fmtAmt(balance) : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800 border-yellow-200"
                          >
                            {req.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewWithdraw(req)}
                            className="flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Request
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>

        {/* ── PAYOUTS TAB ────────────────────────────────────────────────── */}
        <TabsContent value="payouts">
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payoutsQuery.isLoading ? (
                  <LoadingCell colSpan={7} />
                ) : payoutsQuery.isError ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-red-500">
                      Failed to load payouts.
                    </TableCell>
                  </TableRow>
                ) : !payoutsQuery.data?.length ? (
                  <EmptyCell colSpan={7} label="No pending payouts." />
                ) : (
                  payoutsQuery.data.map(payout => {
                    const shopper = payout.shopper;
                    const user = payout.User;
                    const wallet = payout.Wallets;

                    const displayName = shopper?.full_name || user?.name || 'Unknown';
                    const displayPhone = shopper?.phone_number || user?.phone || 'N/A';
                    const displayImage = shopper?.profile_photo || user?.profile_picture;

                    return (
                      <TableRow key={payout.id}>
                        <TableCell>
                          {format(new Date(payout.created_at), 'MMM d, yyyy HH:mm')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-muted overflow-hidden flex-shrink-0 border">
                              {displayImage ? (
                                <img
                                  src={displayImage}
                                  alt=""
                                  className="h-full w-full object-cover"
                                />
                              ) : (
                                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground uppercase">
                                  {displayName.charAt(0)}
                                </div>
                              )}
                            </div>
                            <span className="font-medium">{displayName}</span>
                          </div>
                        </TableCell>
                        <TableCell>{displayPhone}</TableCell>
                        <TableCell className="font-semibold">{fmtAmt(payout.amount)}</TableCell>
                        <TableCell>{wallet ? fmtAmt(wallet.available_balance) : 'N/A'}</TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="bg-yellow-100 text-yellow-800 border-yellow-200"
                          >
                            {payout.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleViewPayout(payout)}
                            className="flex items-center gap-1.5"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Payout
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </Card>
        </TabsContent>
      </Tabs>

      <WithdrawRequestApprovalDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        item={selectedItem}
        session={session}
        onSuccess={handleSuccess}
      />
    </AdminLayout>
  );
};

export default WithdrawRequests;
