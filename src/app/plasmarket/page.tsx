'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Store, User, FileText, Briefcase, ShoppingBag, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface BusinessAccount {
    id: string;
    business_name: string;
    business_email: string;
    business_phone: string;
    business_location: string;
    status: string;
    created_at: string;
    stores_count: number | string;
    rfqs_count: number | string;
    contracts_count: number | string;
    orders_count: number | string;
    owner: {
        name: string;
        email: string;
        phone: string;
    } | null;
}

export default function PlasMarketPage() {
    const [searchTerm, setSearchTerm] = useState('');

    const { data, isLoading, error } = useQuery({
        queryKey: ['adminPlasMarketBusinesses'],
        queryFn: async () => {
            const data = await apiGet<{ businesses: BusinessAccount[] }>('/api/admin/plasmarket');
            return data.businesses;
        },
    });

    if (isLoading) {
        return (
            <div className="flex h-[50vh] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-muted-foreground">Loading PlasMarket data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <Alert variant="destructive" className="m-6">
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>
                    Failed to load PlasMarket businesses. Please try again later.
                </AlertDescription>
            </Alert>
        );
    }

    const businesses = data || [];

    const filteredBusinesses = businesses.filter(biz =>
        biz.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        biz.business_email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getStatusBadge = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'processed':
            case 'approved':
            case 'active':
                return <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{status}</Badge>;
            case 'in_review':
            case 'pending':
                return <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{status}</Badge>;
            case 'rejected':
                return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">{status}</Badge>;
            case 'on_hold':
            case 'suspended':
                return <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">{status}</Badge>;
            default:
                return <Badge variant="outline">{status || 'Unknown'}</Badge>;
        }
    };

    return (
        <ProtectedRoute requiredPrivilege="plasmarket" requiredAction="access">
            <AdminLayout>
                <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h1 className="text-3xl font-bold tracking-tight">PlasMarket</h1>
                            <p className="text-muted-foreground">Manage and monitor all business accounts across the platform.</p>
                        </div>
                    </div>

                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Total Businesses</CardTitle>
                                <Store className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{businesses.length}</div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">In Review</CardTitle>
                                <FileText className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {businesses.filter(b => b.status === 'in_review' || b.status === 'pending').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Processed / Active</CardTitle>
                                <Briefcase className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {businesses.filter(b => b.status === 'processed' || b.status === 'approved' || b.status === 'active').length}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                                <CardTitle className="text-sm font-medium">Rejected / On Hold</CardTitle>
                                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {businesses.filter(b => b.status === 'rejected' || b.status === 'on_hold').length}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <div className="flex justify-between items-center">
                                <CardTitle>Business Directories</CardTitle>
                                <div className="w-[300px]">
                                    <Input
                                        placeholder="Search businesses..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="rounded-md border">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Business Name</TableHead>
                                            <TableHead>Owner</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="text-center">Stores</TableHead>
                                            <TableHead className="text-center">RFQs</TableHead>
                                            <TableHead className="text-center">Contracts</TableHead>
                                            <TableHead className="text-center">Orders</TableHead>
                                            <TableHead className="text-right">Joined</TableHead>
                                            <TableHead className="text-right">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {filteredBusinesses.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={8} className="text-center h-32 text-muted-foreground">
                                                    No businesses found.
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            filteredBusinesses.map((biz) => (
                                                <TableRow key={biz.id}>
                                                    <TableCell>
                                                        <div className="font-medium">{biz.business_name}</div>
                                                        <div className="text-xs text-muted-foreground">{biz.business_email}</div>
                                                    </TableCell>
                                                    <TableCell>
                                                        {biz.owner ? (
                                                            <>
                                                                <div className="text-sm">{biz.owner.name || 'Unknown'}</div>
                                                                <div className="text-xs text-muted-foreground">{biz.owner.email}</div>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-muted-foreground">N/A</span>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>{getStatusBadge(biz.status)}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">{biz.stores_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">{biz.rfqs_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">{biz.contracts_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="secondary">{biz.orders_count}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-right text-sm text-muted-foreground">
                                                        {new Date(biz.created_at).toLocaleDateString()}
                                                    </TableCell>
                                                    <TableCell className="text-right">
                                                        <Button variant="outline" size="sm" asChild>
                                                            <Link href={`/plasmarket/${biz.id}`}>
                                                                View Details
                                                            </Link>
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </AdminLayout>
        </ProtectedRoute>
    );
}
