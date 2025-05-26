import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash,
  CreditCard,
  Banknote,
  CheckCircle,
  Clock,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Form, FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Checkbox } from '@/components/ui/checkbox';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
}

interface PendingCheckout {
  id: string;
  items: CartItem[];
  timestamp: Date;
  customerName?: string;
  status: 'pending' | 'processing';
  total: number;
}

const Checkout = () => {
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([
    { id: '1', name: 'Milk 1L', price: 2.99, quantity: 2 },
    { id: '2', name: 'Bread', price: 1.5, quantity: 1 },
    { id: '3', name: 'Eggs (12)', price: 3.49, quantity: 1 },
  ]);
  const [barcode, setBarcode] = useState('');
  const [activeTab, setActiveTab] = useState('current');
  const [needsTIN, setNeedsTIN] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [isTINDialogOpen, setIsTINDialogOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'cash' | null>(null);

  // Mock pending checkouts for demonstration
  const [pendingCheckouts, setPendingCheckouts] = useState<PendingCheckout[]>([
    {
      id: 'PND-001',
      items: [
        { id: '4', name: 'Coffee', price: 5.99, quantity: 1 },
        { id: '5', name: 'Sugar', price: 2.49, quantity: 1 },
      ],
      timestamp: new Date(2025, 4, 22, 8, 15),
      customerName: 'John Smith',
      status: 'pending',
      total: 8.48,
    },
    {
      id: 'PND-002',
      items: [
        { id: '6', name: 'Bottled Water (6-pack)', price: 4.99, quantity: 2 },
        { id: '7', name: 'Chips', price: 3.29, quantity: 3 },
      ],
      timestamp: new Date(2025, 4, 22, 10, 30),
      customerName: 'Emma Johnson',
      status: 'processing',
      total: 19.85,
    },
  ]);

  const [selectedPendingCheckout, setSelectedPendingCheckout] = useState<string | null>(null);

  const addItem = () => {
    if (barcode.trim()) {
      // In a real application, this would query a product database
      const mockProduct = {
        id: `temp-${Date.now()}`,
        name: `Product (${barcode})`,
        price: Math.round(Math.random() * 10 * 100) / 100,
        quantity: 1,
        barcode: barcode,
      };

      setCart([...cart, mockProduct]);
      setBarcode('');
      toast({
        title: 'Product added',
        description: `${mockProduct.name} has been added to the cart.`,
      });
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(
      cart.map(item => {
        if (item.id === id) {
          const newQuantity = Math.max(1, item.quantity + change);
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const handleCheckout = () => {
    if (needsTIN && !tinNumber.trim()) {
      setIsTINDialogOpen(true);
      setPaymentMethod(null);
      return;
    }

    processFinalCheckout();
  };

  const processFinalCheckout = () => {
    if (!paymentMethod) return;

    const tinInfo = needsTIN && tinNumber ? ` with TIN: ${tinNumber}` : '';

    toast({
      title: 'Payment processed',
      description: `Order completed with ${paymentMethod}${tinInfo}. Total: $${calculateTotal().toFixed(2)}`,
    });

    // Save to pending if needed, or clear cart
    setCart([]);
    setTinNumber('');
    setNeedsTIN(false);
    setPaymentMethod(null);
  };

  const saveToPending = () => {
    if (cart.length === 0) return;

    const newPendingCheckout: PendingCheckout = {
      id: `PND-${Date.now().toString().slice(-3)}`,
      items: [...cart],
      timestamp: new Date(),
      status: 'pending',
      total: calculateTotal(),
    };

    setPendingCheckouts([...pendingCheckouts, newPendingCheckout]);

    toast({
      title: 'Checkout saved',
      description: `Checkout #${newPendingCheckout.id} saved to pending orders.`,
    });

    setCart([]);
    setTinNumber('');
    setNeedsTIN(false);
  };

  const completePendingCheckout = (id: string) => {
    const checkout = pendingCheckouts.find(c => c.id === id);
    if (!checkout) return;

    setPendingCheckouts(pendingCheckouts.filter(c => c.id !== id));

    toast({
      title: 'Pending checkout completed',
      description: `Checkout #${id} has been processed successfully.`,
    });
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotalForPendingCheckout = (items: CartItem[]) => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <Badge className="bg-yellow-500">
            <Clock className="mr-1 h-3 w-3" /> Pending
          </Badge>
        );
      case 'processing':
        return (
          <Badge className="bg-blue-500">
            <AlertCircle className="mr-1 h-3 w-3" /> Processing
          </Badge>
        );
      default:
        return null;
    }
  };

  const viewPendingCheckoutDetails = (id: string) => {
    setSelectedPendingCheckout(id);
  };

  return (
    <AdminLayout>
      <PageHeader
        title="POS Checkout"
        description="Process customer purchases quickly and efficiently"
        icon={<ShoppingBag className="h-6 w-6" />}
      />

      <Tabs defaultValue="current" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="current">Current Checkout</TabsTrigger>
          <TabsTrigger value="pending">Pending Checkouts ({pendingCheckouts.length})</TabsTrigger>
        </TabsList>

        {/* Current Checkout Tab */}
        <TabsContent value="current" className="space-y-6">
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
                    onChange={e => setBarcode(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && addItem()}
                    className="flex-1"
                  />
                  <Button onClick={addItem}>Add</Button>
                </div>

                <ScrollArea className="h-[400px] mt-4">
                  <div className="space-y-2">
                    {cart.map(item => (
                      <div
                        key={item.id}
                        className="flex items-center justify-between p-3 bg-accent/20 rounded-lg"
                      >
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.price.toFixed(2)} × {item.quantity} = $
                            {(item.price * item.quantity).toFixed(2)}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, -1)}
                          >
                            <Minus className="h-4 w-4" />
                          </Button>
                          <span className="w-8 text-center">{item.quantity}</span>
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => updateQuantity(item.id, 1)}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="text-destructive"
                            onClick={() => removeItem(item.id)}
                          >
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

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="include-tin"
                      checked={needsTIN}
                      onCheckedChange={checked => setNeedsTIN(checked === true)}
                    />
                    <label
                      htmlFor="include-tin"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Include TIN Number
                    </label>
                  </div>

                  {needsTIN && (
                    <div className="pt-2">
                      <Input
                        placeholder="Enter TIN Number"
                        value={tinNumber}
                        onChange={e => setTinNumber(e.target.value)}
                      />
                    </div>
                  )}

                  <div className="pt-4 space-y-2">
                    <Button
                      className="w-full"
                      onClick={() => {
                        setPaymentMethod('card');
                        handleCheckout();
                      }}
                      disabled={cart.length === 0}
                    >
                      <CreditCard className="mr-2 h-4 w-4" /> Pay with Card
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        setPaymentMethod('cash');
                        handleCheckout();
                      }}
                      disabled={cart.length === 0}
                    >
                      <Banknote className="mr-2 h-4 w-4" /> Pay with Cash
                    </Button>
                    <Button
                      variant="secondary"
                      className="w-full"
                      onClick={saveToPending}
                      disabled={cart.length === 0}
                    >
                      <Clock className="mr-2 h-4 w-4" /> Save for Later
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Pending Checkouts Tab */}
        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle>Pending Checkouts</CardTitle>
            </CardHeader>
            <CardContent>
              {pendingCheckouts.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Clock className="mx-auto h-8 w-8 mb-2 opacity-50" />
                  <p>No pending checkouts</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingCheckouts.map(checkout => (
                    <div key={checkout.id} className="p-4 border rounded-lg">
                      <div className="flex justify-between items-center mb-2">
                        <div>
                          <h3 className="font-medium">Order #{checkout.id}</h3>
                          <p className="text-sm text-muted-foreground">
                            {checkout.timestamp.toLocaleString()} • {checkout.items.length} items
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {getStatusBadge(checkout.status)}
                          <Badge className="bg-primary">${checkout.total.toFixed(2)}</Badge>
                        </div>
                      </div>
                      {checkout.customerName && (
                        <p className="text-sm mb-2">Customer: {checkout.customerName}</p>
                      )}
                      <div className="flex space-x-2 mt-2">
                        <Button size="sm" onClick={() => viewPendingCheckoutDetails(checkout.id)}>
                          View Details
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => completePendingCheckout(checkout.id)}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" /> Complete
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* TIN Number Dialog */}
      <Dialog open={isTINDialogOpen} onOpenChange={setIsTINDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>TIN Number Required</DialogTitle>
            <DialogDescription>
              Please enter a Tax Identification Number (TIN) for this invoice.
            </DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Enter TIN Number"
            value={tinNumber}
            onChange={e => setTinNumber(e.target.value)}
            className="mt-2"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsTINDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                setIsTINDialogOpen(false);
                processFinalCheckout();
              }}
              disabled={!tinNumber.trim()}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pending Checkout Details Dialog */}
      <Dialog
        open={!!selectedPendingCheckout}
        onOpenChange={open => !open && setSelectedPendingCheckout(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Checkout Details</DialogTitle>
          </DialogHeader>

          {selectedPendingCheckout && (
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium">Order #{selectedPendingCheckout}</h4>
                <p className="text-sm text-muted-foreground">
                  {pendingCheckouts
                    .find(c => c.id === selectedPendingCheckout)
                    ?.timestamp.toLocaleString()}
                </p>
              </div>

              <ScrollArea className="h-[200px]">
                {pendingCheckouts
                  .find(c => c.id === selectedPendingCheckout)
                  ?.items.map(item => (
                    <div key={item.id} className="py-2 border-b last:border-0">
                      <div className="flex justify-between">
                        <span>
                          {item.name} × {item.quantity}
                        </span>
                        <span>${(item.price * item.quantity).toFixed(2)}</span>
                      </div>
                    </div>
                  ))}
              </ScrollArea>

              <div className="pt-2">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>
                    $
                    {pendingCheckouts
                      .find(c => c.id === selectedPendingCheckout)
                      ?.total.toFixed(2) || '0.00'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>
                    $
                    {(
                      (pendingCheckouts.find(c => c.id === selectedPendingCheckout)?.total || 0) *
                      0.08
                    ).toFixed(2)}
                  </span>
                </div>
                <Separator className="my-2" />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>
                    $
                    {(
                      (pendingCheckouts.find(c => c.id === selectedPendingCheckout)?.total || 0) *
                      1.08
                    ).toFixed(2)}
                  </span>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setSelectedPendingCheckout(null)}>
                  Close
                </Button>
                <Button
                  onClick={() => {
                    if (selectedPendingCheckout) {
                      completePendingCheckout(selectedPendingCheckout);
                      setSelectedPendingCheckout(null);
                    }
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" /> Complete Checkout
                </Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default Checkout;
