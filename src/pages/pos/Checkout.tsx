
import React, { useState } from "react";
import AdminLayout from "@/components/layout/AdminLayout";
import PageHeader from "@/components/layout/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShoppingBag, Plus, Minus, Trash, CreditCard, Banknote } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

const Checkout = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([
    { id: "1", name: "Milk 1L", price: 2.99, quantity: 2 },
    { id: "2", name: "Bread", price: 1.50, quantity: 1 },
    { id: "3", name: "Eggs (12)", price: 3.49, quantity: 1 }
  ]);
  const [barcode, setBarcode] = useState("");

  const addItem = () => {
    if (barcode.trim()) {
      // In a real application, this would query a product database
      const mockProduct = {
        id: `temp-${Date.now()}`,
        name: `Product (${barcode})`,
        price: Math.round(Math.random() * 10 * 100) / 100,
        quantity: 1,
        barcode: barcode
      };
      
      setCart([...cart, mockProduct]);
      setBarcode("");
      toast({
        title: "Product added",
        description: `${mockProduct.name} has been added to the cart.`
      });
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(cart.map(item => {
      if (item.id === id) {
        const newQuantity = Math.max(1, item.quantity + change);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }));
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = (paymentMethod: string) => {
    toast({
      title: "Payment processed",
      description: `Order completed with ${paymentMethod}. Total: $${calculateTotal().toFixed(2)}`
    });
    setCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  return (
    <AdminLayout>
      <PageHeader 
        heading="POS Checkout" 
        subheading="Process customer purchases quickly and efficiently"
        icon={<ShoppingBag className="h-6 w-6" />}
      />
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Scanning Section */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Scanner</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex space-x-2">
              <Input 
                placeholder="Scan barcode or enter product code"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && addItem()}
                className="flex-1"
              />
              <Button onClick={addItem}>Add</Button>
            </div>
            
            <ScrollArea className="h-[400px] mt-4">
              <div className="space-y-2">
                {cart.map((item) => (
                  <div key={item.id} className="flex items-center justify-between p-3 bg-accent/20 rounded-lg">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity} = ${(item.price * item.quantity).toFixed(2)}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, -1)}>
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span className="w-8 text-center">{item.quantity}</span>
                      <Button variant="outline" size="icon" onClick={() => updateQuantity(item.id, 1)}>
                        <Plus className="h-4 w-4" />
                      </Button>
                      <Button variant="outline" size="icon" className="text-destructive" onClick={() => removeItem(item.id)}>
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="p-8 text-center text-muted-foreground">
                    <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-50" />
                    <p>Cart is empty</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
        
        {/* Checkout Summary */}
        <Card>
          <CardHeader>
            <CardTitle>Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                <span>${calculateTotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax</span>
                <span>${(calculateTotal() * 0.08).toFixed(2)}</span>
              </div>
              
              <Separator />
              
              <div className="flex justify-between font-bold text-lg">
                <span>Total</span>
                <span>${(calculateTotal() * 1.08).toFixed(2)}</span>
              </div>
              
              <div className="pt-4 space-y-2">
                <Button className="w-full" onClick={() => handleCheckout("card")}>
                  <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
                </Button>
                <Button variant="outline" className="w-full" onClick={() => handleCheckout("cash")}>
                  <Banknote className="mr-2 h-4 w-4" /> Pay with Cash
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default Checkout;
