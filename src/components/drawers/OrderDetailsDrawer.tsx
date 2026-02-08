import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Order } from '@/types/order';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { useOrderPayments } from '@/hooks/useShoppers';
import { Loader2, Video } from 'lucide-react';
import type { WalletTransaction, Refund } from '@/hooks/useShoppers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

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
  orderedBy?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
    profile_picture?: string | null;
    created_at?: string;
  };
  allProducts?: any[];
  units?: string;
  business_store?: {
    id: string;
    name: string;
    address?: string;
    image?: string | null;
    description?: string | null;
    [key: string]: any;
  } | null;
  businessTransactions?: Array<{
    id: string;
    action?: string | null;
    created_at: string;
    description?: string | null;
    related_order?: string | null;
    status: string;
    type: string;
    wallet_id: string;
  }>;
  Shop?: { id: string; name: string; address?: string; image?: string | null } | null;
  Restaurant?: {
    id: string;
    name: string;
    logo?: string | null;
    phone?: string | null;
    email?: string | null;
    location?: string | null;
    [key: string]: any;
  } | null;
  restaurant_order_items?: Array<{
    id: string;
    quantity: number;
    price: string;
    dish_id: string;
    created_at?: string;
    order_id?: string;
    restaurant_dishes?: {
      dishes?: { name?: string; image?: string; category?: string } | null;
      price?: string;
      [key: string]: any;
    } | null;
    [key: string]: any;
  }>;
  itemsCount?: number;
  unitsCount?: number;
  Wallet_Transactions?: Array<{
    id: string;
    amount: string;
    created_at: string;
    description?: string | null;
    status: string;
    type: string;
    wallet_id: string;
  }>;
}

interface OrderDetailsDrawerProps {
  order: UnifiedOrder | null;
  open: boolean;
  onClose: () => void;
}

