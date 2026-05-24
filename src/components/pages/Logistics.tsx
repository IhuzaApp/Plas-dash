import React, { useState } from 'react';
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
import { Search, Filter, Loader2, Truck } from 'lucide-react';
import { useLogisticsAccounts } from '@/hooks/useHasuraApi';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/pagination';
import { useRouter } from 'next/navigation';
import { usePageLoading } from '@/hooks/usePageLoading';

const Logistics = () => {
  const { data, isLoading, isError, error } = useLogisticsAccounts();
  const accounts = data?.logisticsAccount || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const router = useRouter();
  const { startLoading } = usePageLoading();

  const handleViewDetails = (id: string) => {
    startLoading();
    router.push(`/logistics/${id}`);
  };

  // Filter accounts based on search term
  const filteredAccounts = accounts.filter(
    (acc: any) =>
      searchTerm === '' ||
      (acc.fullname ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.businessName ?? '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (acc.type ?? '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalItems = filteredAccounts.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentAccounts = filteredAccounts.slice(startIndex, startIndex + pageSize);

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
        <div className="flex flex-col items-center justify-center h-[calc(100vh-4rem)] text-center p-4">
          <p className="text-destructive font-medium">Error loading logistics partners.</p>
          {error && <p className="text-sm text-muted-foreground mt-2">{error.message}</p>}
          <Button variant="outline" className="mt-4" onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader
        title="Logistics Partners"
        description="Manage logistics companies and their fleet assignments."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-emerald-600">{accounts.length}</div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-1">
              Total Partners
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/5 border-green-500/20">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-green-600">
              {accounts.filter((a: any) => !a.disabled).length}
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-1">
              Active Accounts
            </p>
          </CardContent>
        </Card>
        <Card className="bg-emerald-500/5 border-emerald-500/20">
          <CardContent className="pt-6 text-center">
            <div className="text-3xl font-bold text-emerald-600">
              {accounts.reduce(
                (acc: number, curr: any) => acc + (curr.RentalVehicles?.length || 0),
                0
              )}
            </div>
            <p className="text-sm text-muted-foreground uppercase tracking-wider font-medium mt-1">
              Total Fleet Vehicles
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, business or type..."
              className="pl-10"
              value={searchTerm}
              onChange={e => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <Button variant="outline" className="gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        <Card className="border-none shadow-md overflow-hidden">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead className="font-bold">Partner Name</TableHead>
                  <TableHead className="font-bold">Business Name</TableHead>
                  <TableHead className="font-bold">Type</TableHead>
                  <TableHead className="font-bold text-center">Fleet Size</TableHead>
                  <TableHead className="font-bold">Status</TableHead>
                  <TableHead className="text-right font-bold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {currentAccounts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                      No logistics partners found.
                    </TableCell>
                  </TableRow>
                ) : (
                  currentAccounts.map((acc: any) => (
                    <TableRow key={acc.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell className="font-semibold">{acc.fullname}</TableCell>
                      <TableCell>{acc.businessName || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize bg-muted/50">
                          {acc.type || 'Standard'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Truck className="h-4 w-4 text-primary/70" />
                          <span className="font-mono font-medium">
                            {acc.RentalVehicles?.length || 0}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={acc.disabled ? 'destructive' : 'default'}
                          className={!acc.disabled ? 'bg-green-500 hover:bg-green-600' : ''}
                        >
                          {acc.disabled ? 'Disabled' : 'Active'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="hover:bg-primary hover:text-white transition-all"
                          onClick={() => handleViewDetails(acc.id)}
                        >
                          View Profile
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
          {totalItems > pageSize && (
            <div className="p-4 border-t">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                pageSize={pageSize}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
                totalItems={totalItems}
              />
            </div>
          )}
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Logistics;
