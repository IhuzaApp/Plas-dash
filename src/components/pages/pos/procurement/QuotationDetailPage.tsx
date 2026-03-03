'use client';

import React, { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ArrowLeft,
  Building2,
  Calendar,
  Mail,
  Phone,
  MapPin,
  CheckCircle,
  FileText,
  ShoppingCart,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { DUMMY_QUOTATIONS, DUMMY_SUPPLIERS, DUMMY_PRODUCTS } from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { usePrivilege } from '@/hooks/usePrivilege';

interface QuotationDetailPageProps {
  quotationId: string;
}

export default function QuotationDetailPage({ quotationId }: QuotationDetailPageProps) {
  const router = useRouter();
  const { data: systemConfig } = useSystemConfig();
  const { hasAction } = usePrivilege();
  const currency = systemConfig?.currency || '$';

  const quotation = useMemo(() => DUMMY_QUOTATIONS.find(q => q.id === quotationId), [quotationId]);
  const supplier = useMemo(
    () => DUMMY_SUPPLIERS.find(s => s.id === quotation?.supplierId),
    [quotation]
  );

  if (!quotation || !supplier) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <FileText className="w-16 h-16 text-muted-foreground/50" />
        <h2 className="text-2xl font-bold">Quotation Not Found</h2>
        <p className="text-muted-foreground text-center">
          The requested RFQ could not be found. It may have been deleted.
        </p>
        <Button onClick={() => router.back()} variant="outline" className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" /> Go Back
        </Button>
      </div>
    );
  }

  // Enhance quote items with product details
  const enhancedItems = quotation.items.map(item => {
    const product = DUMMY_PRODUCTS.find(p => p.id === item.productId);
    const unitPrice = item.unitPrice || product?.unitPrice || 0;
    return {
      ...item,
      productName: product?.name || 'Unknown Product',
      sku: product?.sku || 'N/A',
      stockUnit: product?.stockUnit || 'unit',
      unitPrice,
      subtotal: unitPrice * item.quantity,
    };
  });

  const subtotal = enhancedItems.reduce((sum, item) => sum + item.subtotal, 0);
  const tax = subtotal * 0.1; // Mock 10% tax
  const total = subtotal + tax;

  // Mock comparison data - compare this supplier's price vs market average
  const comparisonData = enhancedItems.map(item => {
    // Generate a mock market average that is usually slightly higher or lower
    const marketAvg = item.unitPrice * (1 + (Math.random() * 0.3 - 0.1));
    return {
      name: item.productName.substring(0, 15) + '...',
      [supplier.name]: item.unitPrice,
      'Market Average': Number(marketAvg.toFixed(2)),
    };
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push('/pos/procurement/quotations')}
            className="shrink-0"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {quotation.rfqNumber}
              </h2>
              <Badge
                variant={
                  quotation.status === 'Accepted'
                    ? 'default'
                    : quotation.status === 'Received'
                      ? 'secondary'
                      : quotation.status === 'Sent'
                        ? 'outline'
                        : quotation.status === 'Rejected'
                          ? 'destructive'
                          : 'secondary'
                }
                className="text-sm px-3 py-1"
              >
                {quotation.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Requested on {format(new Date(quotation.dateRequested), 'MMMM dd, yyyy')} • Valid
              until {format(new Date(quotation.dateValidUntil), 'MMMM dd, yyyy')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {quotation.status !== 'Accepted' &&
            quotation.status !== 'Rejected' &&
            hasAction('procurement', 'manage_quotations') && (
              <>
                <Button
                  variant="outline"
                  className="w-full sm:w-auto text-destructive hover:bg-destructive/10"
                >
                  Reject
                </Button>
                <Button className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve Quote
                </Button>
              </>
            )}
          {quotation.status === 'Accepted' &&
            hasAction('procurement', 'manage_purchase_orders') && (
              <Button className="w-full sm:w-auto">
                <ShoppingCart className="w-4 h-4 mr-2" />
                Convert to PO
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Supplier Info */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="bg-muted/30 border-b">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Supplier Information
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div>
              <h3 className="font-bold text-lg">{supplier.name}</h3>
              {supplier.companyName && supplier.companyName !== supplier.name && (
                <p className="text-sm text-muted-foreground">{supplier.companyName}</p>
              )}
            </div>
            <div className="space-y-3">
              <div className="flex items-start gap-3 text-sm">
                <FileText className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Contact Person</p>
                  <p className="text-muted-foreground">{supplier.contactPerson}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Email Address</p>
                  <p className="text-muted-foreground">{supplier.email}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Phone Number</p>
                  <p className="text-muted-foreground">{supplier.phone}</p>
                </div>
              </div>
              <div className="flex items-start gap-3 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Address</p>
                  <p className="text-muted-foreground">{supplier.address || 'N/A'}</p>
                </div>
              </div>
            </div>

            {quotation.notes && (
              <div className="pt-4 mt-4 border-t">
                <h4 className="text-sm font-medium mb-2">Quote Notes</h4>
                <p className="text-sm text-muted-foreground bg-muted p-3 rounded-md italic">
                  &quot;{quotation.notes}&quot;
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="lg:col-span-2 space-y-6">
          {/* Products Table */}
          <Card className="shadow-sm">
            <CardHeader className="bg-muted/30 border-b">
              <CardTitle className="text-lg">Quoted Items</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product / SKU</TableHead>
                      <TableHead className="text-right">Quantity</TableHead>
                      <TableHead className="text-right">Unit Price</TableHead>
                      <TableHead className="text-right font-semibold">Subtotal</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {enhancedItems.map((item, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="font-medium">{item.productName}</div>
                          <div className="text-xs text-muted-foreground">SKU: {item.sku}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {item.quantity}{' '}
                          <span className="text-muted-foreground text-xs">{item.stockUnit}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          {currency}
                          {item.unitPrice.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right font-medium text-slate-900 dark:text-slate-100">
                          {currency}
                          {item.subtotal.toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Cost Summary Section inside the card */}
              <div className="p-4 sm:p-6 bg-muted/10 border-t flex flex-col items-end">
                <div className="w-full sm:w-1/2 md:w-1/3 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium">
                      {currency}
                      {subtotal.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-muted-foreground">Estimated Tax (10%)</span>
                    <span className="font-medium">
                      {currency}
                      {tax.toFixed(2)}
                    </span>
                  </div>
                  <div className="h-px bg-border my-2" />
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total Cost</span>
                    <span className="text-primary">
                      {currency}
                      {total.toFixed(2)}
                    </span>
                  </div>

                  {/* Cost Saving insight */}
                  {quotation.status === 'Received' && (
                    <div className="mt-4 p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 rounded-md text-sm flex items-start gap-2">
                      <TrendingDown className="w-4 h-4 mt-0.5 shrink-0" />
                      <p>
                        This quote is approximately <strong>8% below</strong> the median market rate
                        for these items.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comparison Chart */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg">Price Comparison</CardTitle>
              <CardDescription>Supplier quote vs estimated market average</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={comparisonData}
                    margin={{ top: 10, right: 10, left: 10, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      dy={10}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: '#64748b' }}
                      tickFormatter={value => `${currency}${value}`}
                    />
                    <Tooltip
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{
                        borderRadius: '8px',
                        border: 'none',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                      }}
                      formatter={(value: number) => [`${currency}${value.toFixed(2)}`, undefined]}
                    />
                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar
                      dataKey={supplier.name}
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                    <Bar
                      dataKey="Market Average"
                      fill="#94a3b8"
                      radius={[4, 4, 0, 0]}
                      maxBarSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
