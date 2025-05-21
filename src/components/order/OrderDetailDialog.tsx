
import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

// Order type definition
export type OrderItem = {
  id: string;
  name: string;
  quantity: number;
  price: string;
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
      case "Delivered":
        return "bg-green-100 text-green-800";
      case "In Progress":
        return "bg-blue-100 text-blue-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      case "Cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Order {order.id}</span>
            <Badge className={getStatusColorClass(order.status)}>{order.status}</Badge>
          </DialogTitle>
          <DialogDescription>
            Placed on {order.date} by {order.customer}
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">Customer Information</h3>
              <p>{order.customer}</p>
              <p>{order.email}</p>
              <p>{order.phone}</p>
            </div>
            <div>
              <h3 className="font-medium mb-2">Shipping Address</h3>
              <p>{order.address}</p>
            </div>
          </div>

          <Separator />

          <div>
            <h3 className="font-medium mb-3">Order Items</h3>
            <div className="space-y-2">
              {order.items.map((item) => (
                <Card key={item.id}>
                  <CardContent className="p-4 flex justify-between items-center">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">Quantity: {item.quantity}</p>
                    </div>
                    <p>{item.price}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          <Separator />

          <div className="flex justify-between items-center">
            <div>
              <p className="text-muted-foreground">Payment Method</p>
              <p>{order.paymentMethod}</p>
            </div>
            <div className="text-right">
              <p className="text-muted-foreground">Total Amount</p>
              <p className="text-xl font-bold">{order.total}</p>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button>Print Receipt</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default OrderDetailDialog;
