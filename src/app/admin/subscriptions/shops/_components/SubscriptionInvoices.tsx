'use client';

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { apiGet } from '@/lib/api';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { FileText, Download, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InvoiceGenerator } from '@/modules/subscriptions/utils/invoiceGenerator';
import Pagination from '@/components/ui/pagination';

export interface SubscriptionInvoice {
    id: string;
    invoice_number: string;
    issued_at: string;
    due_date: string;
    paid_at: string | null;
    status: string;
    currency: string;
    plan_name: string;
    plan_price: string;
    subtotal_amount: string;
    tax_amount: string;
    discount_amount: string;
    payment_method: string | null;
    is_overdue: boolean;
    shop_subscription?: {
        Shop?: { id: string, name: string };
        Restaurant?: { id: string, name: string };
        business_account?: { id: string, business_name: string };
    };
}

interface SubscriptionInvoicesProps {
    invoices?: SubscriptionInvoice[];
    isLoading?: boolean;
}

export function SubscriptionInvoices({ invoices: initialInvoices, isLoading: parentLoading }: SubscriptionInvoicesProps) {
    const { data, isLoading: queryLoading } = useQuery<{ subscription_invoices: SubscriptionInvoice[] }>({
        queryKey: ['subscription-invoices'],
        queryFn: () => apiGet<{ subscription_invoices: SubscriptionInvoice[] }>('/api/queries/subscription-invoices'),
        enabled: !initialInvoices,
    });

    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);

    const isLoading = parentLoading || queryLoading;
    const invoices = initialInvoices || data?.subscription_invoices || [];

    const paginatedInvoices = useMemo(() => {
        const start = (currentPage - 1) * pageSize;
        return invoices.slice(start, start + pageSize);
    }, [invoices, currentPage, pageSize]);

    const totalPages = Math.ceil(invoices.length / pageSize);

    const formatCurrency = (amount: string | number, currency: string) => {
        const num = typeof amount === 'string' ? parseFloat(amount) : amount;
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency || 'RWF',
            minimumFractionDigits: 0,
        }).format(num);
    };

    const getStatusVariant = (status: string) => {
        switch (status?.toLowerCase()) {
            case 'paid': return 'default';
            case 'pending': return 'secondary';
            case 'overdue': return 'destructive';
            case 'cancelled': return 'outline';
            default: return 'secondary';
        }
    };

    if (isLoading) {
        return (
            <div className="rounded-md border bg-card p-8 flex justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary" />
            </div>
        );
    }


    return (
        <div className="space-y-4">
            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Invoice #</TableHead>
                            <TableHead>Entity</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Amount to Pay</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Due Date</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoices.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                                    No invoices found.
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedInvoices.map((invoice) => {
                                const subtotal = parseFloat(invoice.subtotal_amount || '0');
                                const tax = parseFloat(invoice.tax_amount || '0');
                                const discount = parseFloat(invoice.discount_amount || '0');
                                const total = subtotal + tax - discount;

                                return (
                                    <TableRow key={invoice.id}>
                                        <TableCell className="font-medium font-mono text-xs">
                                            {invoice.invoice_number}
                                        </TableCell>
                                        <TableCell>
                                            <span className="text-sm">
                                                {invoice.shop_subscription?.Shop?.name ||
                                                    invoice.shop_subscription?.Restaurant?.name ||
                                                    invoice.shop_subscription?.business_account?.business_name ||
                                                    'Unknown Entity'}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-medium">{invoice.plan_name}</span>
                                                <span className="text-[10px] text-muted-foreground capitalize">
                                                    {invoice.payment_method?.replace(/_/g, ' ') || 'N/A'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-bold text-primary">
                                                    {formatCurrency(total, invoice.currency)}
                                                </span>
                                                {tax > 0 && (
                                                    <span className="text-[10px] text-muted-foreground">
                                                        Incl. {formatCurrency(tax, invoice.currency)} tax
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {format(new Date(invoice.issued_at), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell className="text-xs">
                                            {format(new Date(invoice.due_date), 'MMM d, yyyy')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(invoice.status)}>
                                                {invoice.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="View PDF"
                                                    onClick={() => InvoiceGenerator.generate({
                                                        invoice_number: invoice.invoice_number,
                                                        issued_at: invoice.issued_at,
                                                        due_date: invoice.due_date,
                                                        plan_name: invoice.plan_name,
                                                        subtotal_amount: invoice.subtotal_amount,
                                                        tax_amount: invoice.tax_amount,
                                                        discount_amount: invoice.discount_amount,
                                                        currency: invoice.currency,
                                                        status: invoice.status,
                                                        entity_name: invoice.shop_subscription?.Shop?.name ||
                                                            invoice.shop_subscription?.Restaurant?.name ||
                                                            invoice.shop_subscription?.business_account?.business_name ||
                                                            'Unknown Entity',
                                                        entity_id: invoice.shop_subscription?.Shop?.id ||
                                                            invoice.shop_subscription?.Restaurant?.id ||
                                                            invoice.shop_subscription?.business_account?.id ||
                                                            'N/A'
                                                    }, 'view')}
                                                >
                                                    <FileText className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    title="Download PDF"
                                                    onClick={() => InvoiceGenerator.generate({
                                                        invoice_number: invoice.invoice_number,
                                                        issued_at: invoice.issued_at,
                                                        due_date: invoice.due_date,
                                                        plan_name: invoice.plan_name,
                                                        subtotal_amount: invoice.subtotal_amount,
                                                        tax_amount: invoice.tax_amount,
                                                        discount_amount: invoice.discount_amount,
                                                        currency: invoice.currency,
                                                        status: invoice.status,
                                                        entity_name: invoice.shop_subscription?.Shop?.name ||
                                                            invoice.shop_subscription?.Restaurant?.name ||
                                                            invoice.shop_subscription?.business_account?.business_name ||
                                                            'Unknown Entity',
                                                        entity_id: invoice.shop_subscription?.Shop?.id ||
                                                            invoice.shop_subscription?.Restaurant?.id ||
                                                            invoice.shop_subscription?.business_account?.id ||
                                                            'N/A'
                                                    }, 'download')}
                                                >
                                                    <Download className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
                {invoices.length > pageSize && (
                    <Pagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        pageSize={pageSize}
                        totalItems={invoices.length}
                        onPageChange={setCurrentPage}
                        onPageSizeChange={setPageSize}
                    />
                )}
            </div>
        </div>
    );
}
