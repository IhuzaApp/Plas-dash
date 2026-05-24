'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import {
  Loader2,
  Send,
  UserPlus,
  ShoppingBag,
  Truck,
  Package,
  UtensilsCrossed,
  Video,
  Search,
  Check,
  ChevronsUpDown,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useShoppers, useAssignOrder, useCreateOrderOffer, OrderOffer } from '@/hooks/useHasuraApi';
import { sendNewOrderNotification, sendOrderAssignedNotification } from '@/services/fcmService';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { cn } from '@/lib/utils';

interface ManualDispatchCenterProps {
  allOrders: any[];
  offers: OrderOffer[];
}

const ManualDispatchCenter = ({ allOrders = [], offers = [] }: ManualDispatchCenterProps) => {
  const { data: shoppersData } = useShoppers();
  const assignOrder = useAssignOrder();
  const createOffer = useCreateOrderOffer();
  const { toast } = useToast();

  const [selectedOrderId, setSelectedOrderId] = React.useState<string>('');
  const [selectedShopperId, setSelectedShopperId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [orderOpen, setOrderOpen] = React.useState(false);
  const [shopperOpen, setShopperOpen] = React.useState(false);

  // Helper to check if order already has an offer
  const isAlreadyOffered = React.useCallback(
    (order: any) => {
      return offers.some(offer => {
        if (order.type === 'regular' && offer.order_id === order.id) return true;
        if (order.type === 'reel' && offer.reel_order_id === order.id) return true;
        if (order.type === 'business' && offer.business_order_id === order.id) return true;
        if (order.type === 'restaurant' && offer.restaurant_order_id === order.id) return true;
        if (order.type === 'package' && offer.package_order_id === order.id) return true;
        return false;
      });
    },
    [offers]
  );

  // Filter pending orders of all types that haven't been offered yet
  const pendingOrders = React.useMemo(() => {
    return allOrders.filter(o => {
      const isPending =
        o.status.toLowerCase() === 'pending' || o.status.toLowerCase() === 'searching';
      return isPending && !isAlreadyOffered(o);
    });
  }, [allOrders, isAlreadyOffered]);

  const handleAssign = async () => {
    if (!selectedOrderId || !selectedShopperId) return;
    const order = allOrders.find(o => o.id === selectedOrderId);
    if (!order) return;

    setIsProcessing(true);
    try {
      await assignOrder.mutateAsync({
        id: order.id,
        shopper_id: selectedShopperId,
        status: 'accepted',
        type: order.type,
      });

      // Send Notification
      const shopper = shoppersData?.shoppers?.find(s => s.id === selectedShopperId);
      if (shopper?.user_id) {
        await sendOrderAssignedNotification(shopper.user_id, order.id, order.type);
      }

      toast({
        title: 'Success',
        description: 'Order assigned successfully',
      });
      setSelectedOrderId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign order',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleOffer = async () => {
    if (!selectedOrderId || !selectedShopperId) return;
    const order = allOrders.find(o => o.id === selectedOrderId);
    if (!order) return;

    setIsProcessing(true);
    try {
      const offerObject: any = {
        shopper_id: selectedShopperId,
        order_type: order.type,
        status: 'offered',
        offered_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
      };

      if (order.type === 'regular') offerObject.order_id = order.id;
      else if (order.type === 'reel') offerObject.reel_order_id = order.id;
      else if (order.type === 'business') offerObject.business_order_id = order.id;
      else if (order.type === 'restaurant') offerObject.restaurant_order_id = order.id;
      else if (order.type === 'package') offerObject.package_order_id = order.id;

      await createOffer.mutateAsync({ object: offerObject });

      // Send Notification
      const shopper = shoppersData?.shoppers?.find(s => s.id === selectedShopperId);
      if (shopper?.user_id) {
        await sendNewOrderNotification(shopper.user_id, order.id, order.type);
      }

      toast({
        title: 'Offer Sent',
        description: 'Order offered to shopper',
      });
      setSelectedOrderId('');
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to send offer',
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const getOrderIcon = (type: string) => {
    switch (type) {
      case 'regular':
        return <ShoppingBag className="h-4 w-4" />;
      case 'reel':
        return <Video className="h-4 w-4" />;
      case 'business':
        return <Truck className="h-4 w-4" />;
      case 'restaurant':
        return <UtensilsCrossed className="h-4 w-4" />;
      case 'package':
        return <Package className="h-4 w-4" />;
      default:
        return <ShoppingBag className="h-4 w-4" />;
    }
  };

  const selectedOrder = allOrders.find(o => o.id === selectedOrderId);
  const selectedShopper = shoppersData?.shoppers?.find(s => s.id === selectedShopperId);

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Manual Dispatch Center
            </CardTitle>
            <CardDescription>
              Manually assign or offer pending orders to shoppers platform-wide
            </CardDescription>
          </div>
          <Badge variant="outline" className="bg-background">
            {pendingOrders.length} Available for Dispatch
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          {/* Searchable Order Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-3 w-3" />
              Select Pending Order
            </label>
            <Popover open={orderOpen} onOpenChange={setOrderOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={orderOpen}
                  className="w-full h-12 justify-between border-2 px-3"
                >
                  {selectedOrderId ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      {getOrderIcon(selectedOrder?.type || '')}
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="font-medium text-sm truncate">
                          #
                          {selectedOrder?.OrderID?.toString().slice(0, 8) ||
                            selectedOrderId.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {selectedOrder?.type} •{' '}
                          {selectedOrder?.User?.name || selectedOrder?.orderedBy?.name || 'Guest'}
                        </span>
                      </div>
                    </div>
                  ) : (
                    'Choose order to dispatch...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search orders by ID or customer..." />
                  <CommandList>
                    <CommandEmpty>No pending orders found.</CommandEmpty>
                    <CommandGroup>
                      {pendingOrders.map(order => (
                        <CommandItem
                          key={order.id}
                          value={`${order.OrderID} ${order.User?.name || order.orderedBy?.name || ''}`}
                          onSelect={() => {
                            setSelectedOrderId(order.id);
                            setOrderOpen(false);
                          }}
                          className="py-3"
                        >
                          <Check
                            className={cn(
                              'mr-2 h-4 w-4',
                              selectedOrderId === order.id ? 'opacity-100' : 'opacity-0'
                            )}
                          />
                          <div className="flex items-center gap-2">
                            {getOrderIcon(order.type)}
                            <div className="flex flex-col">
                              <span className="font-medium">
                                #{order.OrderID?.toString().slice(0, 8) || order.id.slice(0, 8)}
                              </span>
                              <span className="text-[10px] text-muted-foreground capitalize">
                                {order.type} •{' '}
                                {order.User?.name || order.orderedBy?.name || 'Guest'}
                              </span>
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Searchable Shopper Select */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <UserPlus className="h-3 w-3" />
              Select Available Shopper
            </label>
            <Popover open={shopperOpen} onOpenChange={setShopperOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={shopperOpen}
                  className="w-full h-12 justify-between border-2 px-3"
                >
                  {selectedShopperId ? (
                    <div className="flex items-center gap-2 overflow-hidden">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[8px] bg-primary/10">
                          {selectedShopper?.full_name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col items-start overflow-hidden">
                        <span className="font-medium text-sm truncate">
                          {selectedShopper?.full_name}
                        </span>
                        <span className="text-[10px] text-muted-foreground truncate">
                          {selectedShopper?.transport_mode || 'Standard'} •{' '}
                          {selectedShopper?.phone_number}
                        </span>
                      </div>
                    </div>
                  ) : (
                    'Choose shopper...'
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[300px] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search shoppers by name or phone..." />
                  <CommandList>
                    <CommandEmpty>No active shoppers found.</CommandEmpty>
                    <CommandGroup>
                      {shoppersData?.shoppers
                        ?.filter(s => s.active)
                        .map(shopper => (
                          <CommandItem
                            key={shopper.id}
                            value={`${shopper.full_name} ${shopper.phone_number}`}
                            onSelect={() => {
                              setSelectedShopperId(shopper.id);
                              setShopperOpen(false);
                            }}
                            className="py-3"
                          >
                            <Check
                              className={cn(
                                'mr-2 h-4 w-4',
                                selectedShopperId === shopper.id ? 'opacity-100' : 'opacity-0'
                              )}
                            />
                            <div className="flex items-center gap-2">
                              <Avatar className="h-7 w-7">
                                <AvatarFallback className="text-[10px] bg-primary/10">
                                  {shopper.full_name?.charAt(0) || 'S'}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex flex-col">
                                <span className="font-medium">{shopper.full_name}</span>
                                <span className="text-[10px] text-muted-foreground">
                                  {shopper.transport_mode || 'Standard'} • {shopper.phone_number}
                                </span>
                              </div>
                            </div>
                          </CommandItem>
                        ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button
              onClick={handleOffer}
              disabled={!selectedOrderId || !selectedShopperId || isProcessing}
              variant="outline"
              className="h-12 border-2 gap-2 hover:bg-primary/5 transition-all"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Send Offer
            </Button>
            <Button
              onClick={handleAssign}
              disabled={!selectedOrderId || !selectedShopperId || isProcessing}
              className="h-12 bg-primary hover:bg-primary/90 gap-2 shadow-md transition-all"
            >
              {isProcessing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <UserPlus className="h-4 w-4" />
              )}
              Assign Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualDispatchCenter;
