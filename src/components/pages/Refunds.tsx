import React, { useMemo, useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Filter, Loader2 } from "lucide-react";
import { useRefunds, useSystemConfig } from "@/hooks/useHasuraApi";
import { format } from "date-fns";
import RefundDetailsSheet from "@/components/drawers/RefundDetailsSheet";
import type { Refund } from "@/hooks/useGraphql";
import Pagination from "@/components/ui/pagination";

const Refunds = () => {
  const { data, isLoading, error } = useRefunds();
  const { data: systemConfig } = useSystemConfig();
  const refunds = data?.Refunds || [];
  const [selectedRefund, setSelectedRefund] = useState<Refund | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  // Calculate statistics for the cards
  const stats = useMemo(() => {
    const pending = refunds.filter(r => r.status.toLowerCase() === 'pending').length;
    const inReview = refunds.filter(r => r.status.toLowerCase() === 'in_review').length;
    const approved = refunds.filter(r => r.status.toLowerCase() === 'approved').length;
    const rejected = refunds.filter(r => r.status.toLowerCase() === 'rejected').length;
    const totalRefunded = refunds
      .filter(r => r.status.toLowerCase() === 'approved' && r.paid)
      .reduce((sum, r) => sum + parseFloat(r.amount), 0);

    return {
      pending,
      inReview,
      approved,
      rejected,
      totalRefunded: totalRefunded.toFixed(2)
    };
  }, [refunds]);

  // Filter refunds based on search term
  const filteredRefunds = refunds.filter(refund => 
    searchTerm === "" || 
    refund.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.order_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.status.toLowerCase().includes(searchTerm.toLowerCase()) ||
    refund.reason.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredRefunds.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentRefunds = filteredRefunds.slice(startIndex, endIndex);

  // Calculate total amount for all refunds
  const totalAmount = useMemo(() => {
    return filteredRefunds.reduce((sum, refund) => sum + parseFloat(refund.amount), 0);
  }, [filteredRefunds]);

  const handleOpenDetails = (refund: Refund) => {
    setSelectedRefund(refund);
    setIsDetailsOpen(true);
  };

  const getStatusStyle = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  if (error) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center text-red-600">
            Error loading refunds: {error.message}
          </div>
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
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.pending}</div>
            <p className="text-muted-foreground">Pending Refunds</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.inReview}</div>
            <p className="text-muted-foreground">In Review</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.approved}</div>
            <p className="text-muted-foreground">Approved This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : stats.rejected}</div>
            <p className="text-muted-foreground">Rejected This Month</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">
              {isLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : formatCurrency(stats.totalRefunded)}
            </div>
            <p className="text-muted-foreground">Total Refunded</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search refunds..." 
              className="pl-8" 
              value={searchTerm}
              onChange={(e) => {
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
                    currentRefunds.map((refund) => (
                      <TableRow key={refund.id}>
                        <TableCell className="font-medium">{refund.id.slice(0, 8)}</TableCell>
                        <TableCell>{refund.order_id.slice(0, 8)}</TableCell>
                        <TableCell>{formatCurrency(refund.amount)}</TableCell>
                        <TableCell>{format(new Date(refund.created_at), 'MMM dd, yyyy')}</TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusStyle(refund.status)}`}>
                            {refund.status}
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            refund.paid ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"
                          }`}>
                            {refund.paid ? "Paid" : "Pending"}
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
                    Total Amount (All Refunds): <span className="font-medium">{formatCurrency(totalAmount.toString())}</span>
                  </div>
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    pageSize={pageSize}
                    onPageChange={setCurrentPage}
                    onPageSizeChange={(size) => {
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
      </div>

      <RefundDetailsSheet
        refund={selectedRefund}
        open={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
      />
    </AdminLayout>
  );
};

export default Refunds;
