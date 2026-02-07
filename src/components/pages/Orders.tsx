import React, { useState, useMemo } from 'react';
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
import { Search, Filter, Loader2, Phone, AlertCircle, Video, ShoppingBag, UtensilsCrossed } from 'lucide-react';
import { useOrders, useReelOrders, useBusinessOrders, useRestaurantOrders, useSystemConfig } from '@/hooks/useHasuraApi';
import { format, differenceInMinutes } from 'date-fns';
import Pagination from '@/components/ui/pagination';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';
import OrderDetailsDrawer from '@/components/drawers/OrderDetailsDrawer';
import { usePrivilege } from '@/hooks/usePrivilege';
import { Badge } from '@/components/ui/badge';

// Function to generate a short ID from a UUID or longer ID
const generateShortId = (id: string) => {
  // If it's a UUID, take the first 8 characters
  if (id.includes('-')) {
    return id.split('-')[0];
  }
  // If it's a number, ensure it's at least 4 digits with leading zeros
  const numId = parseInt(id);
  if (!isNaN(numId)) {
    return numId.toString().padStart(4, '0');
  }
  // For any other format, take first 8 characters
  return id.slice(0, 8);
};

// Unified order interface for regular, reel, business, and restaurant orders
interface UnifiedOrder {
  id: string;
  OrderID: string;
  type: 'regular' | 'reel' | 'business' | 'restaurant';
  status: string;
  total: string;
  created_at: string;
  updated_at: string;
  delivery_fee?: string;
  service_fee?: string;
  discount?: string;
  voucher_code?: string | null;
  shopper_id: string | null;
  user_id?: string;
  delivery_address_id?: string;
  delivery_photo_url?: string;
  delivery_time?: string | null;
  combined_order_id?: string | null;
  shop_id?: string;
  // Regular order
  delivery_notes?: string;
  Order_Items?: any[];
  User?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  Address?: {
    street: string;
    city: string;
    postal_code: string;
  };
  shopper?: {
    id: string;
    name: string;
    email?: string;
    phone: string;
  };
  // Reel
  quantity?: number;
  reel_id?: string;
  delivery_note?: string;
  found?: boolean;
  Reel?: {
    Price: string;
    Product: string;
    category: string;
    title: string;
    description: string;
    video_url: string;
  };
  Shoppers?: {
    id: string;
    name: string;
    email: string;
    phone: string;
  } | null;
  // Business order
  orderedBy?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  allProducts?: any[];
  units?: string;
  business_store?: { id: string; name: string; address?: string } | null;
  // Restaurant order
  Restaurant?: { id: string; name: string } | null;
  restaurant_order_items?: any[];
  itemsCount?: number;
  unitsCount?: number;
}

