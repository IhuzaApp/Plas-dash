'use client';

import React, { useState, useMemo } from 'react';
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
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Building2,
  Search,
  Plus,
  Edit,
  Trash2,
  Mail,
  Phone,
  Eye,
  DollarSign,
  Users,
  CreditCard,
  FileText,
} from 'lucide-react';
import { DUMMY_SUPPLIERS, Supplier } from '@/lib/data/dummy-procurement';
import { useRouter } from 'next/navigation';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { usePrivilege } from '@/hooks/usePrivilege';
import { formatCurrency } from '@/lib/utils';

export default function SuppliersPage() {
  const router = useRouter();
  const { data: config } = useSystemConfig();
  const { hasAction } = usePrivilege();
  const currency = config?.currency || 'RWF';
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  const ITEMS_PER_PAGE = 10;

  const formatMoney = (amount: number) => {
    return formatCurrency(amount);
  };

  // Filter suppliers
  const filteredSuppliers = useMemo(() => {
    let result = DUMMY_SUPPLIERS;

    if (statusFilter !== 'All') {
      result = result.filter(s => s.status === statusFilter);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        supplier =>
          supplier.name.toLowerCase().includes(query) ||
          supplier.contactPerson.toLowerCase().includes(query) ||
          supplier.id.toLowerCase().includes(query) ||
          supplier.email.toLowerCase().includes(query)
      );
    }

    return result;
  }, [searchQuery, statusFilter]);

  // Pagination
  const totalPages = Math.ceil(filteredSuppliers.length / ITEMS_PER_PAGE);
  const paginatedSuppliers = filteredSuppliers.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Summary stats
  const totalSuppliers = DUMMY_SUPPLIERS.length;
  const activeSuppliers = DUMMY_SUPPLIERS.filter(s => s.status === 'Active').length;
  const onCreditSuppliers = DUMMY_SUPPLIERS.filter(
    s => s.outstandingBalance > 0 || s.paymentTerms !== 'Cash'
  ).length;
  const pendingPayments = DUMMY_SUPPLIERS.reduce((sum, s) => sum + s.outstandingBalance, 0);

  const handleEditClick = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsAddModalOpen(true);
  };

  const handleViewClick = (supplier: Supplier) => {
    router.push(`/pos/procurement/suppliers/${supplier.id}`);
  };

  const handleAddNew = () => {
    setSelectedSupplier(null);
    setIsAddModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Suppliers</h2>
          <p className="text-muted-foreground mt-2">
            Manage your supplier network and account balances.
          </p>
        </div>
        {hasAction('procurement', 'manage_suppliers') && (
          <Button
            onClick={handleAddNew}
            className="sm:w-auto h-11 px-8 rounded-full shadow-md bg-primary hover:bg-primary/90 transition-all hover:-translate-y-0.5"
            size="lg"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Supplier
          </Button>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Total Suppliers</p>
                <h3 className="text-2xl font-bold mt-1 truncate">{totalSuppliers}</h3>
              </div>
              <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/30 ml-2 shrink-0">
                <Building2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <h3 className="text-2xl font-bold mt-1 truncate">{activeSuppliers}</h3>
              </div>
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30 ml-2 shrink-0">
                <Users className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">On Credit</p>
                <h3 className="text-2xl font-bold mt-1 truncate">{onCreditSuppliers}</h3>
              </div>
              <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/30 ml-2 shrink-0">
                <CreditCard className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-muted-foreground">Pending Payments</p>
                <h3 className="text-2xl font-bold mt-1 truncate text-destructive">
                  {formatMoney(pendingPayments)}
                </h3>
              </div>
              <div className="p-3 rounded-full bg-destructive/10 ml-2 shrink-0">
                <DollarSign className="w-5 h-5 text-destructive" />
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
                placeholder="Search suppliers..."
                className="pl-9 bg-background"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Select
                value={statusFilter}
                onValueChange={val => {
                  setStatusFilter(val);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[140px] bg-background">
                  <SelectValue placeholder="Filter Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">All Statuses</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Badge variant="outline" className="px-3 py-1 bg-background">
                {filteredSuppliers.length} Total
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="rounded-md overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[100px]">ID</TableHead>
                  <TableHead className="min-w-[200px]">Supplier Name</TableHead>
                  <TableHead className="hidden md:table-cell">Contact</TableHead>
                  <TableHead className="hidden lg:table-cell">Payment Terms</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedSuppliers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-48 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center space-y-3">
                        <Building2 className="w-10 h-10 text-slate-300" />
                        <p>No suppliers found matching your filters.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedSuppliers.map(supplier => (
                    <TableRow key={supplier.id} className="group">
                      <TableCell className="font-medium text-slate-500">{supplier.id}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary flex-shrink-0 group-hover:bg-primary group-hover:text-white transition-colors">
                            <span className="font-bold text-sm tracking-widest">
                              {supplier.name.substring(0, 2).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">{supplier.name}</div>
                            {supplier.companyName && supplier.companyName !== supplier.name && (
                              <div className="text-xs text-muted-foreground">
                                {supplier.companyName}
                              </div>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <div className="text-sm space-y-1">
                          <div className="font-medium text-slate-700">{supplier.contactPerson}</div>
                          <div className="text-slate-500 flex items-center gap-1.5 text-xs">
                            <Mail className="w-3 h-3" /> {supplier.email}
                          </div>
                          <div className="text-slate-500 flex items-center gap-1.5 text-xs">
                            <Phone className="w-3 h-3" /> {supplier.phone}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden lg:table-cell">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <FileText className="w-4 h-4 text-slate-400" />
                          {supplier.paymentTerms}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div
                          className={`font-medium ${supplier.outstandingBalance > 0 ? 'text-rose-600' : 'text-slate-600'}`}
                        >
                          {formatMoney(supplier.outstandingBalance)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            supplier.status === 'Active'
                              ? 'default'
                              : supplier.status === 'Inactive'
                                ? 'secondary'
                                : 'outline'
                          }
                          className={
                            supplier.status === 'Active'
                              ? 'bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 border-0'
                              : supplier.status === 'Pending'
                                ? 'bg-amber-500/10 text-amber-700 hover:bg-amber-500/20 border-0'
                                : ''
                          }
                        >
                          {supplier.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            onClick={() => handleViewClick(supplier)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          {hasAction('procurement', 'manage_suppliers') && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-slate-900"
                                onClick={() => handleEditClick(supplier)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-slate-500 hover:text-destructive hover:bg-rose-50"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                        </div>
                        {/* Fallback for touch devices where hover isn't present */}
                        <div className="flex items-center justify-end gap-1 md:hidden">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-blue-600"
                            onClick={() => handleViewClick(supplier)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t bg-slate-50/50">
              <div className="text-sm text-slate-500">
                Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{' '}
                {Math.min(currentPage * ITEMS_PER_PAGE, filteredSuppliers.length)} of{' '}
                {filteredSuppliers.length} entries
              </div>
              <div className="flex gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="h-8"
                >
                  Previous
                </Button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <Button
                    key={i}
                    variant={currentPage === i + 1 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setCurrentPage(i + 1)}
                    className="h-8 w-8"
                  >
                    {i + 1}
                  </Button>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className="h-8"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Modal */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {selectedSupplier ? 'Edit Supplier' : 'Add New Supplier'}
            </DialogTitle>
            <DialogDescription>
              {selectedSupplier
                ? 'Update the details for this supplier below.'
                : 'Enter the complete details of the new supplier.'}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Basic Information</h4>

                <div className="space-y-2">
                  <Label htmlFor="name">
                    Display Name <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="name"
                    defaultValue={selectedSupplier?.name}
                    placeholder="e.g. FreshFarm"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="companyName">Full Company Name</Label>
                  <Input
                    id="companyName"
                    defaultValue={selectedSupplier?.companyName || selectedSupplier?.name}
                    placeholder="e.g. FreshFarm Produce Co."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">
                    Supplier Category <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="category"
                    defaultValue={selectedSupplier?.category}
                    placeholder="e.g. Produce, Dairy"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="taxId">Tax ID / Registration No.</Label>
                  <Input
                    id="taxId"
                    defaultValue={selectedSupplier?.taxId}
                    placeholder="e.g. TX-12345"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="space-y-4">
                <h4 className="text-sm font-medium border-b pb-2">Contact Information</h4>

                <div className="space-y-2">
                  <Label htmlFor="contact">
                    Contact Person <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="contact"
                    defaultValue={selectedSupplier?.contactPerson}
                    placeholder="Full Name"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    Email Address <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    defaultValue={selectedSupplier?.email}
                    placeholder="email@company.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    Phone Number <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    defaultValue={selectedSupplier?.phone}
                    placeholder="+1 555-0100"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="address">Physical Address</Label>
                  <Input
                    id="address"
                    defaultValue={selectedSupplier?.address}
                    placeholder="Street, City, Zip"
                  />
                </div>
              </div>

              {/* Financial & Terms */}
              <div className="space-y-4 md:col-span-2">
                <h4 className="text-sm font-medium border-b pb-2">Financial & Terms</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="paymentTerms">
                      Payment Terms <span className="text-destructive">*</span>
                    </Label>
                    <Select defaultValue={selectedSupplier?.paymentTerms || 'Cash'}>
                      <SelectTrigger id="paymentTerms">
                        <SelectValue placeholder="Select terms" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Cash">Cash (C.O.D)</SelectItem>
                        <SelectItem value="30 Days">Net 30 Days</SelectItem>
                        <SelectItem value="60 Days">Net 60 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="creditLimit">Credit Limit ({currency})</Label>
                    <Input
                      id="creditLimit"
                      type="number"
                      defaultValue={selectedSupplier?.creditLimit || 0}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="notes">Internal Notes</Label>
                    <Input
                      id="notes"
                      defaultValue={selectedSupplier?.notes}
                      placeholder="Additional info..."
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" onClick={() => setIsAddModalOpen(false)}>
              {selectedSupplier ? 'Save Changes' : 'Create Supplier'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
