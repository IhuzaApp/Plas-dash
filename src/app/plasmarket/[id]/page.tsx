'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Store, User, FileText, Briefcase, ShoppingBag,
    Wallet, PieChart as PieChartIcon, Activity,
    MapPin, Phone, Mail, Clock, ArrowLeft, Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiGet } from '@/lib/api';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';

export default function BusinessProfilePage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

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
            case 'processed': return <Badge variant="outline" className="text-green-600 border-green-600 bg-green-50">Processed</Badge>;
            case 'reject': return <Badge variant="outline" className="text-red-600 border-red-600 bg-red-50">Rejected</Badge>;
            case 'on_hold': return <Badge variant="outline" className="text-orange-600 border-orange-600 bg-orange-50">On Hold</Badge>;
            default: return <Badge variant="secondary">{status}</Badge>;
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
        })).slice(-10); // Last 10 days
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    if (isLoading) {
        return (
            <ProtectedRoute requiredModules={['plasmarket']}>
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
            <ProtectedRoute requiredModules={['plasmarket']}>
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
                        <div>
                            {getStatusBadge(data.status)}
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
                                    <TabsContent value="overview" className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2">
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Order Trends (Last 10 Days)</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                                                    {orderChartData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={orderChartData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                                <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                                                                <YAxis fontSize={12} allowDecimals={false} />
                                                                <RechartsTooltip
                                                                    contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                                />
                                                                <Bar dataKey="orders" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                                                            No recent order data available
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Status Distribution</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20 flex flex-col items-center justify-center">
                                                    <Activity className="h-8 w-8 text-primary/40 mb-2" />
                                                    <p className="text-sm text-muted-foreground text-center px-4">
                                                        This business is currently <strong>{data.status}</strong>. Advanced analytics will appear here as the business becomes more active.
                                                    </p>
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
                                                    <TableRow key={store.id}>
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
                                                        <TableCell>{rfq.min_budget ? `$${rfq.min_budget} - $${rfq.max_budget}` : 'Not specified'}</TableCell>
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
                                                                <p className="text-2xl font-bold">${wallet.amount ? Number(wallet.amount).toFixed(2) : '0.00'}</p>
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
