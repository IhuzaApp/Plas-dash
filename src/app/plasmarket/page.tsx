'use client';

import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Store, User, FileText, Briefcase, ShoppingBag, Loader2, Download } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import AdminLayout from '@/components/layout/AdminLayout';
import { apiGet } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  BarChart,
  Bar,
} from 'recharts';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { usePrivilege } from '@/hooks/usePrivilege';

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
  raw_data: {
    stores: any[];
    rfqs: any[];
    account_type: string;
  };
}

export default function PlasMarketPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const router = useRouter();
  const { data: configData } = useSystemConfig();
  const currency = configData?.currency || '$';
  const { hasAction } = usePrivilege();
  const canExportData = hasAction('plasmarket', 'export_data');

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

  const filteredBusinesses = businesses.filter(biz => {
    const matchesSearch =
      biz.business_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      biz.business_email?.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    if (statusFilter === 'all') return true;
    if (statusFilter === 'pending')
      return ['in_review', 'pending'].includes(biz.status?.toLowerCase());
    if (statusFilter === 'accepted')
      return ['processed', 'approved', 'active', 'accepted'].includes(biz.status?.toLowerCase());
    if (statusFilter === 'rejected')
      return ['rejected', 'on_hold', 'suspended'].includes(biz.status?.toLowerCase());

    return true;
  });

  // Chart Data Parsing
  const getTrendData = () => {
    const counts: Record<string, number> = {};
    businesses.forEach(biz => {
      const date = new Date(biz.created_at).toLocaleDateString();
      counts[date] = (counts[date] || 0) + 1;
    });
    return Object.keys(counts)
      .map(date => ({
        name: date,
        registrations: counts[date],
      }))
      .sort((a, b) => new Date(a.name).getTime() - new Date(b.name).getTime())
      .slice(-15);
  };

  const getCategoryData = () => {
    const counts: Record<string, number> = {};
    businesses.forEach(biz => {
      biz.raw_data?.stores?.forEach(store => {
        const cat = store.Category?.name || 'Uncategorized';
        counts[cat] = (counts[cat] || 0) + 1;
      });
    });
    return Object.keys(counts).map(cat => ({
      name: cat,
      value: counts[cat],
    }));
  };

  const getAccountTypeData = () => {
    const counts: Record<string, number> = {};
    businesses.forEach(biz => {
      const type = biz.raw_data?.account_type || 'Retail';
      // capitalize
      const displayType = type.charAt(0).toUpperCase() + type.slice(1);
      counts[displayType] = (counts[displayType] || 0) + 1;
    });
    return Object.keys(counts).map(type => ({
      name: type,
      value: counts[type],
    }));
  };

  const getTopSellersData = () => {
    return [...businesses]
      .sort((a, b) => Number(b.orders_count) - Number(a.orders_count))
      .slice(0, 5)
      .map(biz => ({
        name:
          biz.business_name.length > 15
            ? biz.business_name.substring(0, 15) + '...'
            : biz.business_name,
        orders: Number(biz.orders_count),
      }));
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

  const trendData = getTrendData();
  const categoryData = getCategoryData();
  const accountTypeData = getAccountTypeData();
  const topSellersData = getTopSellersData();

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'processed':
      case 'approved':
      case 'active':
      case 'accepted':
        return (
          <Badge className="bg-green-500/10 text-green-500 hover:bg-green-500/20">{status}</Badge>
        );
      case 'in_review':
      case 'pending':
        return (
          <Badge className="bg-blue-500/10 text-blue-500 hover:bg-blue-500/20">{status}</Badge>
        );
      case 'rejected':
        return <Badge className="bg-red-500/10 text-red-500 hover:bg-red-500/20">{status}</Badge>;
      case 'on_hold':
      case 'suspended':
        return (
          <Badge className="bg-amber-500/10 text-amber-500 hover:bg-amber-500/20">{status}</Badge>
        );
      default:
        return <Badge variant="outline">{status || 'Unknown'}</Badge>;
    }
  };

  const handleExport = () => {
    if (!businesses.length) return;

    const headers = [
      'ID',
      'Business Name',
      'Status',
      'Owner Name',
      'Owner Email',
      'Created At',
      'Stores Count',
      'Orders Count',
      'RFQs Count',
      'Contracts Count',
    ];

    const csvRows = businesses.map(b => [
      b.id,
      `"${b.business_name || ''}"`,
      b.status,
      `"${b.owner?.name || ''}"`,
      b.owner?.email || '',
      new Date(b.created_at).toISOString(),
      b.stores_count,
      b.orders_count,
      b.rfqs_count,
      b.contracts_count,
    ]);

    const csvContent = [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `plasmarket_businesses_${new Date().toISOString().split('T')[0]}.csv`
    );
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ProtectedRoute requiredPrivilege="plasmarket" requiredAction="access">
      <AdminLayout>
        <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Plas Market Place</h1>
              <p className="text-muted-foreground">
                Manage and monitor all business accounts across the platform.
              </p>
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
                  {
                    businesses.filter(b => b.status === 'in_review' || b.status === 'pending')
                      .length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Processed /Active</CardTitle>
                <Briefcase className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {
                    businesses.filter(
                      b =>
                        b.status === 'processed' ||
                        b.status === 'approved' ||
                        b.status === 'active' ||
                        b.status === 'accepted'
                    ).length
                  }
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                <CardTitle className="text-sm font-medium">Rejected /On Hold</CardTitle>
                <ShoppingBag className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {businesses.filter(b => b.status === 'rejected' || b.status === 'on_hold').length}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
            {/* Registration Trend */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Business Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full mt-2">
                  {trendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="colorReg" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#8884d8" stopOpacity={0} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
                        <XAxis dataKey="name" fontSize={12} tickMargin={8} />
                        <YAxis fontSize={12} allowDecimals={false} />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Area
                          type="monotone"
                          dataKey="registrations"
                          stroke="#8884d8"
                          fillOpacity={1}
                          fill="url(#colorReg)"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No registration data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Top Sellers */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Top Sellers (by Orders)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full mt-2">
                  {topSellersData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={topSellersData} layout="vertical" margin={{ left: 20 }}>
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.3} />
                        <XAxis type="number" fontSize={12} allowDecimals={false} />
                        <YAxis
                          dataKey="name"
                          type="category"
                          width={100}
                          fontSize={10}
                          tickMargin={5}
                        />
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Bar dataKey="orders" fill="#00C49F" radius={[0, 4, 4, 0]} barSize={20} />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No order data yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full mt-2">
                  {categoryData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={80}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {categoryData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No category data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Account Types */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="text-sm font-medium">Account Types</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[250px] w-full mt-2">
                  {accountTypeData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={accountTypeData}
                          cx="50%"
                          cy="50%"
                          innerRadius={0}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {accountTypeData.map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[(index + 3) % COLORS.length]}
                            />
                          ))}
                        </Pie>
                        <RechartsTooltip contentStyle={{ borderRadius: '8px' }} />
                        <Legend verticalAlign="bottom" height={36} />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                      No account type data
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <CardTitle>Business Directories</CardTitle>
                <div className="flex flex-wrap items-center gap-4">
                  <Tabs defaultValue="all" value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList>
                      <TabsTrigger value="all">All</TabsTrigger>
                      <TabsTrigger value="pending">Review</TabsTrigger>
                      <TabsTrigger value="active">Active</TabsTrigger>
                      <TabsTrigger value="rejected">Rejected</TabsTrigger>
                    </TabsList>
                  </Tabs>
                  {canExportData && (
                    <Button variant="outline" size="sm" onClick={handleExport}>
                      <Download className="w-4 h-4 mr-2" /> Export CSV
                    </Button>
                  )}
                  <div className="w-[300px]">
                    <Input
                      placeholder="Search businesses..."
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                    />
                  </div>
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
                      filteredBusinesses.map(biz => (
                        <TableRow key={biz.id}>
                          <TableCell>
                            <div className="font-medium">{biz.business_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {biz.business_email}
                            </div>
                          </TableCell>
                          <TableCell>
                            {biz.owner ? (
                              <>
                                <div className="text-sm">{biz.owner.name || 'Unknown'}</div>
                                <div className="text-xs text-muted-foreground">
                                  {biz.owner.email}
                                </div>
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
                              <Link href={`/plasmarket/${biz.id}`}>View Details</Link>
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