const Orders = () => {
  const { data, isLoading, isError, error } = useOrders();
  const { data: reelOrders } = useReelOrders();
  const { data: businessOrdersData } = useBusinessOrders();
  const { data: restaurantOrdersData } = useRestaurantOrders();
  const { data: systemConfig } = useSystemConfig();
  const orders = data?.Orders || [];
  const reelOrderItems: any[] = reelOrders?.reel_orders || [];
  const businessOrderItems: any[] = businessOrdersData?.orders || [];
  const restaurantOrderItems: any[] = restaurantOrdersData?.orders || [];
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [selectedOrder, setSelectedOrder] = useState<UnifiedOrder | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const { hasAction } = usePrivilege();

  // Combine regular, reel, business, and restaurant orders into a unified array
  const allOrders: UnifiedOrder[] = useMemo(() => {
    const regularOrders: UnifiedOrder[] = orders.map(order => ({
      ...order,
      type: 'regular' as const,
      OrderID: order.OrderID || order.id,
    }));

    const reelOrdersMapped: UnifiedOrder[] = reelOrderItems.map(reelOrder => ({
      id: reelOrder.id,
      OrderID: reelOrder.OrderID,
      type: 'reel' as const,
      status: reelOrder.status,
      total: reelOrder.total,
      created_at: reelOrder.created_at,
      updated_at: reelOrder.updated_at,
      delivery_fee: reelOrder.delivery_fee,
      service_fee: reelOrder.service_fee,
      discount: reelOrder.discount,
      voucher_code: reelOrder.voucher_code,
      shopper_id: reelOrder.shopper_id,
      user_id: reelOrder.user_id,
      delivery_address_id: reelOrder.delivery_address_id,
      delivery_photo_url: reelOrder.delivery_photo_url,
      delivery_time: reelOrder.delivery_time,
      combined_order_id: reelOrder.combined_order_id,
      shop_id: reelOrder.Reel?.shop_id || '',
      quantity: reelOrder.quantity,
      reel_id: reelOrder.reel_id,
      delivery_note: reelOrder.delivery_note,
      found: reelOrder.found,
      Reel: reelOrder.Reel,
      Shoppers: reelOrder.Shoppers,
      Address: reelOrder.Address,
      User: reelOrder.User,
    }));

    const businessOrdersMapped: UnifiedOrder[] = businessOrderItems.map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'business' as const,
      status: o.status ?? 'PENDING',
      total: o.total,
      created_at: o.created_at,
      updated_at: o.updated_at ?? o.created_at,
      shopper_id: o.shopper_id ?? null,
      user_id: o.ordered_by ?? '',
      orderedBy: o.orderedBy,
      allProducts: o.allProducts,
      units: o.units,
      business_store: o.business_store,
      shopper: o.shopper,
    }));

    const restaurantOrdersMapped: UnifiedOrder[] = restaurantOrderItems.map((o: any) => ({
      id: o.id,
      OrderID: o.OrderID ?? o.id,
      type: 'restaurant' as const,
      status: o.status,
      total: o.total,
      created_at: o.created_at,
      updated_at: o.updated_at,
      shopper_id: o.shopper_id ?? null,
      user_id: o.user_id ?? '',
      orderedBy: o.orderedBy,
      Address: o.Address,
      Restaurant: o.Restaurant,
      restaurant_order_items: o.restaurant_order_items,
      itemsCount: o.itemsCount,
      unitsCount: o.unitsCount,
      shopper: o.shopper,
    }));

    return [...regularOrders, ...reelOrdersMapped, ...businessOrdersMapped, ...restaurantOrdersMapped].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }, [orders, reelOrderItems, businessOrderItems, restaurantOrderItems]);

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const handleCallShopper = (phone: string | undefined) => {
    if (!phone) {
      toast.error('Shopper phone number not available');
      return;
    }
    toast.info(`Calling shopper at ${phone}...`);
  };

  const getOrderWarnings = (order: UnifiedOrder) => {
    const warnings = [];
    const timeSinceUpdate = differenceInMinutes(new Date(), new Date(order.updated_at));
    const statusLower = order.status.toLowerCase();

    // Check for unassigned orders (10+ minutes)
    if (!order.shopper_id && timeSinceUpdate > 10) {
      warnings.push({
        type: 'unassigned',
        message: 'Order unassigned for over 10 minutes',
        severity: 'high',
      });
    }

    // Check for long shopping time (60+ minutes)
    if (statusLower === 'shopping' && timeSinceUpdate > 60) {
      warnings.push({
        type: 'shopping',
        message: 'Shopping taking over 60 minutes',
        severity: 'medium',
      });
    }

    // Check for long delivery time (50+ minutes)
    if (statusLower === 'on_the_way' && timeSinceUpdate > 50) {
      warnings.push({
        type: 'delivery',
        message: 'Delivery taking over 50 minutes',
        severity: 'high',
      });
    }

    return warnings;
  };

  const getStatusColor = (order: UnifiedOrder) => {
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

  const formatDateTime = (dateString: string | null | undefined) => {
    if (dateString == null || dateString === '') return '—';
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return '—';
    return format(date, 'MMM d, yyyy HH:mm');
  };

  const pendingOrders = allOrders.filter(order => order.status === 'PENDING');
  const deliveredOrders = allOrders.filter(order => order.status.toLowerCase() === 'delivered');
  const inProgressOrders = allOrders.filter(order => {
    const statusLower = order.status.toLowerCase();
    return order.status !== 'PENDING' && statusLower !== 'delivered';
  });

  const totalRevenue = allOrders.reduce(
    (acc, order) => acc + (parseFloat(String(order.total)) || 0),
    0
  );

  // Filter orders based on search term
  const filteredOrders = allOrders.filter(order => {
    const searchLower = searchTerm.toLowerCase();

    // Direct ID match (case-insensitive)
    if (order.id?.toLowerCase() === searchLower) {
      return true;
    }

    // Direct OrderID match (case-insensitive)
    if (order.OrderID?.toString().toLowerCase() === searchLower) {
      return true;
    }

    // Partial ID match
    if (order.id?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Partial OrderID match
    if (order.OrderID?.toString().toLowerCase().includes(searchLower)) {
      return true;
    }

    // Customer name/email/phone (regular & reel: User; business & restaurant: orderedBy)
    const customerName = order.User?.name ?? order.orderedBy?.name ?? '';
    const customerEmail = order.User?.email ?? order.orderedBy?.email ?? '';
    const customerPhone = order.User?.phone ?? order.orderedBy?.phone ?? '';
    if (
      customerName?.toLowerCase().includes(searchLower) ||
      customerEmail?.toLowerCase().includes(searchLower) ||
      customerPhone?.toLowerCase().includes(searchLower)
    ) {
      return true;
    }

    // Reel title/description match (for reel orders)
    if (order.Reel?.title?.toLowerCase().includes(searchLower) ||
        order.Reel?.description?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Store/restaurant name (business & restaurant)
    if (order.business_store?.name?.toLowerCase().includes(searchLower) ||
        order.Restaurant?.name?.toLowerCase().includes(searchLower)) {
      return true;
    }

    // Status match
    if (order.status.toLowerCase().includes(searchLower)) {
      return true;
    }

    return false;
  });

  // Calculate pagination
  const totalItems = filteredOrders.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentOrders = filteredOrders.slice(startIndex, endIndex);

  const handleViewDetails = (order: UnifiedOrder) => {
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
            {hasAction('orders', 'export_orders') && <Button variant="outline">Export</Button>}
            {hasAction('orders', 'create_orders') && <Button>Create Order</Button>}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{allOrders.length}</div>
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
            <p className="text-muted-foreground">Total Sales</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by Order ID, UUID, customer name or email..."
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
                currentOrders.map(order => {
                  const warnings = getOrderWarnings(order);
                  return (
                    <TableRow key={order.id}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-primary hover:underline">
                                #{generateShortId(order.OrderID?.toString() || order.id)}
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Full ID: {order.OrderID || order.id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
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
                        <div className="font-medium">
                          {order.type === 'regular' || order.type === 'reel'
                            ? (order.User?.name ?? '—')
                            : (order.orderedBy?.name ?? '—')}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {order.type === 'regular' || order.type === 'reel'
                            ? (order.User?.email ?? '—')
                            : (order.orderedBy?.email ?? '—')}
                        </div>
                        {(order.type === 'regular' ? order.User?.phone : order.orderedBy?.phone) && (
                          <div className="text-xs text-muted-foreground">
                            {order.type === 'regular' || order.type === 'reel'
                              ? order.User?.phone
                              : order.orderedBy?.phone}
                          </div>
                        )}
                        <div className="mt-1 flex flex-wrap gap-1">
                          {order.type === 'reel' && (
                            <Badge variant="outline" className="gap-0.5">
                              <Video className="h-3 w-3" />
                              Reel
                            </Badge>
                          )}
                          {order.type === 'business' && (
                            <Badge variant="outline" className="gap-0.5">
                              <ShoppingBag className="h-3 w-3" />
                              Business
                            </Badge>
                          )}
                          {order.type === 'restaurant' && (
                            <Badge variant="outline" className="gap-0.5">
                              <UtensilsCrossed className="h-3 w-3" />
                              Restaurant
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order)}`}
                        >
                          {order.status}
                        </span>
                      </TableCell>
                      <TableCell>
                        {order.type === 'regular' &&
                          `${order.Order_Items?.length ?? 0} item(s)`}
                        {order.type === 'reel' &&
                          `${order.quantity ?? 1} item(s)`}
                        {order.type === 'business' &&
                          (order.units
                            ? `${order.units} unit(s)`
                            : `${
                                Array.isArray(order.allProducts)
                                  ? order.allProducts.length
                                  : 0
                              } item(s)`)}
                        {order.type === 'restaurant' &&
                          `${order.itemsCount ?? order.restaurant_order_items?.length ?? 0} item(s)`}
                      </TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell>{formatDateTime(order.created_at)}</TableCell>
                      <TableCell>{formatDateTime(order.updated_at)}</TableCell>
                      <TableCell className="text-right space-x-2">
                        {order.shopper_id &&
                          warnings.some(w => w.type === 'shopping' || w.type === 'delivery') && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCallShopper(
                                order.type === 'regular' || order.type === 'business' || order.type === 'restaurant'
                                  ? order.shopper?.phone
                                  : order.Shoppers?.phone
                              )}
                              className="text-yellow-600 hover:text-yellow-700"
                            >
                              <Phone className="h-4 w-4 mr-1" />
                              Call Shopper
                            </Button>
                          )}
                        <Button variant="ghost" size="sm" onClick={() => handleViewDetails(order)}>
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
            onPageSizeChange={size => {
              setPageSize(size);
              setCurrentPage(1);
            }}
            totalItems={totalItems}
          />
        </Card>
      </div>

      <OrderDetailsDrawer order={selectedOrder} open={isDrawerOpen} onClose={handleCloseDrawer} />
    </AdminLayout>
  );
};

export default Orders;
