import React, { useState } from "react";
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
import { Search, Filter, Loader2, Phone, AlertCircle } from "lucide-react";
import { useOrders } from "@/hooks/useHasuraApi";
import { format, differenceInMinutes } from "date-fns";
import Pagination from "@/components/ui/pagination";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import OrderDetailsDrawer from "@/components/drawers/OrderDetailsDrawer";
import { Order } from "@/types/order";

const Orders = () => {
  const { data, isLoading, isError, error } = useOrders();
  const orders = data?.Orders || [];
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(num);
  };

  const handleCallShopper = (phone: string) => {
    // In a real app, this would integrate with a calling system
    toast.info(`Calling shopper at ${phone}...`);
  };

  const getOrderWarnings = (order: any) => {
    const warnings = [];
    const timeSinceUpdate = differenceInMinutes(new Date(), new Date(order.updated_at));
    const statusLower = order.status.toLowerCase();

    // Check for unassigned orders (10+ minutes)
    if (!order.shopper_id && timeSinceUpdate > 10) {
      warnings.push({
        type: 'unassigned',
        message: 'Order unassigned for over 10 minutes',
        severity: 'high'
      });
    }

    // Check for long shopping time (60+ minutes)
    if (statusLower === 'shopping' && timeSinceUpdate > 60) {
      warnings.push({
        type: 'shopping',
        message: 'Shopping taking over 60 minutes',
        severity: 'medium'
      });
    }

    // Check for long delivery time (50+ minutes)
    if (statusLower === 'on_the_way' && timeSinceUpdate > 50) {
      warnings.push({
        type: 'delivery',
        message: 'Delivery taking over 50 minutes',
        severity: 'high'
      });
    }

    return warnings;
  };

  const getStatusColor = (order: any) => {
    const statusLower = order.status.toLowerCase();
    const warnings = getOrderWarnings(order);
    
    // If there are any high severity warnings, show red
    if (warnings.some(w => w.severity === 'high')) {
      return 'bg-red-100 text-red-800';
    }
    
    // If there are any medium severity warnings, show orange
    if (warnings.some(w => w.severity === 'medium')) {
      return 'bg-orange-100 text-orange-800';
    }
    
    // Default status colors
    switch (statusLower) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
      case 'accepted':
      case 'picked_up':
      case 'on_the_way':
      case 'shopping':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const pendingOrders = orders.filter(order => 
    order.status === 'PENDING'
  );

  const deliveredOrders = orders.filter(order => 
    order.status.toLowerCase() === 'delivered'
  );

  const inProgressOrders = orders.filter(order => {
    const statusLower = order.status.toLowerCase();
    return order.status !== 'PENDING' && statusLower !== 'delivered';
  });

  const totalRevenue = orders.reduce((acc, order) => acc + parseFloat(order.total), 0);

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => 
    searchTerm === "" || 
    order.OrderID?.toString().includes(searchTerm) ||
    order.User?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.User?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    order.status.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Calculate pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setSelectedOrder(null);
  };

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
          <p className="text-red-500">Error loading orders.</p>
          {error && <p className="text-sm mt-2">{error.message}</p>}
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <PageHeader 
        title="Orders" 
        description="View and manage customer orders."
        actions={
          <div className="flex gap-2">
            <Button variant="outline">Export</Button>
            <Button>Create Order</Button>
          </div>
        }
      />
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{orders.length}</div>
            <p className="text-muted-foreground">Total Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{pendingOrders.length}</div>
            <p className="text-muted-foreground">Pending Orders</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{inProgressOrders.length}</div>
            <p className="text-muted-foreground">In Progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{formatCurrency(totalRevenue.toString())}</div>
            <p className="text-muted-foreground">Total Revenue</p>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search orders..." 
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
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Order ID</TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Items</TableHead>
                <TableHead>Total</TableHead>
                <TableHead>Created</TableHead>
                <TableHead>Last Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentOrders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center text-muted-foreground">
                    No orders found.
                  </TableCell>
                </TableRow>
              ) : (
                currentOrders.map((order) => {
                  const warnings = getOrderWarnings(order);
                  return (
                <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          #{order.OrderID}
                          {warnings.length > 0 && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <AlertCircle className="h-4 w-4 text-red-500" />
                                </TooltipTrigger>
                                <TooltipContent>
                                  <ul className="list-disc pl-4">
                                    {warnings.map((warning, idx) => (
                                      <li key={idx}>{warning.message}</li>
                                    ))}
                                  </ul>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{order.User?.name || 'N/A'}</div>
                        <div className="text-sm text-muted-foreground">{order.User?.email || 'N/A'}</div>
                      </TableCell>
                  <TableCell>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order)}`}>
                      {order.status}
                    </span>
                  </TableCell>
                      <TableCell>{order.Order_Items?.length || 0} items</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>{formatDateTime(order.created_at)}</TableCell>
                      <TableCell>{formatDateTime(order.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {order.shopper_id && (warnings.some(w => w.type === 'shopping' || w.type === 'delivery')) && (
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCallShopper(order.shopper?.phone)}
                            className="text-yellow-600 hover:text-yellow-700"
                          >
                            <Phone className="h-4 w-4 mr-1" />
                            Call Shopper
                          </Button>
                        )}
                    <Button 
                      variant="ghost" 
                      size="sm"
                          onClick={() => handleViewDetails(order)}
                    >
                      View Details
                    </Button>
                  </TableCell>
                </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
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
        </Card>
      </div>

      <OrderDetailsDrawer
        order={selectedOrder}
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
      />
    </AdminLayout>
  );
};

export default Orders;
