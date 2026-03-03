'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  ArrowLeft,
  Mail,
  Phone,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Calendar,
  Users,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
} from 'recharts';
import { DUMMY_SUPPLIERS, DUMMY_PURCHASE_ORDERS } from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { formatCurrency } from '@/lib/utils';

interface SupplierDetailPageProps {
  supplierId: string;
}

export default function SupplierDetailPage({ supplierId }: SupplierDetailPageProps) {
  const router = useRouter();
  const { data: config } = useSystemConfig();
  const currency = config?.currency || 'RWF';

  const formatMoney = (amount: number) => {
    return formatCurrency(amount);
  };

  const supplier = useMemo(() => {
    return DUMMY_SUPPLIERS.find(s => s.id === supplierId);
  }, [supplierId]);

  const supplierPos = useMemo(() => {
    return DUMMY_PURCHASE_ORDERS.filter(po => po.supplierId === supplierId).sort((a, b) => {
      return new Date(b.dateCreated).getTime() - new Date(a.dateCreated).getTime();
    });
  }, [supplierId]);

  // Mock data for charts
  const purchasesData = useMemo(() => {
    // Generates dummy monthly purchase data for the last 6 months
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    return months.map(month => ({
      name: month,
      amount: Math.floor(Math.random() * 5000) + 1000,
    }));
  }, []);

  const balanceData = useMemo(() => {
    // Generates dummy outstanding balance trend
    const months = ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb'];
    let currentBal = supplier?.outstandingBalance || 0;
    return months
      .reverse()
      .map(month => {
        const dataPoint = {
          name: month,
          balance: currentBal,
        };
        // work backwards to mock previous balances
        currentBal = Math.max(0, currentBal + (Math.random() * 2000 - 1000));
        return dataPoint;
      })
      .reverse();
  }, [supplier]);

  if (!supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <Building2 className="w-16 h-16 text-slate-300" />
        <h2 className="text-xl font-semibold text-slate-700">Supplier Not Found</h2>
        <Button variant="outline" onClick={() => router.push('/pos/procurement/suppliers')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Suppliers
        </Button>
      </div>
    );
  }

  const totalOrdersValue = supplierPos.reduce((sum, po) => sum + po.totalAmount, 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.push('/pos/procurement/suppliers')}
          className="rounded-full bg-slate-100 hover:bg-slate-200"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h2 className="text-3xl font-bold tracking-tight text-slate-900">{supplier.name}</h2>
            <Badge
              variant={
                supplier.status === 'Active'
                  ? 'default'
                  : supplier.status === 'Inactive'
                    ? 'secondary'
                    : 'outline'
              }
              className={supplier.status === 'Active' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}
            >
              {supplier.status}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <FileText className="w-4 h-4" /> Supplier ID: {supplier.id}
            {supplier.taxId && (
              <>
                {' '}
                <span className="text-slate-300">|</span> Tax ID: {supplier.taxId}{' '}
              </>
            )}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Info & Stats */}
        <div className="space-y-6 lg:col-span-1">
          {/* Contact Info Card */}
          <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary" />
                Supplier Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-4">
              <div>
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Company Name
                </h4>
                <p className="font-medium text-slate-900">
                  {supplier.companyName || supplier.name}
                </p>
                <Badge variant="outline" className="mt-1 bg-slate-50">
                  {supplier.category}
                </Badge>
              </div>

              <div className="space-y-3 pt-2 border-t text-sm">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-blue-50 p-1.5 rounded-md text-blue-600">
                    <Users className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Contact Person</div>
                    <div className="text-slate-900">{supplier.contactPerson}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-rose-50 p-1.5 rounded-md text-rose-600">
                    <Mail className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Email</div>
                    <a href={`mailto:${supplier.email}`} className="text-primary hover:underline">
                      {supplier.email}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-emerald-50 p-1.5 rounded-md text-emerald-600">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Phone</div>
                    <a
                      href={`tel:${supplier.phone}`}
                      className="text-slate-900 hover:text-primary transition-colors"
                    >
                      {supplier.phone}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 bg-amber-50 p-1.5 rounded-md text-amber-600">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-slate-500 font-medium">Address</div>
                    <div className="text-slate-900">
                      {supplier.address || 'No address provided'}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Financial Summary Card */}
          <Card className="shadow-sm border-0 ring-1 ring-slate-200">
            <CardHeader className="bg-slate-50/50 border-b pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6 space-y-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Payment Terms</span>
                <Badge variant="secondary" className="font-medium bg-slate-100">
                  {supplier.paymentTerms}
                </Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Credit Limit</span>
                <span className="font-semibold text-slate-900">
                  {formatMoney(supplier.creditLimit || 0)}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-gradient-to-br from-rose-50 to-white ring-1 ring-rose-100">
                <div className="text-sm font-medium text-rose-600/80 mb-1 flex items-center gap-1.5">
                  <DollarSign className="w-4 h-4" /> Outstanding Balance
                </div>
                <div className="text-3xl font-bold text-rose-700">
                  {formatMoney(supplier.outstandingBalance)}
                </div>
                {supplier.creditLimit && supplier.creditLimit > 0 && (
                  <div className="mt-3">
                    <div className="flex justify-between text-xs mb-1 text-slate-500">
                      <span>Credit Used</span>
                      <span>
                        {Math.round((supplier.outstandingBalance / supplier.creditLimit) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className={`h-1.5 rounded-full ${supplier.outstandingBalance > supplier.creditLimit * 0.8 ? 'bg-rose-500' : 'bg-primary'}`}
                        style={{
                          width: `${Math.min((supplier.outstandingBalance / supplier.creditLimit) * 100, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Charts & Tables */}
        <div className="space-y-6 lg:col-span-2">
          {/* Metrics Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 ring-1 ring-slate-200 shadow-sm bg-gradient-to-br from-indigo-50/50 to-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                    <ShoppingCart className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Total Purchase Orders</div>
                    <div className="text-2xl font-bold text-slate-900">{supplierPos.length}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 ring-1 ring-slate-200 shadow-sm bg-gradient-to-br from-emerald-50/50 to-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600">
                    <DollarSign className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Total Spend</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {formatMoney(totalOrdersValue)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 ring-1 ring-slate-200 shadow-sm bg-gradient-to-br from-amber-50/50 to-white">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-slate-500">Avg. Lead Time</div>
                    <div className="text-2xl font-bold text-slate-900">
                      {supplier.leadTimeDays}{' '}
                      <span className="text-sm font-medium text-slate-500">days</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Purchases Chart */}
            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Total Purchases</CardTitle>
                <CardDescription>Monthly spend with this supplier</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={purchasesData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickFormatter={value => `$${value / 1000}k`}
                    />
                    <Tooltip
                      cursor={{ fill: '#F1F5F9' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [formatMoney(value), 'Spend']}
                    />
                    <Bar dataKey="amount" fill="#6366F1" radius={[4, 4, 0, 0]} barSize={32} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Balance Trend Chart */}
            <Card className="shadow-sm border-0 ring-1 ring-slate-200">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-semibold">Outstanding Balance</CardTitle>
                <CardDescription>Balance trend over last 6 months</CardDescription>
              </CardHeader>
              <CardContent className="h-[250px] pt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={balanceData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748B' }}
                      tickFormatter={value => `$${value / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [formatMoney(value), 'Balance']}
                    />
                    <Line
                      type="monotone"
                      dataKey="balance"
                      stroke="#EF4444"
                      strokeWidth={3}
                      dot={{ r: 4, fill: '#EF4444', strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Recent Purchase Orders Table */}
          <Card className="shadow-sm border-0 ring-1 ring-slate-200 overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b">
              <CardTitle className="text-base font-semibold">Recent Purchase Orders</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              {supplierPos.length > 0 ? (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-white hover:bg-white text-xs uppercase tracking-wider text-slate-500">
                        <TableHead className="font-semibold">PO Number</TableHead>
                        <TableHead className="font-semibold">Date</TableHead>
                        <TableHead className="font-semibold">Expected Delivery</TableHead>
                        <TableHead className="font-semibold text-right">Amount</TableHead>
                        <TableHead className="font-semibold">Status</TableHead>
                        <TableHead className="font-semibold text-right">Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {supplierPos.slice(0, 5).map(po => (
                        <TableRow key={po.id} className="hover:bg-slate-50/80 transition-colors">
                          <TableCell className="font-medium text-slate-900">
                            {po.poNumber}
                          </TableCell>
                          <TableCell className="text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-slate-400" />
                              {new Date(po.dateCreated).toLocaleDateString()}
                            </div>
                          </TableCell>
                          <TableCell className="text-slate-600">
                            {new Date(po.expectedDeliveryDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="text-right font-medium">
                            {formatMoney(po.totalAmount)}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant={
                                po.status === 'Delivered'
                                  ? 'default'
                                  : po.status === 'Cancelled'
                                    ? 'destructive'
                                    : po.status === 'Pending'
                                      ? 'secondary'
                                      : 'outline'
                              }
                              className={
                                po.status === 'Delivered'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-100 border-0'
                                  : po.status === 'Approved'
                                    ? 'bg-blue-100 text-blue-800 hover:bg-blue-100 border-0'
                                    : po.status === 'Shipped'
                                      ? 'bg-indigo-100 text-indigo-800 hover:bg-indigo-100 border-0'
                                      : ''
                              }
                            >
                              {po.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 text-primary hover:text-primary hover:bg-primary/10"
                            >
                              View details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ) : (
                <div className="p-8 text-center flex flex-col items-center">
                  <FileText className="w-12 h-12 text-slate-200 mb-3" />
                  <p className="text-slate-600 font-medium">No purchase orders found</p>
                  <p className="text-sm text-slate-400 mt-1">
                    This supplier doesn&apos;t have any purchase history yet.
                  </p>
                </div>
              )}
              {supplierPos.length > 5 && (
                <div className="p-3 border-t bg-slate-50/50 text-center">
                  <Button variant="link" className="text-sm text-primary">
                    View all {supplierPos.length} purchase orders
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Ensure the fake lucide-react import 'Users' used here doesn't conflict, it is imported correctly above.
