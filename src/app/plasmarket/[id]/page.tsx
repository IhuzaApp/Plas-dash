'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePrivilege } from '@/hooks/usePrivilege';
import {
    Store, User, FileText, Briefcase, ShoppingBag,
    Wallet, PieChart as PieChartIcon, Activity,
    MapPin, Phone, Mail, Clock, ArrowLeft, Loader2, Trash2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiGet, apiPost } from '@/lib/api';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';

export default function BusinessProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = (params?.id as string) || '';

    const queryClient = useQueryClient();
    const { hasAction } = usePrivilege();
    const canManageStatus = hasAction('plasmarket', 'manage_status');
    const canDeleteBusiness = hasAction('plasmarket', 'delete_business');

    const { data: configData } = useSystemConfig();
    const currency = configData?.currency || '$';

    const { data, isLoading, error } = useQuery({
        queryKey: ['plasmarket-business', id],
        queryFn: async () => {
            const response = await apiGet(`/api/admin/plasmarket/${id}`);
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch business');
            }
            return response.business;
        },
        enabled: !!id
    });

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'in_review': return <Badge variant="outline" className="text-yellow-600 border-yellow-600 bg-yellow-50">In Review</Badge>;
            case 'processed':
            case 'accepted':
            case 'active': return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50 capitalize">{status}</Badge>;
            case 'reject': return <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">Rejected</Badge>;
            case 'on_hold': return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">On Hold</Badge>;
            default: return <Badge variant="secondary" className="capitalize">{status}</Badge>;
        }
    };

    const statusMutation = useMutation({
        mutationFn: async (newStatus: string) => {
            return await apiPost('/api/admin/plasmarket/status', {
                businessId: id,
                status: newStatus
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['plasmarket-business', id] });
            queryClient.invalidateQueries({ queryKey: ['adminPlasMarketBusinesses'] });
        },
        onError: (err: any) => {
            console.error('Failed to update status', err);
            alert('Failed to update status: ' + err.message);
        }
    });

    const toggleStatus = () => {
        if (!data) return;
        const newStatus = data.status === 'on_hold' ? 'active' : 'on_hold';
        if (confirm(`Are you sure you want to change the status to ${newStatus}?`)) {
            statusMutation.mutate(newStatus);
        }
    };

    const deleteMutation = useMutation({
        mutationFn: async () => {
            return await apiPost('/api/admin/plasmarket/delete', {
                businessId: id
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['adminPlasMarketBusinesses'] });
            router.push('/plasmarket');
        },
        onError: (err: any) => {
            console.error('Failed to delete business', err);
            alert('Failed to delete business: ' + err.message);
        }
    });

    const handleDelete = () => {
        if (!data) return;
        if (confirm(`CRITICAL WARNING: Are you absolutely sure you want to permanently delete the business account "${data.business_name}"? This action cannot be undone.`)) {
            deleteMutation.mutate();
        }
    };

    const getOrderChartData = () => {
        if (!data || !data.raw_data || !data.raw_data.allOrders) return [];
        const orders = data.raw_data.allOrders;

        // Group by date
        const orderCounts: Record<string, number> = {};
        orders.forEach((o: any) => {
            const d = new Date(o.created_at).toLocaleDateString();
            orderCounts[d] = (orderCounts[d] || 0) + 1;
        });

        return Object.keys(orderCounts).map(date => ({
            name: date,
            orders: orderCounts[date]
        })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-10); // Last 10 days
    };

    const getProductChartData = () => {
        if (!data || !data.raw_data || !data.raw_data.stores) return [];
        const categoryCounts: Record<string, number> = {};
        data.raw_data.stores.forEach((store: any) => {
            const products = store.PlasBusinessProductsOrSerives || [];
            products.forEach((p: any) => {
                const cat = p.category || 'Uncategorized';
                categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
            });
        });
        return Object.keys(categoryCounts).map(cat => ({
            name: cat,
            value: categoryCounts[cat]
        }));
    };

    const getContractChartData = () => {
        if (!data || !data.raw_data || !data.raw_data.allContracts) return [];
        const statusCounts: Record<string, number> = {};
        data.raw_data.allContracts.forEach((c: any) => {
            // Usually capitalize status
            const status = c.status ? c.status.charAt(0).toUpperCase() + c.status.slice(1) : 'Unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });
        return Object.keys(statusCounts).map(s => ({
            name: s,
            value: statusCounts[s]
        }));
    };

    const getRfqVsQuotesData = () => {
        if (!data || !data.raw_data || !data.raw_data.rfqs) return [];

        let pendingContracts = 0;
        let ongoingContracts = 0;

        data.raw_data.allContracts?.forEach((c: any) => {
            const lowerStatus = (c.status || '').toLowerCase();
            if (lowerStatus.includes('pend')) pendingContracts++;
            if (lowerStatus.includes('ongoing') || lowerStatus.includes('active') || lowerStatus.includes('sign')) ongoingContracts++;
        });

        return [
            { name: 'RFQs Issued', value: data.rfqs_count || 0 },
            { name: 'Quotes Submitted', value: data.quotes_count || 0 },
            { name: 'Pending Contracts', value: pendingContracts },
            { name: 'Ongoing/Signed Contracts', value: ongoingContracts },
        ];
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    if (isLoading) {
        return (
            <ProtectedRoute requiredPrivilege="plasmarket">
                <AdminLayout>
                    <div className="flex h-[50vh] items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading business profile...</p>
                        </div>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        );
    }

    if (error || !data) {
        return (
            <ProtectedRoute requiredPrivilege="plasmarket">
                <AdminLayout>
                    <div className="p-6">
                        <Button variant="ghost" onClick={() => router.push('/plasmarket')} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back to PlasMarket
                        </Button>
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{(error as Error)?.message || 'Failed to load business profile.'}</AlertDescription>
                        </Alert>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        );
    }

    const { stores, rfqs, wallets, allOrders } = data.raw_data;
    const orderChartData = getOrderChartData();
    const productChartData = getProductChartData();
    const contractChartData = getContractChartData();
    const rfqVsQuotesData = getRfqVsQuotesData();

    return (
        <ProtectedRoute requiredModules={['plasmarket']}>
            <AdminLayout>
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => router.push('/plasmarket')}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div>
                                <h1 className="text-3xl font-bold tracking-tight">{data.business_name}</h1>
                                <p className="text-muted-foreground">
                                    Business ID: {data.id} • Joined: {new Date(data.created_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {getStatusBadge(data.status)}
                            {canManageStatus && (
                                <Button
                                    variant={data.status === 'on_hold' ? 'default' : 'secondary'}
                                    size="sm"
                                    onClick={toggleStatus}
                                    disabled={statusMutation.isPending || deleteMutation.isPending}
                                    className="ml-2"
                                >
                                    {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {data.status === 'on_hold' ? 'Re-Activate Account' : 'Put On Hold'}
                                </Button>
                            )}
                            {canDeleteBusiness && (
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={handleDelete}
                                    disabled={deleteMutation.isPending || statusMutation.isPending}
                                    className="ml-2"
                                    title="Permanently Delete Business"
                                >
                                    {deleteMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                                </Button>
                            )}
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Stores</CardTitle>
                                <Store className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.stores_count}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total Orders</CardTitle>
                                <ShoppingBag className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.orders_count}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">RFQs & Quotes</CardTitle>
                                <FileText className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.rfqs_count} / {data.quotes_count}</div>
                                <p className="text-xs text-muted-foreground">RFQs / Submitted Quotes</p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Active Contracts</CardTitle>
                                <Briefcase className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.contracts_count}</div>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">

                        {/* Owner & Contact Card */}
                        <Card className="md:col-span-4 lg:col-span-3">
                            <CardHeader>
                                <CardTitle>Business Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <h4 className="text-sm font-medium border-b pb-2">Contact Details</h4>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{data.business_email || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{data.business_phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{data.business_location || 'N/A'}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-sm">
                                        <Briefcase className="h-4 w-4 text-muted-foreground" />
                                        <span className="capitalize">{data.raw_data.account_type || 'Retail'}</span>
                                    </div>
                                </div>

                                {data.owner && (
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-medium border-b pb-2">Owner Profile</h4>
                                        <div className="flex items-center gap-3 mt-2">
                                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                {data.owner.profile_picture ? (
                                                    <img src={data.owner.profile_picture} alt="Owner" className="h-10 w-10 rounded-full object-cover" />
                                                ) : (
                                                    <User className="h-5 w-5 text-primary" />
                                                )}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium">{data.owner.name}</p>
                                                <p className="text-xs text-muted-foreground">{data.owner.email}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Main Tabs Area */}
                        <Card className="md:col-span-8 lg:col-span-9">
                            <Tabs defaultValue="overview" className="w-full">
                                <CardHeader className="pb-0">
                                    <TabsList>
                                        <TabsTrigger value="overview">Overview</TabsTrigger>
                                        <TabsTrigger value="stores">Stores ({stores?.length || 0})</TabsTrigger>
                                        <TabsTrigger value="rfqs">RFQs ({rfqs?.length || 0})</TabsTrigger>
                                        <TabsTrigger value="wallets">Wallets ({wallets?.length || 0})</TabsTrigger>
                                    </TabsList>
                                </CardHeader>
                                <CardContent className="pt-6">

                                    {/* OVERVIEW TAB */}
                                    {/* OVERVIEW TAB */}
                                    <TabsContent value="overview" className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            {/* Order Trends */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Order Trends (Last 10 Days)</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                                                    {orderChartData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <AreaChart data={orderChartData}>
                                                                <defs>
                                                                    <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                                                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8} />
                                                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                                    </linearGradient>
                                                                </defs>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                                <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                                                                <YAxis fontSize={12} allowDecimals={false} />
                                                                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                                                                <Area type="monotone" dataKey="orders" stroke="#3b82f6" fillOpacity={1} fill="url(#colorOrders)" />
                                                            </AreaChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No recent order data</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Top Products/Services Chart */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Provided Products/Services by Category</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                                                    {productChartData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={productChartData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                                                                    {productChartData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                                                                <Legend verticalAlign="bottom" height={36} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No product data</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Contract Status Chart */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Contracts Overview</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                                                    {contractChartData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <PieChart>
                                                                <Pie data={contractChartData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                                                    {contractChartData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Pie>
                                                                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                                                            </PieChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No contract data</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* RFQ vs Quotes */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">RFQs & Quotes Pipeline</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                                                    {rfqVsQuotesData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={rfqVsQuotesData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} opacity={0.3} />
                                                                <XAxis type="number" fontSize={12} allowDecimals={false} />
                                                                <YAxis dataKey="name" type="category" width={100} fontSize={11} />
                                                                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                                                                <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                                                                    {rfqVsQuotesData.map((entry, index) => (
                                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                                    ))}
                                                                </Bar>
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No RFQ data</div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </TabsContent>

                                    {/* STORES TAB */}
                                    <TabsContent value="stores">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Store Name</TableHead>
                                                    <TableHead>Location</TableHead>
                                                    <TableHead>Products</TableHead>
                                                    <TableHead>Orders</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {stores?.length > 0 ? stores.map((store: any) => (
                                                    <TableRow
                                                        key={store.id}
                                                        className="cursor-pointer hover:bg-muted/50 transition-colors"
                                                        onClick={() => router.push(`/plasmarket/store/${store.id}`)}
                                                    >
                                                        <TableCell className="font-medium">
                                                            {store.name}
                                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]">{store.description}</div>
                                                        </TableCell>
                                                        <TableCell className="text-sm">{store.address || <span className="text-muted-foreground italic">No address</span>}</TableCell>
                                                        <TableCell>{store.PlasBusinessProductsOrSerives?.length || 0}</TableCell>
                                                        <TableCell>{store.businessProductOrders?.length || 0}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={store.is_active ? 'default' : 'secondary'}>
                                                                {store.is_active ? 'Active' : 'Inactive'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No stores configured.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>

                                    {/* RFQS TAB */}
                                    <TabsContent value="rfqs">
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Title</TableHead>
                                                    <TableHead>Category</TableHead>
                                                    <TableHead>Budget</TableHead>
                                                    <TableHead>Responses</TableHead>
                                                    <TableHead>Status</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {rfqs?.length > 0 ? rfqs.map((rfq: any) => (
                                                    <TableRow key={rfq.id}>
                                                        <TableCell className="font-medium">
                                                            {rfq.title}
                                                            <div className="text-xs text-muted-foreground">{new Date(rfq.created_at).toLocaleDateString()}</div>
                                                        </TableCell>
                                                        <TableCell>{rfq.category || 'N/A'}</TableCell>
                                                        <TableCell>{rfq.min_budget ? `${currency}${rfq.min_budget} - ${currency}${rfq.max_budget}` : 'Not specified'}</TableCell>
                                                        <TableCell>{rfq.BusinessQoutes?.length || 0}</TableCell>
                                                        <TableCell>
                                                            <Badge variant={rfq.open ? 'default' : 'secondary'}>
                                                                {rfq.open ? 'Open' : 'Closed'}
                                                            </Badge>
                                                        </TableCell>
                                                    </TableRow>
                                                )) : (
                                                    <TableRow>
                                                        <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No RFQs submitted.</TableCell>
                                                    </TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </TabsContent>

                                    {/* WALLETS TAB */}
                                    <TabsContent value="wallets">
                                        <div className="grid grid-cols-1 gap-4">
                                            {wallets?.length > 0 ? wallets.map((wallet: any) => (
                                                <Card key={wallet.id} className="border bg-muted/10">
                                                    <CardContent className="p-4 flex items-center justify-between">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-3 bg-primary/10 rounded-full">
                                                                <Wallet className="h-6 w-6 text-primary" />
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-medium text-muted-foreground">Wallet Balance</p>
                                                                <p className="text-2xl font-bold">{currency}{wallet.amount ? Number(wallet.amount).toFixed(2) : '0.00'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-sm text-muted-foreground">Transactions</p>
                                                            <p className="font-medium">{wallet.businessTransactions?.length || 0}</p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )) : (
                                                <div className="text-center py-10 border rounded-md text-muted-foreground">
                                                    No wallet information available.
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                </CardContent>
                            </Tabs>
                        </Card>
                    </div>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
}
