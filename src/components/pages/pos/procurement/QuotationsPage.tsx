'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Search, Plus, FileText, Eye, MoreHorizontal, Calendar, ArrowRight, Building2 } from 'lucide-react';
import { format } from 'date-fns';
import { DUMMY_QUOTATIONS, DUMMY_SUPPLIERS } from '@/lib/data/dummy-procurement';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { CreateRfqDialog } from './CreateRfqDialog';

export default function QuotationsPage() {
    const { data: systemConfig } = useSystemConfig();
    const currency = systemConfig?.currency || '$';

    const [searchQuery, setSearchQuery] = useState('');

    const getSupplierName = (supplierId: string) => {
        return DUMMY_SUPPLIERS.find(s => s.id === supplierId)?.name || 'Unknown Supplier';
    };

    const filteredQuotations = DUMMY_QUOTATIONS.filter(quote =>
        quote.rfqNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        getSupplierName(quote.supplierId).toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">Quotations (RFQ)</h2>
                    <p className="text-muted-foreground mt-2">
                        Manage your Requests for Quotation and supplier bids.
                    </p>
                </div>
                <CreateRfqDialog>
                    <Button className="sm:w-auto h-11 px-8 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all hover:-translate-y-0.5" size="lg">
                        <Plus className="w-5 h-5 mr-2" />
                        Create RFQ
                    </Button>
                </CreateRfqDialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Total RFQs</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {DUMMY_QUOTATIONS.length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-2 shrink-0">
                                <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Pending Approval</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {DUMMY_QUOTATIONS.filter(q => q.status === 'Sent' || q.status === 'Received').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ml-2 shrink-0">
                                <Eye className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Approved</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {DUMMY_QUOTATIONS.filter(q => q.status === 'Accepted').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 ml-2 shrink-0">
                                <ArrowRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-muted-foreground">Rejected</p>
                                <h3 className="text-2xl font-bold mt-1 truncate">
                                    {DUMMY_QUOTATIONS.filter(q => q.status === 'Rejected').length}
                                </h3>
                            </div>
                            <div className="p-3 rounded-full bg-rose-100 dark:bg-rose-900/30 ml-2 shrink-0">
                                <FileText className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader className="bg-muted/50 border-b pb-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="relative w-full sm:max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search RFQ number or supplier..."
                                className="pl-9 bg-background"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="rounded-md overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[180px]">RFQ Number</TableHead>
                                    <TableHead>Supplier</TableHead>
                                    <TableHead>Date Created</TableHead>
                                    <TableHead className="text-center">Total Items</TableHead>
                                    <TableHead className="text-right">Estimated Total</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredQuotations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={8} className="h-32 text-center text-muted-foreground">
                                            No quotations found matching your selection.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredQuotations.map((quote) => (
                                        <TableRow key={quote.id}>
                                            <TableCell className="font-medium">
                                                {quote.rfqNumber}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 className="w-4 h-4 text-muted-foreground" />
                                                    <span>{getSupplierName(quote.supplierId)}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center text-muted-foreground text-sm">
                                                    <Calendar className="mr-2 h-3.5 w-3.5" />
                                                    {format(new Date(quote.dateRequested), 'MMM dd, yyyy')}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="secondary">{quote.items.length}</Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-medium">
                                                {quote.totalAmount ? `${currency}${quote.totalAmount.toFixed(2)}` : 'Pending'}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant={
                                                    quote.status === 'Accepted' ? 'default' :
                                                        quote.status === 'Received' ? 'secondary' :
                                                            quote.status === 'Sent' ? 'outline' :
                                                                quote.status === 'Rejected' ? 'destructive' :
                                                                    'secondary'
                                                } className={quote.status === 'Draft' ? 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-transparent shadow-none' : ''}>
                                                    {quote.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <Link href={`/pos/procurement/quotations/${quote.id}`}>
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                                        >
                                                            View
                                                        </Button>
                                                    </Link>
                                                    {quote.status !== 'Accepted' && quote.status !== 'Rejected' && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                        >
                                                            Approve
                                                        </Button>
                                                    )}
                                                    {quote.status === 'Accepted' && (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                        >
                                                            Create PO
                                                        </Button>
                                                    )}
                                                </div>
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
    );
}
