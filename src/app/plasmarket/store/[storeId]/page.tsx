'use client';

import React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
    Store, Package, ShoppingBag, MapPin, Clock, ArrowLeft, Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiGet } from '@/lib/api';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart, Pie, Cell, Legend
} from 'recharts';

export default function StoreProfilePage() {
    const params = useParams();
    const router = useRouter();
    const storeId = (params?.storeId as string) || '';

    const { data: configData } = useSystemConfig();
    const currency = configData?.currency || '$';

    const { data, isLoading, error } = useQuery({
        queryKey: ['plasmarket-store', storeId],
        queryFn: async () => {
            const response = (await apiGet(`/api/admin/plasmarket/store/${storeId}`)) as any;
            if (!response.success) {
                throw new Error(response.error || 'Failed to fetch store');
            }
            return response.store;
        },
        enabled: !!storeId
    });

    const getOrderChartData = () => {
        if (!data || !data.orders) return [];
        const orderCounts: Record<string, number> = {};
        data.orders.forEach((o: any) => {
            const d = new Date(o.created_at).toLocaleDateString();
            orderCounts[d] = (orderCounts[d] || 0) + 1;
        });
        return Object.keys(orderCounts).map(date => ({
            name: date,
            orders: orderCounts[date]
        })).sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime()).slice(-10);
    };

    const getProductChartData = () => {
        if (!data || !data.products) return [];
        const categoryCounts: Record<string, number> = {};
        data.products.forEach((p: any) => {
            const cat = p.category || 'Uncategorized';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        return Object.keys(categoryCounts).map(cat => ({
            name: cat,
            value: categoryCounts[cat]
        }));
    };

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

    if (isLoading) {
        return (
            <ProtectedRoute requiredPrivilege="plasmarket">
                <AdminLayout>
                    <div className="flex h-[50vh] items-center justify-center">
                        <div className="flex flex-col items-center gap-2">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                            <p className="text-sm text-muted-foreground">Loading store profile...</p>
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
                        <Button variant="ghost" onClick={() => router.back()} className="mb-4">
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        <Alert variant="destructive">
                            <AlertTitle>Error</AlertTitle>
                            <AlertDescription>{(error as Error)?.message || 'Failed to load store profile.'}</AlertDescription>
                        </Alert>
                    </div>
                </AdminLayout>
            </ProtectedRoute>
        );
    }

    const orderChartData = getOrderChartData();
    const productChartData = getProductChartData();

    return (
        <ProtectedRoute requiredPrivilege="plasmarket">
            <AdminLayout>
                <div className="flex flex-col gap-6 p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Button variant="outline" size="icon" onClick={() => router.push(`/plasmarket/${data.business_id}`)}>
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                            <div className="flex items-center gap-4">
                                {data.image ? (
                                    <img src={data.image} alt={data.name} className="h-16 w-16 rounded-md object-cover border shadow-sm" />
                                ) : (
                                    <div className="h-16 w-16 rounded-md bg-muted flex items-center justify-center border shadow-sm">
                                        <Store className="h-8 w-8 text-muted-foreground" />
                                    </div>
                                )}
                                <div>
                                    <h1 className="text-3xl font-bold tracking-tight">{data.name}</h1>
                                    <p className="text-muted-foreground">
                                        Store ID: {data.id} • Registered: {new Date(data.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <Badge variant={data.is_active ? 'default' : 'secondary'} className="text-sm px-3 py-1">
                                {data.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Products / Services</CardTitle>
                                <Package className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{data.products_count}</div>
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
                                <CardTitle className="text-sm font-medium">Store Category</CardTitle>
                                <Store className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-lg font-medium">{data.category?.name || 'Uncategorized'}</div>
                                <p className="text-xs text-muted-foreground truncate">{data.category?.description || 'N/A'}</p>
                            </CardContent>
                        </Card>
                    </div>

                    <div className="grid gap-6 md:grid-cols-12">

                        {/* Left Sidebar Info */}
                        <Card className="md:col-span-4 lg:col-span-3 h-fit">
                            <CardHeader>
                                <CardTitle>Location & Info</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-start gap-3 text-sm">
                                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div>
                                        <p className="font-medium text-foreground">Address</p>
                                        <p className="text-muted-foreground">{data.address || 'No address provided'}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3 text-sm">
                                    <Clock className="h-4 w-4 text-muted-foreground mt-0.5" />
                                    <div className="w-full">
                                        <p className="font-medium text-foreground">Operating Hours</p>
                                        <div className="text-muted-foreground mt-1">
                                            {typeof data.operating_hours === 'string' ? (
                                                <p>{data.operating_hours}</p>
                                            ) : data.operating_hours && typeof data.operating_hours === 'object' ? (
                                                <div className="flex flex-col gap-1">
                                                    {Object.entries(data.operating_hours).map(([day, hours]) => (
                                                        <div key={day} className="flex gap-2 text-xs">
                                                            <span className="capitalize w-20">{day}:</span>
                                                            <span>{String(hours)}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <p>Not specified</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="pt-4 border-t">
                                    <p className="text-sm font-medium mb-1">Description</p>
                                    <p className="text-xs text-muted-foreground leading-relaxed">{data.description || 'No description available for this store.'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Main Tabs */}
                        <Card className="md:col-span-8 lg:col-span-9">
                            <Tabs defaultValue="products" className="w-full">
                                <CardHeader className="pb-0">
                                    <TabsList>
                                        <TabsTrigger value="products">Products ({data.products_count})</TabsTrigger>
                                        <TabsTrigger value="orders">Orders & Analytics ({data.orders_count})</TabsTrigger>
                                    </TabsList>
                                </CardHeader>
                                <CardContent className="pt-6">

                                    {/* PRODUCTS TAB */}
                                    <TabsContent value="products">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                            {data.products?.length > 0 ? data.products.map((product: any, idx: number) => (
                                                <Card key={product.query_id || idx} className="overflow-hidden flex flex-col group">
                                                    <div className="aspect-square bg-muted relative overflow-hidden">
                                                        {product.Image ? (
                                                            <img
                                                                src={product.Image}
                                                                alt={product.name}
                                                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                                                <Package className="h-10 w-10 opacity-50" />
                                                            </div>
                                                        )}
                                                        {!product.enabled && (
                                                            <div className="absolute top-2 right-2">
                                                                <Badge variant="destructive" className="bg-red-500/90 hover:bg-red-500">Disabled</Badge>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <CardContent className="p-4 flex-1 flex flex-col justify-between">
                                                        <div>
                                                            <p className="text-xs text-muted-foreground font-medium mb-1">{product.category}</p>
                                                            <h4 className="font-bold line-clamp-1" title={product.name}>{product.name}</h4>
                                                            <p className="text-xl font-bold text-primary mt-2">
                                                                {currency}{Number(product.price || 0).toFixed(2)}
                                                                {product.unit && <span className="text-sm text-muted-foreground font-normal ml-1">/{product.unit}</span>}
                                                            </p>
                                                        </div>
                                                    </CardContent>
                                                </Card>
                                            )) : (
                                                <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg border-dashed">
                                                    <Package className="h-12 w-12 mx-auto mb-3 opacity-20" />
                                                    <p>No products or services found for this store.</p>
                                                </div>
                                            )}
                                        </div>
                                    </TabsContent>

                                    {/* ORDERS TAB */}
                                    <TabsContent value="orders" className="space-y-6">
                                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2">
                                            {/* Order Trends */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Order Velocity (Last 10 Days)</h4>
                                                <div className="h-[250px] w-full border rounded-md p-4 bg-muted/20">
                                                    {orderChartData.length > 0 ? (
                                                        <ResponsiveContainer width="100%" height="100%">
                                                            <BarChart data={orderChartData}>
                                                                <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                                                                <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                                                                <YAxis fontSize={12} allowDecimals={false} />
                                                                <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                                                                <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
                                                            </BarChart>
                                                        </ResponsiveContainer>
                                                    ) : (
                                                        <div className="h-full flex items-center justify-center text-sm text-muted-foreground">No recent order data</div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Products Categories */}
                                            <div className="space-y-2">
                                                <h4 className="text-sm font-medium">Product Catalog Distribution</h4>
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
                                        </div>

                                        <div className="space-y-2">
                                            <h4 className="text-sm font-medium">Recent Store Orders</h4>
                                            <div className="border rounded-md">
                                                <Table>
                                                    <TableHeader>
                                                        <TableRow>
                                                            <TableHead>Order ID</TableHead>
                                                            <TableHead>Date</TableHead>
                                                            <TableHead>Customer</TableHead>
                                                            <TableHead>Total</TableHead>
                                                            <TableHead>Status</TableHead>
                                                        </TableRow>
                                                    </TableHeader>
                                                    <TableBody>
                                                        {data.orders?.length > 0 ? data.orders.slice(0, 10).map((order: any) => (
                                                            <TableRow key={order.id}>
                                                                <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}...</TableCell>
                                                                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                                                <TableCell>
                                                                    {order.orderedBy?.name || 'Guest'}
                                                                    <div className="text-xs text-muted-foreground">{order.orderedBy?.email || order.orderedBy?.phone || ''}</div>
                                                                </TableCell>
                                                                <TableCell className="font-bold">{currency}{Number(order.total || 0).toFixed(2)}</TableCell>
                                                                <TableCell>
                                                                    <Badge variant="outline" className="capitalize">{order.status || 'Pending'}</Badge>
                                                                </TableCell>
                                                            </TableRow>
                                                        )) : (
                                                            <TableRow>
                                                                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">No orders found for this store.</TableCell>
                                                            </TableRow>
                                                        )}
                                                    </TableBody>
                                                </Table>
                                            </div>
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
