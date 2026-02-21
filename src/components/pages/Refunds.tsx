import React, { useMemo, useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Search,
  Filter,
  Loader2,
  Clock,
  Eye,
  CheckCircle2,
  XCircle,
  Banknote,
  TrendingUp,
  LayoutDashboard,
  Table2,
} from 'lucide-react';
import { useRefunds, useSystemConfig } from '@/hooks/useHasuraApi';
import { format } from 'date-fns';
import RefundDetailsSheet from '@/components/drawers/RefundDetailsSheet';
import type { Refund } from '@/hooks/useGraphql';
import Pagination from '@/components/ui/pagination';
import RefundsStatusChart from '@/components/dashboard/RefundsStatusChart';
import RefundsOverTimeChart from '@/components/dashboard/RefundsOverTimeChart';
import RefundsAmountChart from '@/components/dashboard/RefundsAmountChart';

// ─── stat card config ─────────────────────────────────────────────────────────

const STAT_CONFIGS = [
  {
    key: 'total' as const,
    label: 'Total Refunds',
    icon: TrendingUp,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    key: 'pending' as const,
    label: 'Pending',
    icon: Clock,
    color: 'text-yellow-500',
    bg: 'bg-yellow-50 dark:bg-yellow-950/40',
  },
  {
    key: 'inReview' as const,
    label: 'In Review',
    icon: Eye,
    color: 'text-blue-400',
    bg: 'bg-blue-50 dark:bg-blue-950/40',
  },
  {
    key: 'approved' as const,
    label: 'Approved',
    icon: CheckCircle2,
    color: 'text-green-500',
    bg: 'bg-green-50 dark:bg-green-950/40',
  },
  {
    key: 'rejected' as const,
    label: 'Rejected',
    icon: XCircle,
    color: 'text-red-500',
    bg: 'bg-red-50 dark:bg-red-950/40',
  },
] as const;

// ─── component ────────────────────────────────────────────────────────────────

const Refunds = () => {
  const { data, isLoading, error } = useRefunds();
  const { data: systemConfig } = useSystemConfig();
  const refunds = data?.Refunds || [];

  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  // ── stats ──────────────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = refunds.length;
    const pending = refunds.filter(r => r.status.toLowerCase() === 'pending').length;
    const inReview = refunds.filter(r => r.status.toLowerCase() === 'in_review').length;
    const approved = refunds.filter(r => r.status.toLowerCase() === 'approved').length;
    const rejected = refunds.filter(r => r.status.toLowerCase() === 'rejected').length;
    const totalRefunded = refunds
      .filter(r => r.status.toLowerCase() === 'approved' && r.paid)
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return { total, pending, inReview, approved, rejected, totalRefunded: totalRefunded.toFixed(2) };
  }, [refunds]);

  const statValues: Record<typeof STAT_CONFIGS[number]['key'], string | number> = {
    total: stats.total,
    pending: stats.pending,
    inReview: stats.inReview,
    approved: stats.approved,
    rejected: stats.rejected,
  };

  // ── filter / pagination ─────────────────────────────────────────────────────
  const filteredRefunds = refunds.filter(
    refund =>
      searchTerm === '' ||
      refund.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
      refund.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredRefunds.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentRefunds = filteredRefunds.slice(startIndex, startIndex + pageSize);

  const totalAmount = useMemo(
    () => filteredRefunds.reduce((sum, r) => sum + parseFloat(r.amount), 0),
    [filteredRefunds]
  );

  const handleOpenDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setIsDetailsOpen(true);
  };

  const getStatusStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case 'approved': return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
      case 'in_review': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';
      default: return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">Error loading refunds: {error.message}</div>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Refund Claims"
        description="Manage and process customer refund requests."
      />

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <LayoutDashboard className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="table" className="flex items-center gap-2">
            <Table2 className="h-4 w-4" />
            Refunds Table
          </TabsTrigger>
        </TabsList>

        {/* ── OVERVIEW TAB ────────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6">
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {STAT_CONFIGS.map(({ key, label, icon: Icon, color, bg }) => (
              <Card key={key} className="overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                  <CardTitle className="text-xs font-medium text-muted-foreground">{label}</CardTitle>
                  <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${bg}`}>
                    <Icon className={`h-4 w-4 ${color}`} />
                  </div>
                </CardHeader>
                <CardContent className="px-4 pb-4">
                  <div className="text-2xl font-bold">
                    {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : statValues[key]}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Total Refunded card */}
            <Card className="overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 pt-4 px-4">
                <CardTitle className="text-xs font-medium text-muted-foreground">Total Refunded</CardTitle>
                <div className="h-8 w-8 rounded-lg flex items-center justify-center bg-emerald-50 dark:bg-emerald-950/40">
                  <Banknote className="h-4 w-4 text-emerald-500" />
                </div>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="text-xl font-bold leading-tight">
                  {isLoading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    formatCurrency(stats.totalRefunded)
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">Approved &amp; paid</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts row: pie + area */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-1">
              <RefundsStatusChart refunds={refunds} isLoading={isLoading} />
            </div>
            <div className="lg:col-span-2">
              <RefundsOverTimeChart refunds={refunds} isLoading={isLoading} />
            </div>
          </div>

          {/* Amount chart (full width) */}
          <RefundsAmountChart
            refunds={refunds}
            isLoading={isLoading}
            formatCurrency={formatCurrency}
          />
        </TabsContent>

        {/* ── TABLE TAB ───────────────────────────────────────────────────── */}
        <TabsContent value="table" className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search refunds..."
                className="pl-8"
                value={searchTerm}
                onChange={e => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Button variant="outline" className="flex items-center gap-2">
              <Filter className="h-4 w-4" /> Filter
            </Button>
          </div>

          <Card>
            {isLoading ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Refund ID</TableHead>
                      <TableHead>Order ID</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Payment Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {currentRefunds.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="h-24 text-center">
                          No refunds found.
                        </TableCell>
                      </TableRow>
                    ) : (
                      currentRefunds.map(refund => (
                        <TableRow key={refund.id}>
                          <TableCell className="font-medium">{refund.id.slice(0, 8)}</TableCell>
                          <TableCell>{refund.order_id.slice(0, 8)}</TableCell>
                          <TableCell>{formatCurrency(refund.amount)}</TableCell>
                          <TableCell>{format(new Date(refund.created_at), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(refund.status)}`}
                            >
                              {refund.status}
                            </span>
                          </TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${refund.paid
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300'
                                }`}
                            >
                              {refund.paid ? 'Paid' : 'Pending'}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleOpenDetails(refund)}
                            >
                              Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>

                <div className="p-4 border-t">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-muted-foreground">
                      Total Amount (filtered):{' '}
                      <span className="font-medium">{formatCurrency(totalAmount.toString())}</span>
                    </div>
                    <Pagination
                      currentPage={currentPage}
                      totalPages={totalPages}
                      pageSize={pageSize}
                      onPageChange={setCurrentPage}
                      onPageSizeChange={size => {
                        setPageSize(size);
                        setCurrentPage(1);
                      }}
                      totalItems={totalItems}
                    />
                  </div>
                </div>
              </>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      <RefundDetailsSheet
        refund={selectedRefund}
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </AdminLayout>
  );
};

export default Refunds;
