'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Send, UserPlus, ShoppingBag, Truck, Package, UtensilsCrossed, Video } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useShoppers, useAssignOrder, useCreateOrderOffer } from '@/hooks/useHasuraApi';

interface ManualDispatchCenterProps {
  allOrders: any[];
}

const ManualDispatchCenter = ({ allOrders = [] }: ManualDispatchCenterProps) => {
  const { data: shoppersData } = useShoppers();
  const assignOrder = useAssignOrder();
  const createOffer = useCreateOrderOffer();
  const { toast } = useToast();

  const [selectedOrderId, setSelectedOrderId] = React.useState<string>('');
  const [selectedShopperId, setSelectedShopperId] = React.useState<string>('');
  const [isProcessing, setIsProcessing] = React.useState(false);

  // Filter pending orders of all types
  const pendingOrders = React.useMemo(() => {
    return allOrders.filter(o => 
      o.status.toLowerCase() === 'pending' || 
      o.status.toLowerCase() === 'searching'
    );
  }, [allOrders]);

  const handleAssign = async () => {
    if (!selectedOrderId || !selectedShopperId) return;
    const order = pendingOrders.find(o => o.id === selectedOrderId);
    if (!order) return;

    setIsProcessing(true);
    try {
      await assignOrder.mutateAsync({
        id: order.id,
        shopper_id: selectedShopperId,
        status: 'accepted',
        type: order.type,
      });
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
    const order = pendingOrders.find(o => o.id === selectedOrderId);
    if (!order) return;

    setIsProcessing(true);
    try {
      const offerObject: any = {
        shopper_id: selectedShopperId,
        order_type: order.type,
        status: 'pending',
        offered_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 15 * 60000).toISOString(),
      };

      if (order.type === 'regular') offerObject.order_id = order.id;
      else if (order.type === 'reel') offerObject.reel_order_id = order.id;
      else if (order.type === 'business') offerObject.business_order_id = order.id;
      else if (order.type === 'restaurant') offerObject.restaurant_order_id = order.id;
      else if (order.type === 'package') offerObject.order_id = order.id;

      await createOffer.mutateAsync({ object: offerObject });
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
      case 'regular': return <ShoppingBag className="h-4 w-4" />;
      case 'reel': return <Video className="h-4 w-4" />;
      case 'business': return <Truck className="h-4 w-4" />;
      case 'restaurant': return <UtensilsCrossed className="h-4 w-4" />;
      case 'package': return <Package className="h-4 w-4" />;
      default: return <ShoppingBag className="h-4 w-4" />;
    }
  };

  return (
    <Card className="border-2 border-primary/20 shadow-lg overflow-hidden">
      <CardHeader className="bg-primary/5 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold flex items-center gap-2">
              <Truck className="h-6 w-6 text-primary" />
              Manual Dispatch Center
            </CardTitle>
            <CardDescription>Manually assign or offer pending orders to shoppers platform-wide</CardDescription>
          </div>
          <Badge variant="outline" className="bg-background">
            {pendingOrders.length} Pending Orders
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <ShoppingBag className="h-3 w-3" />
              Select Pending Order
            </label>
            <Select value={selectedOrderId} onValueChange={setSelectedOrderId}>
              <SelectTrigger className="h-12 border-2">
                <SelectValue placeholder="Choose order to dispatch..." />
              </SelectTrigger>
              <SelectContent>
                {pendingOrders.map(order => (
                  <SelectItem key={order.id} value={order.id}>
                    <div className="flex items-center gap-2 py-1">
                      {getOrderIcon(order.type)}
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">
                          #{order.OrderID?.toString().slice(0, 8) || order.id.slice(0, 8)}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">
                          {order.type} • {order.User?.name || order.orderedBy?.name || 'Guest'}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
                {pendingOrders.length === 0 && (
                  <p className="p-2 text-sm text-center text-muted-foreground">No pending orders</p>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-1.5">
              <UserPlus className="h-3 w-3" />
              Select Available Shopper
            </label>
            <Select value={selectedShopperId} onValueChange={setSelectedShopperId}>
              <SelectTrigger className="h-12 border-2">
                <SelectValue placeholder="Choose shopper..." />
              </SelectTrigger>
              <SelectContent>
                {shoppersData?.shoppers?.filter(s => s.active).map(shopper => (
                  <SelectItem key={shopper.id} value={shopper.id}>
                    <div className="flex items-center gap-2 py-1">
                      <Avatar className="h-6 w-6">
                        <AvatarFallback className="text-[8px] bg-primary/10">
                          {shopper.full_name?.charAt(0) || 'S'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{shopper.full_name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {shopper.transport_mode || 'Standard'} • {shopper.phone_number}
                        </span>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={handleOffer} 
              disabled={!selectedOrderId || !selectedShopperId || isProcessing}
              variant="outline"
              className="h-12 border-2 gap-2 hover:bg-primary/5 transition-all"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              Send Offer
            </Button>
            <Button 
              onClick={handleAssign} 
              disabled={!selectedOrderId || !selectedShopperId || isProcessing}
              className="h-12 bg-primary hover:bg-primary/90 gap-2 shadow-md transition-all"
            >
              {isProcessing ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              Assign Now
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ManualDispatchCenter;
