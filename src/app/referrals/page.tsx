'use client';

import React, { useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import {
    Download,
    Filter,
    Users,
    TrendingUp,
    Clock,
    CheckCircle2,
    Wallet,
    ShoppingBag,
} from 'lucide-react';
import { format } from 'date-fns';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api';
import { toast } from 'sonner';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

// Sub-components
import { StatsCards } from './_components/StatsCards';
import { ReferralChart } from './_components/ReferralChart';
import { VerificationStatus } from './_components/VerificationStatus';
import { ReferralTable } from './_components/ReferralTable';
import { ReviewReferralDrawer } from './_components/ReviewReferralDrawer';

// ─── Helpers ────────────────────────────────────────────────────────────────

function fmtRWF(value: number) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'RWF',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
    }).format(value);
}

// ─── Page ────────────────────────────────────────────────────────────────────

export default function ReferralsPage() {
    const queryClient = useQueryClient();
    const [selectedReferral, setSelectedReferral] = useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    // Referral data
    const { data, isLoading, error } = useQuery({
        queryKey: ['referral-window'],
        queryFn: () => apiGet<{ Referral_window: any[] }>('/api/referral'),
    });

    // Wallet totals
    const { data: walletData, isLoading: walletLoading } = useQuery({
        queryKey: ['wallet-totals'],
        queryFn: () =>
            apiGet<{ walletBalance: number; businessBalance: number; total: number }>(
                '/api/queries/wallet-totals'
            ),
        staleTime: 2 * 60 * 1000,
    });

    // Pending order totals
    const { data: pendingData, isLoading: pendingLoading } = useQuery({
        queryKey: ['pending-order-totals'],
        queryFn: () =>
            apiGet<{ total: number; breakdown: Record<string, number> }>(
                '/api/queries/pending-order-totals'
            ),
        staleTime: 2 * 60 * 1000,
    });

    const updateStatusMutation = useMutation({
        mutationFn: (variables: { id: string; status: string; phoneVerified: boolean }) =>
            apiPatch('/api/referral', variables),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referral-window'] });
            toast.success('Referral status updated successfully');
            setIsDrawerOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update referral status');
        },
    });

    const handleApprove = () => {
        if (!selectedReferral) return;
        updateStatusMutation.mutate({
            id: selectedReferral.id,
            status: 'active',
            phoneVerified: true,
        });
    };

    const referralData = data?.Referral_window ?? [];

    const totalWalletBalance = walletData?.total ?? 0;
    const pendingOrdersTotal = pendingData?.total ?? 0;

    const stats = useMemo(() => {
        const total = referralData.length;
        const active = referralData.filter(r => r.status === 'active').length;
        const pending = referralData.filter(r => r.status === 'pending').length;
        const verified = referralData.filter(r => r.phoneVerified).length;

        return [
            {
                title: 'Total Referrals',
                value: total,
                icon: Users,
                color: 'text-blue-600',
                bg: 'bg-blue-100',
            },
            {
                title: 'Active',
                value: active,
                icon: TrendingUp,
                color: 'text-green-600',
                bg: 'bg-green-100',
            },
            {
                title: 'Pending',
                value: pending,
                icon: Clock,
                color: 'text-yellow-600',
                bg: 'bg-yellow-100',
            },
            {
                title: 'Phone Verified',
                value: verified,
                icon: CheckCircle2,
                color: 'text-purple-600',
                bg: 'bg-purple-100',
            },
            // ── New stats ──────────────────────────────────────────────────
            {
                title: 'Total Wallet Balances',
                value: totalWalletBalance,
                formattedValue: walletLoading ? '…' : fmtRWF(totalWalletBalance),
                subtitle: `Personal: ${fmtRWF(walletData?.walletBalance ?? 0)}  ·  Business: ${fmtRWF(walletData?.businessBalance ?? 0)}`,
                icon: Wallet,
                color: 'text-indigo-600',
                bg: 'bg-indigo-100',
            },
            {
                title: 'Pending Orders Value',
                value: pendingOrdersTotal,
                formattedValue: pendingLoading ? '…' : fmtRWF(pendingOrdersTotal),
                subtitle: 'Regular + Reel + Restaurant + Business (incl. fees)',
                icon: ShoppingBag,
                color: 'text-orange-600',
                bg: 'bg-orange-100',
            },
        ];
    }, [referralData, totalWalletBalance, pendingOrdersTotal, walletLoading, pendingLoading, walletData]);

    const chartData = useMemo(() => {
        const groups: Record<string, number> = {};
        referralData.forEach(r => {
            const date = format(new Date(r.created_at), 'MMM dd');
            groups[date] = (groups[date] || 0) + 1;
        });
        return Object.entries(groups)
            .map(([name, count]) => ({ name, count }))
            .slice(-7);
    }, [referralData]);

    if (error) {
        return (
            <AdminLayout>
                <div className="p-6 text-red-500">
                    Error loading referral data: {(error as any).message}
                </div>
            </AdminLayout>
        );
    }

    const pageLoading = isLoading || walletLoading || pendingLoading;

    return (
        <ProtectedRoute requiredPrivilege="referrals" requiredAction="access">
            <AdminLayout>
                <div className="space-y-6">
                    <PageHeader
                        title="Referrals Tracking"
                        description="Monitor referral window data, user signups, and conversion metrics."
                        actions={
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm">
                                    <Download className="w-4 h-4 mr-2" /> Export
                                </Button>
                                <Button size="sm">
                                    <Filter className="w-4 h-4 mr-2" /> Filter
                                </Button>
                            </div>
                        }
                    />

                    {/* Stats Cards — now 6 items, wraps to 2 rows on lg screens */}
                    <StatsCards stats={stats} isLoading={pageLoading} skeletonCount={6} />

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <ReferralChart data={chartData} isLoading={isLoading} />

                        {/* Quick Stats/Info */}
                        <VerificationStatus
                            phoneVerifiedCount={referralData.filter(r => r.phoneVerified).length}
                            emailProvidedCount={referralData.filter(r => r.email).length}
                            deviceFingerprintedCount={referralData.filter(r => r.deviceFingerprint).length}
                        />
                    </div>

                    {/* Table */}
                    <ReferralTable
                        data={referralData}
                        isLoading={isLoading}
                        onReview={record => {
                            setSelectedReferral(record);
                            setIsDrawerOpen(true);
                        }}
                    />
                </div>
            </AdminLayout>

            <ReviewReferralDrawer
                isOpen={isDrawerOpen}
                onOpenChange={setIsDrawerOpen}
                referral={selectedReferral}
                onApprove={handleApprove}
                isProcessing={updateStatusMutation.isPending}
            />
        </ProtectedRoute>
    );
}