// Function to generate a short ID from a UUID or longer ID
const generateShortId = (id: string) => {
  if (!id) return 'N/A';
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

const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({ order, open, onClose }) => {
  if (!order) return null;

  const { data: paymentData, isLoading: isLoadingPayments } = useOrderPayments(order.id);
  const { data: systemConfig } = useSystemConfig();
  // Restaurant orders: Wallet_Transactions from list API. Business: businessTransactions (different schema, no amount).
  const walletTransactions = (
    order.type === 'restaurant' && order.Wallet_Transactions?.length
      ? order.Wallet_Transactions
      : paymentData?.Wallet_Transactions || []
  ) as WalletTransaction[];
  const businessTransactions = order.type === 'business' ? (order.businessTransactions ?? []) : [];
  const refunds = (paymentData?.Refunds || []) as Refund[];
  const isLoadingPaymentsResolved =
    (order.type === 'restaurant' && order.Wallet_Transactions) ||
    (order.type === 'business' && order.businessTransactions)
      ? false
      : isLoadingPayments;

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const formatDateTime = (dateString: string) => {
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const getStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      case 'shopping':
      case 'in_progress':
      case 'accepted':
      case 'picked_up':
      case 'on_the_way':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto">
        <SheetHeader className="mb-6">
          <SheetTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger className="text-primary hover:underline">
                    Order #{generateShortId(order.OrderID?.toString() || order.id)}
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Full ID: {order.OrderID || order.id}</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              {order.type === 'reel' && (
                <Badge variant="outline">
                  <Video className="h-3 w-3 mr-1" />
                  Reel Order
                </Badge>
              )}
            </div>
            <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
          </SheetTitle>
          <SheetDescription>Created on {formatDateTime(order.created_at)}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6">
          {/* Customer Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {order.type === 'regular' || order.type === 'business' || order.type === 'restaurant'
                ? 'Customer Details'
                : 'Reel Details'}
            </h3>
            <Card className="p-4">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarFallback>
                    {(order.type === 'regular'
                      ? order.User?.name
                      : (order.orderedBy?.name ?? order.Reel?.title)
                    )
                      ?.split(' ')
                      .map((n: string) => n[0])
                      .join('') ?? '?'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">
                    {order.type === 'regular'
                      ? order.User?.name
                      : order.type === 'business' || order.type === 'restaurant'
                        ? order.orderedBy?.name
                        : order.Reel?.title}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {order.type === 'regular'
                      ? order.User?.email
                      : order.type === 'business' || order.type === 'restaurant'
                        ? order.orderedBy?.email
                        : order.Reel?.description}
                  </p>
                  {(order.type === 'business' || order.type === 'restaurant') &&
                    order.orderedBy?.phone && (
                      <p className="text-sm text-muted-foreground">
                        Phone: {order.orderedBy.phone}
                      </p>
                    )}
                  {order.type === 'restaurant' && order.Restaurant && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Restaurant: {order.Restaurant.name}
                      {order.Restaurant.phone && ` • ${order.Restaurant.phone}`}
                    </p>
                  )}
                  {order.type === 'reel' && (
                    <p className="text-sm text-muted-foreground">
                      Category: {order.Reel?.category} | Price:{' '}
                      {formatCurrency(order.Reel?.Price || '0')}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          </div>

          {/* Shop / Restaurant / Business (merchant info with logo) */}
          {(order.type === 'regular' && order.Shop) ||
          (order.type === 'reel' && order.Shop) ||
          (order.type === 'restaurant' && order.Restaurant) ||
          (order.type === 'business' && order.business_store) ? (
            <div>
              <h3 className="text-lg font-semibold mb-3">
                {order.type === 'regular' || order.type === 'reel'
                  ? 'Shop'
                  : order.type === 'restaurant'
                    ? 'Restaurant'
                    : 'Business Store'}
              </h3>
              <Card className="p-4">
                <div className="flex items-center gap-4">
                  {(order.type === 'regular' && order.Shop?.image) ||
                  (order.type === 'reel' && order.Shop?.image) ||
                  (order.type === 'restaurant' && order.Restaurant?.logo) ||
                  (order.type === 'business' && order.business_store?.image) ? (
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg overflow-hidden bg-muted border">
                      <img
                        src={
                          (order.type === 'regular' && order.Shop?.image) ||
                          (order.type === 'reel' && order.Shop?.image) ||
                          (order.type === 'restaurant' && order.Restaurant?.logo) ||
                          (order.type === 'business' && order.business_store?.image) ||
                          ''
                        }
                        alt={
                          (order.type === 'regular' && order.Shop?.name) ||
                          (order.type === 'reel' && order.Shop?.name) ||
                          (order.type === 'restaurant' && order.Restaurant?.name) ||
                          (order.type === 'business' && order.business_store?.name) ||
                          'Merchant'
                        }
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : (
                    <div className="flex-shrink-0 w-14 h-14 rounded-lg bg-muted border flex items-center justify-center text-xl font-semibold text-muted-foreground">
                      {(order.type === 'regular' && order.Shop?.name?.[0]) ||
                        (order.type === 'reel' && order.Shop?.name?.[0]) ||
                        (order.type === 'restaurant' && order.Restaurant?.name?.[0]) ||
                        (order.type === 'business' && order.business_store?.name?.[0]) ||
                        '?'}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {(order.type === 'regular' && order.Shop?.name) ||
                        (order.type === 'reel' && order.Shop?.name) ||
                        (order.type === 'restaurant' && order.Restaurant?.name) ||
                        (order.type === 'business' && order.business_store?.name) ||
                        '—'}
                    </p>
                    {(order.type === 'regular' || order.type === 'reel') && order.Shop?.address && (
                      <p className="text-sm text-muted-foreground">{order.Shop.address}</p>
                    )}
                    {order.type === 'restaurant' && order.Restaurant && (
                      <>
                        {order.Restaurant.phone && (
                          <p className="text-sm text-muted-foreground">
                            Phone: {order.Restaurant.phone}
                          </p>
                        )}
                        {order.Restaurant.email && (
                          <p className="text-sm text-muted-foreground">
                            Email: {order.Restaurant.email}
                          </p>
                        )}
                        {order.Restaurant.location && (
                          <p className="text-sm text-muted-foreground">
                            {order.Restaurant.location}
                          </p>
                        )}
                      </>
                    )}
                    {order.type === 'business' && order.business_store && (
                      <>
                        {order.business_store.address && (
                          <p className="text-sm text-muted-foreground">
                            {order.business_store.address}
                          </p>
                        )}
                        {order.business_store.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {order.business_store.description}
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          ) : null}

          {/* Order Items */}
          <div>
            <h3 className="text-lg font-semibold mb-3">
              {order.type === 'regular'
                ? 'Order Items'
                : order.type === 'restaurant'
                  ? 'Restaurant Items'
                  : order.type === 'business'
                    ? 'Business Items'
                    : 'Reel Item'}
            </h3>
            <Card className="p-4">
              <div className="space-y-4">
                {order.type === 'regular' &&
                  order.Order_Items?.map((item, index) => (
                    <div key={item.id}>
                      {index > 0 && <Separator className="my-4" />}
                      <div className="flex justify-between">
                        <div>
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger className="text-primary hover:underline">
                                <p className="font-medium">
                                  Product #{generateShortId(item.product_id)}
                                </p>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Full Product ID: {item.product_id}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-medium">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                {order.type === 'restaurant' &&
                  order.restaurant_order_items?.map((item, index) => {
                    const dishName =
                      item.restaurant_dishes?.dishes?.name ??
                      `Dish #${generateShortId(item.dish_id)}`;
                    return (
                      <div key={item.id}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{dishName}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item.quantity}
                            </p>
                            {item.restaurant_dishes?.dishes?.category && (
                              <p className="text-xs text-muted-foreground">
                                {item.restaurant_dishes.dishes.category}
                              </p>
                            )}
                          </div>
                          <p className="font-medium">{formatCurrency(item.price)}</p>
                        </div>
                      </div>
                    );
                  })}
                {order.type === 'business' &&
                  (order.allProducts?.length ? (
                    order.allProducts.map((item: any, index: number) => (
                      <div key={item?.id ?? index}>
                        {index > 0 && <Separator className="my-4" />}
                        <div className="flex justify-between">
                          <div>
                            <p className="font-medium">{item?.name ?? `Item ${index + 1}`}</p>
                            <p className="text-sm text-muted-foreground">
                              Quantity: {item?.quantity ?? 1}
                            </p>
                          </div>
                          {item?.price != null && (
                            <p className="font-medium">{formatCurrency(String(item.price))}</p>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">
                      {order.units ? `${order.units} unit(s)` : 'No items'}
                    </p>
                  ))}
                {order.type === 'reel' && (
                  <div className="flex justify-between">
                    <div>
                      <p className="font-medium">{order.Reel?.title}</p>
                      <p className="text-sm text-muted-foreground">
                        Quantity: {order.quantity || 1}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Product: {order.Reel?.Product}
                      </p>
                    </div>
                    <p className="font-medium">{formatCurrency(order.Reel?.Price || '0')}</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Payment Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Payment Details</h3>
            <Card className="p-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{formatCurrency(order.delivery_fee ?? '0')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Service Fee</span>
                  <span>{formatCurrency(order.service_fee ?? '0')}</span>
                </div>
                {order.discount && order.discount !== '0' && (
                  <div className="flex justify-between text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(order.discount)}</span>
                  </div>
                )}
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrency(order.total)}</span>
                </div>
                {order.voucher_code && (
                  <p className="text-sm text-muted-foreground mt-2">
                    Voucher applied: {order.voucher_code}
                  </p>
                )}

                {/* Payment Transactions (Wallet for regular/reel/restaurant; businessTransactions for business) */}
                <div className="mt-4">
                  <h4 className="font-medium mb-2">Payment Transactions</h4>
                  {isLoadingPaymentsResolved ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin text-gray-500" />
                    </div>
                  ) : order.type === 'business' && businessTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {businessTransactions.map(
                        (tx: {
                          id: string;
                          type: string;
                          action?: string | null;
                          description?: string | null;
                          created_at: string;
                          status: string;
                        }) => (
                          <div
                            key={tx.id}
                            className="flex justify-between items-center text-sm border rounded-md p-2"
                          >
                            <div>
                              <p className="font-medium">{tx.type || tx.action || 'Transaction'}</p>
                              {tx.description && (
                                <p className="text-muted-foreground text-xs">{tx.description}</p>
                              )}
                              <p className="text-muted-foreground text-xs">
                                {formatDateTime(tx.created_at)}
                              </p>
                            </div>
                            <Badge className={getPaymentStatusColor(tx.status)}>{tx.status}</Badge>
                          </div>
                        )
                      )}
                    </div>
                  ) : walletTransactions.length > 0 ? (
                    <div className="space-y-2">
                      {walletTransactions.map((transaction: WalletTransaction) => (
                        <div
                          key={transaction.id}
                          className="flex justify-between items-center text-sm border rounded-md p-2"
                        >
                          <div>
                            <p className="font-medium">{transaction.type || 'Payment'}</p>
                            <p className="text-muted-foreground">
                              {formatDateTime(transaction.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">{formatCurrency(transaction.amount)}</p>
                            <Badge className={getPaymentStatusColor(transaction.status)}>
                              {transaction.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No payment transactions found</p>
                  )}
                </div>

                {/* Refunds */}
                {refunds.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Refunds</h4>
                    <div className="space-y-2">
                      {refunds.map((refund: Refund) => (
                        <div
                          key={refund.id}
                          className="flex justify-between items-center text-sm border rounded-md p-2"
                        >
                          <div>
                            <p className="font-medium text-red-600">Refund</p>
                            <p className="text-muted-foreground">{refund.reason}</p>
                            <p className="text-muted-foreground">
                              {formatDateTime(refund.created_at)}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-red-600">
                              -{formatCurrency(refund.amount)}
                            </p>
                            <Badge
                              variant={refund.paid ? 'default' : 'outline'}
                              className={getPaymentStatusColor(refund.status)}
                            >
                              {refund.status} {refund.paid ? '(Paid)' : ''}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Delivery Information */}
          <div>
            <h3 className="text-lg font-semibold mb-3">Delivery Information</h3>
            <Card className="p-4">
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="font-medium">Address: </span>
                  {order.Address
                    ? `${order.Address.street}, ${order.Address.city} ${order.Address.postal_code}`
                    : 'Address not available'}
                </p>
                <p className="text-sm">
                  <span className="font-medium">Delivery Notes: </span>
                  {order.delivery_notes || order.delivery_note || 'No special instructions'}
                </p>
                {order.delivery_time && (
                  <p className="text-sm">
                    <span className="font-medium">Delivery Time: </span>
                    {formatDateTime(order.delivery_time)}
                  </p>
                )}
                <p className="text-sm">
                  <span className="font-medium">Last Updated: </span>
                  {formatDateTime(order.updated_at)}
                </p>
              </div>
            </Card>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsDrawer;
