'use client';

import React, { useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Users,
    TrendingUp,
    CheckCircle2,
    Clock,
    Search,
    Download,
    Filter
} from 'lucide-react';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    Area
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import { Skeleton } from '@/components/ui/skeleton';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { apiPatch } from '@/lib/api';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Separator } from '@/components/ui/separator';

export default function ReferralsPage() {
    const queryClient = useQueryClient();
    const [selectedReferral, setSelectedReferral] = React.useState<any>(null);
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);

    const { data, isLoading, error } = useQuery({
        queryKey: ['referral-window'],
        queryFn: () => apiGet<{ Referral_window: any[] }>('/api/referral'),
    });

    const updateStatusMutation = useMutation({
        mutationFn: (variables: { id: string, status: string, phoneVerified: boolean }) =>
            apiPatch('/api/referral', variables),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['referral-window'] });
            toast.success('Referral status updated successfully');
            setIsDrawerOpen(false);
        },
        onError: (err: any) => {
            toast.error(err.message || 'Failed to update referral status');
        }
    });

    const handleApprove = () => {
        if (!selectedReferral) return;
        updateStatusMutation.mutate({
            id: selectedReferral.id,
            status: 'active',
            phoneVerified: true
        });
    };

    const referralData = data?.Referral_window ?? [];

    const stats = useMemo(() => {
        const total = referralData.length;
        const active = referralData.filter(r => r.status === 'active').length;
        const pending = referralData.filter(r => r.status === 'pending').length;
        const verified = referralData.filter(r => r.phoneVerified).length;

        return [
            { title: 'Total Referrals', value: total, icon: Users, color: 'text-blue-600', bg: 'bg-blue-100' },
            { title: 'Active', value: active, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
            { title: 'Pending', value: pending, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
            { title: 'Phone Verified', value: verified, icon: CheckCircle2, color: 'text-purple-600', bg: 'bg-purple-100' },
        ];
    }, [referralData]);

    const chartData = useMemo(() => {
        // Group by date
        const groups: Record<string, number> = {};
        referralData.forEach(r => {
            const date = format(new Date(r.created_at), 'MMM dd');
            groups[date] = (groups[date] || 0) + 1;
        });

        return Object.entries(groups).map(([name, count]) => ({ name, count })).slice(-7);
    }, [referralData]);

    if (error) {
        return (
            <AdminLayout>
                <div className="p-6 text-red-500">Error loading referral data: {(error as any).message}</div>
            </AdminLayout>
        );
    }

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

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {isLoading ? (
                            Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
                        ) : (
                            stats.map((stat, i) => (
                                <Card key={i}>
                                    <CardContent className="pt-6">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                                                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                                            </div>
                                            <div className={`p-3 rounded-full ${stat.bg}`}>
                                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Referral Growth (Last 7 Days)</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="h-[300px] w-full">
                                    {isLoading ? (
                                        <Skeleton className="h-full w-full" />
                                    ) : (
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#2563eb" stopOpacity={0.1} />
                                                        <stop offset="95%" stopColor="#2563eb" stopOpacity={0} />
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                                <XAxis
                                                    dataKey="name"
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#888' }}
                                                />
                                                <YAxis
                                                    axisLine={false}
                                                    tickLine={false}
                                                    tick={{ fontSize: 12, fill: '#888' }}
                                                />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                                />
                                                <Area
                                                    type="monotone"
                                                    dataKey="count"
                                                    stroke="#2563eb"
                                                    strokeWidth={2}
                                                    fillOpacity={1}
                                                    fill="url(#colorCount)"
                                                />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Quick Stats/Info */}
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-base font-medium">Verification Status</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Phone Verified</span>
                                        <Badge variant="secondary" className="bg-purple-50 text-purple-700 hover:bg-purple-50">
                                            {referralData.filter(r => r.phoneVerified).length}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Email Provided</span>
                                        <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                                            {referralData.filter(r => r.email).length}
                                        </Badge>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-sm text-muted-foreground">Device Fingerprinted</span>
                                        <Badge variant="secondary" className="bg-gray-50 text-gray-700 hover:bg-gray-50">
                                            {referralData.filter(r => r.deviceFingerprint).length}
                                        </Badge>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Table */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-base font-medium">Recent Referral Logs</CardTitle>
                            <div className="relative w-64">
                                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search referrals..."
                                    className="pl-9 h-9"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            {isLoading ? (
                                <div className="space-y-2">
                                    {Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>User / Name</TableHead>
                                            <TableHead>Referral Code</TableHead>
                                            <TableHead>Phone / Verified</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead>Created At</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {referralData.map((record) => (
                                            <TableRow key={record.id}>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{record.name || record.User?.name || 'N/A'}</span>
                                                        <span className="text-xs text-muted-foreground">{record.email || record.User?.email || 'N/A'}</span>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <code className="px-1.5 py-0.5 rounded bg-muted text-xs font-mono">
                                                        {record.referralCode}
                                                    </code>
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col">
                                                        <span className="text-sm">{record.phone || record.User?.phone || 'N/A'}</span>
                                                        {record.phoneVerified ? (
                                                            <span className="text-[10px] text-green-600 font-medium">Verified</span>
                                                        ) : (
                                                            <span className="text-[10px] text-yellow-600 font-medium">Unverified</span>
                                                        )}
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className={
                                                            record.status === 'active'
                                                                ? 'bg-green-50 text-green-700 border-green-200'
                                                                : 'bg-gray-50 text-gray-700'
                                                        }
                                                    >
                                                        {record.status}
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="text-sm text-muted-foreground">
                                                    {format(new Date(record.created_at), 'MMM dd, yyyy HH:mm')}
                                                </TableCell>
                                                <TableCell className="text-right">
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => {
                                                            setSelectedReferral(record);
                                                            setIsDrawerOpen(true);
                                                        }}
                                                    >
                                                        Review
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>

            <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                <SheetContent className="sm:max-w-md">
                    <SheetHeader>
                        <SheetTitle>Review Referral</SheetTitle>
                        <SheetDescription>
                            Review user information and manually approve the referral.
                        </SheetDescription>
                    </SheetHeader>

                    {selectedReferral && (
                        <div className="mt-6 space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    {selectedReferral.User?.profile_picture && (
                                        <img
                                            src={selectedReferral.User.profile_picture}
                                            alt="Profile"
                                            className="w-12 h-12 rounded-full object-cover border"
                                        />
                                    )}
                                    <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">User Information</h4>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Full Name</p>
                                        <p className="text-sm font-medium">{selectedReferral.name || selectedReferral.User?.name || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email Address</p>
                                        <p className="text-sm font-medium">{selectedReferral.email || selectedReferral.User?.email || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Phone Number</p>
                                        <p className="text-sm font-medium">{selectedReferral.phone || selectedReferral.User?.phone || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Gender</p>
                                        <p className="text-sm font-medium uppercase">{selectedReferral.User?.gender || 'N/A'}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Account Status</p>
                                        <Badge variant="outline" className={selectedReferral.User?.is_active ? 'text-green-600' : 'text-red-600'}>
                                            {selectedReferral.User?.is_active ? 'Active' : 'Inactive'}
                                        </Badge>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Role / Guest</p>
                                        <p className="text-sm font-medium">
                                            {selectedReferral.User?.is_guest ? 'Guest User' : 'Registered User'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Metadata</h4>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Device Fingerprint</p>
                                        <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                                            {selectedReferral.deviceFingerprint || 'No fingerprint available'}
                                        </p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground">Referral Code</p>
                                            <Badge variant="outline" className="mt-1">{selectedReferral.referralCode}</Badge>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted-foreground">Signup Date</p>
                                            <p className="text-sm mt-1">{format(new Date(selectedReferral.created_at), 'MMM dd, yyyy HH:mm')}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <Separator />

                            <div className="space-y-4">
                                <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Status</h4>
                                <div className="flex items-center gap-4">
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Status</p>
                                        <Badge
                                            variant="outline"
                                            className={selectedReferral.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700'}
                                        >
                                            {selectedReferral.status}
                                        </Badge>
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs text-muted-foreground mb-1">Verification</p>
                                        {selectedReferral.phoneVerified ? (
                                            <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                                <CheckCircle2 className="w-3 h-3" /> Verified
                                            </span>
                                        ) : (
                                            <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                                                <Clock className="w-3 h-3" /> Unverified
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex gap-3">
                                <Button
                                    className="flex-1"
                                    onClick={handleApprove}
                                    disabled={updateStatusMutation.isPending || selectedReferral.status === 'active'}
                                >
                                    {updateStatusMutation.isPending ? 'Processing...' : 'Approve Referral'}
                                </Button>
                                <Button
                                    variant="outline"
                                    className="flex-1"
                                    onClick={() => setIsDrawerOpen(false)}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    )}
                </SheetContent>
            </Sheet>
        </ProtectedRoute>
    );
}
