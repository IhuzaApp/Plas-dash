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

import { useSystemConfig, useShoppers, useAssignOrder, useCreateOrderOffer } from '@/hooks/useHasuraApi';
import { useOrderPayments } from '@/hooks/useShoppers';
import { sendNewOrderNotification, sendOrderAssignedNotification } from '@/services/fcmService';
import { 
  Loader2, 
  Video, 
  UserPlus, 
  Send, 
  Check, 
  X, 
  Phone, 
  MapPin, 
  CreditCard, 
  Receipt, 
  ArrowRightLeft,
  Search,
  ClipboardList,
  Truck,
  DollarSign
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { WalletTransaction, Refund } from '@/hooks/useShoppers';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

// Unified order interface for regular, reel, business, and restaurant orders
interface UnifiedOrder {
  id: string;
  OrderID: string;
  type: 'regular' | 'reel' | 'business' | 'restaurant' | 'package';
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
  delivery_note?: string;
  comment?: string;
  Order_Items?: any[];
  Wallet_Transactions?: any[];
  order_transactions?: any[];
  businessTransactions?: any[];
  restaurant_order_items?: any[];
  allProducts?: any[];
  Reel?: any;
  User?: {
    id: string;
    name: string;
    email: string;
    phone?: string;
  };
  orderedBy?: {
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
  Shop?: any;
  Restaurant?: any;
  business_store?: any;
  shopper?: any;
  receiverName?: string;
  receiverPhone?: string;
  pickupLocation?: string;
  dropoffLocation?: string;
}

interface OrderDetailsDrawerProps {
  order: UnifiedOrder | null;
  open: boolean;
  onClose: () => void;
}

const OrderDetailsDrawer: React.FC<OrderDetailsDrawerProps> = ({ order, open, onClose }) => {
  const { toast } = useToast();
  const { data: systemConfig } = useSystemConfig();
  const { data: shoppersData } = useShoppers();
  const assignOrder = useAssignOrder();
  const createOffer = useCreateOrderOffer();
  const [selectedShopperId, setSelectedShopperId] = React.useState<string>('');
  const [isAssigning, setIsAssigning] = React.useState(false);

  const { data: paymentData, isLoading: isLoadingPayments } = useOrderPayments(
    order?.id || '',
    order?.type || 'regular'
  );

  React.useEffect(() => {
    if (order?.shopper_id) {
      setSelectedShopperId(order.shopper_id);
    } else {
      setSelectedShopperId('');
    }
  }, [order]);

  const generateShortId = (id: string) => {
    if (!id) return '';
    return id.split('-')[0].toUpperCase();
  };

  const handleAssign = async () => {
    if (!selectedShopperId || !order) return;
    setIsAssigning(true);
    try {
      await assignOrder.mutateAsync({
        id: order.id,
        shopper_id: selectedShopperId,
        status: 'accepted',
        type: order.type,
      });

      // Send Notification
      const shopper = shoppersData?.shoppers?.find((s: any) => s.id === selectedShopperId);
      if (shopper?.user_id) {
        await sendOrderAssignedNotification(shopper.user_id, order.id, order.type);
      }

      toast({
        title: 'Success',
        description: `Order assigned to shopper`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign order',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleOffer = async () => {
    if (!selectedShopperId || !order) return;
    setIsAssigning(true);
    try {
      const offerObject: any = {
        shopper_id: selectedShopperId,
        order_type: order.type,
        status: 'pending',
        offered_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(), // 15 mins expiry
      };

      // Map order ID based on type
      if (order.type === 'regular') offerObject.order_id = order.id;
      else if (order.type === 'reel') offerObject.reel_order_id = order.id;
      else if (order.type === 'business') offerObject.business_order_id = order.id;
      else if (order.type === 'restaurant') offerObject.restaurant_order_id = order.id;
      else if (order.type === 'package') offerObject.order_id = order.id;

      await createOffer.mutateAsync({ object: offerObject });

      // Send Notification
      const shopper = shoppersData?.shoppers?.find((s: any) => s.id === selectedShopperId);
      if (shopper?.user_id) {
        await sendNewOrderNotification(shopper.user_id, order.id, order.type);
      }

      toast({
        title: 'Offer Sent',
        description: `Order offered to shopper`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send offer',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  const handleUnassign = async () => {
    if (!order) return;
    setIsAssigning(true);
    try {
      await assignOrder.mutateAsync({
        id: order.id,
        shopper_id: null,
        status: 'pending',
        type: order.type,
      });
      toast({
        title: 'Success',
        description: 'Shopper unassigned successfully',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to unassign shopper',
        variant: 'destructive',
      });
    } finally {
      setIsAssigning(false);
    }
  };

  if (!order) return null;

  // Transactions aggregation
  const allOrderTransactions = [
    ...(order.Wallet_Transactions || []),
    ...(order.order_transactions || []),
    ...(order.businessTransactions || []),
    ...(paymentData?.Wallet_Transactions || [])
  ].filter((v, i, a) => a.findIndex(t => t.id === v.id) === i); // Deduplicate

  const refunds = (paymentData?.Refunds || []) as Refund[];

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'USD';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(num);
  };

  const formatDateTime = (dateString: string | null | undefined) => {
    if (!dateString) return '—';
    return format(new Date(dateString), 'MMM d, yyyy HH:mm');
  };

  const getStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'shopping':
      case 'in_progress':
      case 'accepted':
      case 'picked_up':
      case 'on_the_way': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPaymentStatusColor = (status: string) => {
    const statusLower = status?.toLowerCase();
    if (statusLower === 'completed' || statusLower === 'success') return 'bg-green-100 text-green-800';
    if (statusLower === 'pending') return 'bg-yellow-100 text-yellow-800';
    if (statusLower === 'failed' || statusLower === 'error') return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[600px] overflow-y-auto p-0">
        <div className="p-6 pb-0">
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
                <Badge variant="outline" className="capitalize">
                  {order.type}
                </Badge>
              </div>
              <Badge className={getStatusColor(order.status)}>{order.status}</Badge>
            </SheetTitle>
            <SheetDescription>Created on {formatDateTime(order.created_at)}</SheetDescription>
          </SheetHeader>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-0 sticky top-0 bg-background z-10 px-6 border-b rounded-none">
            <TabsTrigger value="overview" className="gap-2">
              <ClipboardList className="h-4 w-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="transactions" className="gap-2">
              <Receipt className="h-4 w-4" />
              Transactions
            </TabsTrigger>
            <TabsTrigger value="assignment" className="gap-2">
              <UserPlus className="h-4 w-4" />
              Assignment
            </TabsTrigger>
          </TabsList>

          <div className="p-6">
            <TabsContent value="overview" className="mt-0 space-y-6">
              {/* Customer Information */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Customer Details</h3>
                <Card className="p-4 border-2">
                  <div className="flex items-center space-x-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {(order.type === 'regular'
                          ? order.User?.name
                          : order.type === 'package'
                            ? order.receiverName
                            : (order.orderedBy?.name ?? order.Reel?.title)
                        )
                          ?.split(' ')
                          .map((n: string) => n[0])
                          .join('') ?? '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-bold text-lg">
                        {order.type === 'regular'
                          ? order.User?.name
                          : order.type === 'package'
                            ? order.receiverName
                            : order.type === 'business' || order.type === 'restaurant'
                              ? order.orderedBy?.name
                              : order.Reel?.title}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {order.type === 'regular'
                          ? order.User?.email
                          : order.type === 'package'
                            ? `Phone: ${order.receiverPhone}`
                            : order.type === 'business' || order.type === 'restaurant'
                              ? order.orderedBy?.email
                              : order.Reel?.description}
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Items Section */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Items</h3>
                <Card className="p-0 overflow-hidden border-2">
                  <div className="divide-y">
                    {order.type === 'regular' && order.Order_Items?.map((item) => (
                      <div key={item.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">Product #{generateShortId(item.product_id)}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(item.price)}</p>
                      </div>
                    ))}
                    {order.type === 'restaurant' && order.restaurant_order_items?.map((item) => (
                      <div key={item.id} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{item.restaurant_dishes?.dishes?.name || 'Unknown Dish'}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {item.quantity}</p>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(item.price)}</p>
                      </div>
                    ))}
                    {order.type === 'business' && order.allProducts?.map((item: any, index: number) => (
                      <div key={index} className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{item.name || 'Business Item'}</p>
                          <p className="text-xs text-muted-foreground">Quantity: {item.quantity || 1}</p>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(item.price || '0')}</p>
                      </div>
                    ))}
                    {order.type === 'reel' && (
                      <div className="p-4 flex justify-between items-center">
                        <div>
                          <p className="font-medium text-sm">{order.Reel?.title}</p>
                          <p className="text-xs text-muted-foreground">Reel Product</p>
                        </div>
                        <p className="font-bold text-sm">{formatCurrency(order.Reel?.Price || '0')}</p>
                      </div>
                    )}
                    {order.type === 'package' && (
                      <div className="p-4">
                        <p className="text-sm">{order.comment || 'Package delivery'}</p>
                      </div>
                    )}
                  </div>
                  <div className="p-4 bg-muted/30 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span>{formatCurrency(order.total)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Delivery Fee</span>
                      <span>{formatCurrency(order.delivery_fee || '0')}</span>
                    </div>
                    {order.service_fee && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Service Fee</span>
                        <span>{formatCurrency(order.service_fee)}</span>
                      </div>
                    )}
                    <Separator className="my-2" />
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{formatCurrency(order.total)}</span>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Delivery Info */}
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Delivery Info</h3>
                <Card className="p-4 border-2">
                  <div className="space-y-4">
                    <div className="flex gap-3">
                      <MapPin className="h-5 w-5 text-primary shrink-0" />
                      <div>
                        <p className="text-xs font-bold uppercase text-muted-foreground">Dropoff Address</p>
                        <p className="text-sm">
                          {order.type === 'package'
                            ? order.dropoffLocation
                            : order.Address
                              ? `${order.Address.street}, ${order.Address.city}`
                              : 'No address provided'}
                        </p>
                      </div>
                    </div>
                    {order.type === 'package' && order.pickupLocation && (
                      <div className="flex gap-3">
                        <Truck className="h-5 w-5 text-primary shrink-0" />
                        <div>
                          <p className="text-xs font-bold uppercase text-muted-foreground">Pickup Address</p>
                          <p className="text-sm">{order.pickupLocation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="transactions" className="mt-0 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Order Transactions</h3>
                {allOrderTransactions.length > 0 ? (
                  <div className="space-y-3">
                    {allOrderTransactions.map((tx) => (
                      <Card key={tx.id} className="p-4 border-2">
                        <div className="flex justify-between items-start">
                          <div className="flex items-center gap-3">
                            <div className="bg-primary/10 p-2 rounded-lg">
                              <DollarSign className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <p className="font-bold capitalize">{tx.type || tx.action || 'Transaction'}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{tx.reference_id || tx.id}</p>
                              <p className="text-[10px] text-muted-foreground">{formatDateTime(tx.created_at)}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-lg">{formatCurrency(tx.amount || '0')}</p>
                            <Badge className={`${getPaymentStatusColor(tx.status)} text-[10px] h-5`}>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                        {tx.description && (
                          <div className="mt-3 p-2 bg-muted/30 rounded text-xs text-muted-foreground">
                            {tx.description}
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="p-8 text-center border-dashed border-2">
                    <Receipt className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                    <p className="text-sm text-muted-foreground">No transactions found for this order</p>
                  </Card>
                )}
              </div>

              {refunds.length > 0 && (
                <div>
                  <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Refunds</h3>
                  <div className="space-y-3">
                    {refunds.map((refund) => (
                      <Card key={refund.id} className="p-4 border-2 border-red-100 bg-red-50/10">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-bold text-red-600">Refund Issued</p>
                            <p className="text-xs text-muted-foreground">{refund.reason}</p>
                            <p className="text-[10px] text-muted-foreground">{formatDateTime(refund.created_at)}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-red-600 text-lg">-{formatCurrency(refund.amount)}</p>
                            <Badge variant="outline" className={getPaymentStatusColor(refund.status)}>
                              {refund.status}
                            </Badge>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="assignment" className="mt-0 space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Shopper Assignment</h3>
                {order.shopper_id ? (
                  <Card className="p-4 border-2 border-primary/20 bg-primary/[0.02]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar className="h-14 w-14 border-2 border-primary/20">
                          <AvatarFallback className="bg-primary/10 text-primary font-bold">
                            {order.shopper?.name?.split(' ').map((n: string) => n[0]).join('') || 'S'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-bold text-lg">{order.shopper?.name || 'Assigned Shopper'}</p>
                          <p className="text-sm text-muted-foreground flex items-center gap-1">
                            <Phone className="h-3 w-3" />
                            {order.shopper?.phone || 'No phone'}
                          </p>
                          <Badge variant="outline" className="mt-1 bg-green-50 text-green-700 border-green-200">
                            Active Session
                          </Badge>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleUnassign}
                        disabled={isAssigning}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                        Unassign
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <Card className="p-8 text-center border-dashed border-2">
                      <UserPlus className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-20" />
                      <p className="text-sm text-muted-foreground mb-4">No shopper assigned yet</p>
                      
                      <div className="space-y-4 max-w-sm mx-auto">
                        <div className="text-left">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 block ml-1">
                            Dispatch Selection
                          </label>
                          <Select value={selectedShopperId} onValueChange={setSelectedShopperId}>
                            <SelectTrigger className="w-full h-11 border-2">
                              <SelectValue placeholder="Search available shoppers..." />
                            </SelectTrigger>
                            <SelectContent>
                              {shoppersData?.shoppers?.filter(s => s.active).map(shopper => (
                                <SelectItem key={shopper.id} value={shopper.id}>
                                  <div className="flex flex-col py-1">
                                    <span className="font-bold">{shopper.full_name}</span>
                                    <span className="text-[10px] text-muted-foreground">
                                      {shopper.transport_mode || 'Standard'} • {shopper.phone_number}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <Button 
                            onClick={handleOffer} 
                            disabled={!selectedShopperId || isAssigning}
                            variant="outline"
                            className="h-11 border-2 gap-2"
                          >
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            Offer
                          </Button>
                          <Button 
                            onClick={handleAssign} 
                            disabled={!selectedShopperId || isAssigning}
                            className="h-11 gap-2 shadow-lg"
                          >
                            {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                            Assign
                          </Button>
                        </div>
                      </div>
                    </Card>
                  </div>
                )}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
};

export default OrderDetailsDrawer;
