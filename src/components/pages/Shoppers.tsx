import React, { useState } from 'react';
import Link from 'next/link';
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
import { Card, CardContent } from '@/components/ui/card';
import { Search, Filter, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { useShoppers } from '@/hooks/useHasuraApi';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Pagination from '@/components/ui/pagination';
import { usePrivilege } from '@/hooks/usePrivilege';

const Shoppers = () => {
  const { data, isLoading, isError, error } = useShoppers();
  const shoppers = data?.shoppers || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { hasAction } = usePrivilege();

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part[0])
      .join('')
      .toUpperCase();
  };

  const activeShoppers = shoppers.filter(
    s => s.active && (s.status === 'approved' || s.status === 'completed')
  );
  const pendingShoppers = shoppers.filter(s => (s.status ?? '') === 'pending');
  const backgroundCheckedShoppers = shoppers.filter(s => Boolean(s.background_check_completed));

  // Filter shoppers based on search term
  const filteredShoppers = shoppers.filter(
    shopper =>
      searchTerm === '' ||
      (shopper.full_name ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shopper.phone_number ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      shopper.Employment_id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (shopper.transport_mode ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredShoppers.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentShoppers = filteredShoppers.slice(startIndex, endIndex);

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-[calc(100vh-4rem)]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </AdminLayout>
    );
  }

  if (isError) {
    return (
      <AdminLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)]">
          <p className="text-red-500">Error loading plasas.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Plasas"
        description="Manage your delivery personnel and track their performance."
        actions={hasAction('shoppers', 'add_shoppers') && <Button>Add New Plasa</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{shoppers.length}</div>
            <p className="text-muted-foreground">Total Plasas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{activeShoppers.length}</div>
            <p className="text-muted-foreground">Active Plasas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{backgroundCheckedShoppers.length}</div>
            <p className="text-muted-foreground">Background Checked</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingShoppers.length}</div>
            <p className="text-muted-foreground">Pending Approval</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search shoppers..."
              className="pl-8"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1); // Reset to first page on search
              }}
            />
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        <Card>
          <div className="overflow-x-auto">
            <Table className="min-w-[800px]">
              <TableHeader>
                <TableRow>
                  <TableHead className="min-w-[180px]">Shopper</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[100px]">Emp. ID</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[90px]">Transport</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[90px]">Status</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[100px]">Bg Check</TableHead>
                  <TableHead className="whitespace-nowrap min-w-[110px]">Onboarding</TableHead>
                  <TableHead className="text-right min-w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentShoppers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">
                      No plasas found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentShoppers.map(shopper => (
                    <TableRow key={shopper.id}>
                      <TableCell className="min-w-[180px]">
                        <div className="flex items-center gap-3">
                          <Avatar>
                            <AvatarImage src={shopper.profile_photo || undefined} />
                            <AvatarFallback>{getInitials(shopper.full_name)}</AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="font-medium truncate">{shopper.full_name}</div>
                            <div className="text-sm text-muted-foreground truncate">{shopper.phone_number}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-[100px] max-w-[120px]" title={shopper.Employment_id ?? ''}>
                        <span className="block truncate">{shopper.Employment_id ?? '—'}</span>
                      </TableCell>
                      <TableCell className="min-w-[90px] whitespace-nowrap">
                        <span className="capitalize">{shopper.transport_mode ?? '—'}</span>
                      </TableCell>
                      <TableCell className="min-w-[90px]">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            (shopper.status === 'approved' || shopper.status === 'completed') &&
                            shopper.active
                              ? 'bg-green-100 text-green-800'
                              : shopper.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {shopper.status === 'approved' || shopper.status === 'completed'
                            ? shopper.active
                              ? 'Active'
                              : 'Inactive'
                            : shopper.status
                              ? String(shopper.status).charAt(0).toUpperCase() +
                                String(shopper.status).slice(1)
                              : '—'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[100px]">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${
                            shopper.background_check_completed
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {shopper.background_check_completed ? 'Completed' : 'Pending'}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-[110px] max-w-[140px]" title={shopper.onboarding_step ?? ''}>
                        <span className="block truncate capitalize">{shopper.onboarding_step ?? '—'}</span>
                      </TableCell>
                      <TableCell className="text-right min-w-[100px]">
                        {hasAction('shoppers', 'view_shopper_details') && (
                          <Link href={`/shoppers/${shopper.user_id}`}>
                            <Button variant="ghost" size="sm">
                              View Profile
                            </Button>
                          </Link>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1); // Reset to first page when changing page size
            }}
            totalItems={totalItems}
          />
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Shoppers;
