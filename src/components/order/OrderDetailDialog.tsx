import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { Package, Clock, Truck, Calendar, CreditCard } from 'lucide-react';

// Order type definition
export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: string;
  total?: string;
};

export type OrderDetails = {
  id: string;
  customer: string;
  date: string;
  total: string;
  status: string;
  address: string;
  phone: string;
  email: string;
  paymentMethod: string;
  items: OrderItem[];
  subtotal?: string;
  tax?: string;
  deliveryFee?: string;
};

interface OrderDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetails | null;
}

const OrderDetailDialog = ({ open, onOpenChange, order }: OrderDetailDialogProps) => {
  if (!order) return null;

  // Function to get status color class
  const getStatusColorClass = (status: string) => {
    switch (status) {
      case 'Delivered':
        return 'bg-green-100 text-green-800';
      case 'In Progress':
        return 'bg-blue-100 text-blue-800';
      case 'Pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'Cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Use provided values from order if available, otherwise calculate
  const subtotal =
    order.subtotal ||
    order.items.reduce((sum, item) => {
      // Extract numeric value from formatted price string
      const priceMatch = item.price.match(/[\d,]+/);
      const price = priceMatch ? parseFloat(priceMatch[0].replace(/,/g, '')) : 0;
      return sum + price * item.quantity;
    }, 0);

  const tax = order.tax || '0';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              <span>Order {order.id}</span>
            </div>
            <Badge className={getStatusColorClass(order.status)}>{order.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Placed on {order.date} by {order.customer}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  Customer Information
                </h3>
                <div className="bg-muted/50 p-3 rounded-md">
                  <p className="font-medium">{order.customer}</p>
                  <p>{order.email}</p>
                  <p>{order.phone}</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium mb-2 flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Order Timeline
                </h3>
                <div className="bg-muted/50 p-3 rounded-md">
                  <div className="flex justify-between items-center text-sm">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      Ordered
                    </span>
                    <span>{order.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm mt-2">
                    <span className="flex items-center gap-1">
                      <Package className="h-3.5 w-3.5" />
                      Processing
                    </span>
                    <span>{order.date}</span>
                  </div>
                  {order.status === 'Delivered' && (
                    <div className="flex justify-between items-center text-sm mt-2">
                      <span className="flex items-center gap-1">
                        <Truck className="h-3.5 w-3.5" />
                        Delivered
                      </span>
                      <span>{order.date}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-medium mb-2 flex items-center gap-2">
                <Truck className="h-4 w-4" />
                Delivery Information
              </h3>
              <div className="bg-muted/50 p-3 rounded-md">
                <p className="font-medium">Shipping Address</p>
                <p className="text-muted-foreground">{order.address}</p>
                <div className="mt-3">
                  <p className="font-medium">Delivery Method</p>
                  <p className="text-muted-foreground">Standard Delivery</p>
                </div>
                <div className="mt-3">
                  <p className="font-medium">Payment Method</p>
                  <p className="text-muted-foreground">{order.paymentMethod}</p>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-3">Order Items ({order.items.length})</h3>
            <div className="space-y-2">
              {order.items.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div className="flex-1">
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p>{item.price} each</p>
                      <p className="font-medium">
                        {item.total || `${item.price} × ${item.quantity}`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Subtotal</p>
              <p>{subtotal}</p>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-muted-foreground">Tax (8%)</p>
              <p>{tax}</p>
            </div>
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <p className="font-medium">Total Amount</p>
              <p className="text-xl font-bold">{order.total}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
            <Button>Print Receipt</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
