import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { ShoppingBag, Plus, Minus, Trash, CreditCard, Banknote, Clock, ChevronDown, ChevronUp } from 'lucide-react';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface CartSummaryCardProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, change: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (paymentMethod: 'card' | 'cash') => void;
  onSaveToPending: () => void;
}

export const CartSummaryCard: React.FC<CartSummaryCardProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onSaveToPending,
}) => {
  const [isOrderSummaryCollapsed, setIsOrderSummaryCollapsed] = useState(false);
  const [needsTIN, setNeedsTIN] = useState(false);
  const [tinNumber, setTinNumber] = useState('');

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleCheckout = (paymentMethod: 'card' | 'cash') => {
    if (needsTIN && !tinNumber.trim()) {
      // Logic to open TIN dialog can be handled in parent
    } else {
      onCheckout(paymentMethod);
    }
  };

  return (
    <Card className="lg:col-span-2">
      <CardHeader>
        <CardTitle>Cart & Summary</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium mb-2">Cart Items</h3>
            <ScrollArea className="h-[300px]">
              <div className="space-y-2">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between p-2 bg-accent/20 rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.name}</p>
                      <p className="text-xs text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Button variant="outline" size="sm" onClick={() => onUpdateQuantity(item.id, -1)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-6 text-center text-sm">{item.quantity}</span>
                      <Button variant="outline" size="sm" onClick={() => onUpdateQuantity(item.id, 1)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button variant="outline" size="sm" className="text-destructive" onClick={() => onRemoveItem(item.id)}>
                        <Trash className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                {cart.length === 0 && (
                  <div className="p-4 text-center text-muted-foreground">
                    <ShoppingBag className="mx-auto h-6 w-6 mb-1 opacity-50" />
                    <p className="text-sm">Cart is empty</p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
          <Separator />
          <div>
            <div
              className="flex items-center justify-between cursor-pointer"
              onClick={() => setIsOrderSummaryCollapsed(!isOrderSummaryCollapsed)}
            >
              <h3 className="font-medium">Order Summary</h3>
              {isOrderSummaryCollapsed ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronUp className="h-4 w-4 text-muted-foreground" />
              )}
            </div>
            <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOrderSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}>
              <div className="space-y-2 text-sm pt-2">
                <div className="flex justify-between">
                  <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>${calculateTotal().toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>${(calculateTotal() * 0.08).toFixed(2)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold text-base">
                  <span>Total</span>
                  <span>${(calculateTotal() * 1.08).toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOrderSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-20 opacity-100'}`}>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="include-tin"
                checked={needsTIN}
                onCheckedChange={checked => setNeedsTIN(checked === true)}
              />
              <label htmlFor="include-tin" className="text-sm font-medium leading-none cursor-pointer">
                Include TIN Number
              </label>
            </div>
            {needsTIN && (
              <div className="pt-2">
                <Input
                  placeholder="Enter TIN Number"
                  value={tinNumber}
                  onChange={e => setTinNumber(e.target.value)}
                  className="text-sm"
                />
              </div>
            )}
          </div>
          <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOrderSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-48 opacity-100'}`}>
            <div className="space-y-2">
              <Button className="w-full" onClick={() => handleCheckout('card')} disabled={cart.length === 0}>
                <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
              </Button>
              <Button variant="outline" className="w-full" onClick={() => handleCheckout('cash')} disabled={cart.length === 0}>
                <Banknote className="mr-2 h-4 w-4" /> Pay with Cash
              </Button>
              <Button variant="secondary" className="w-full" onClick={onSaveToPending} disabled={cart.length === 0}>
                <Clock className="mr-2 h-4 w-4" /> Save for Later
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}; 