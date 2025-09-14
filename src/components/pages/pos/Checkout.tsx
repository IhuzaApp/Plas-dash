import React, { useState } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { ShoppingBag } from 'lucide-react';
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
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useAuth } from '@/components/layout/RootLayout';
import { useProductsByShop, useShopById } from '@/hooks/useHasuraApi';
import { Product } from '@/hooks/useGraphql';
import { AddProductDialog } from '@/components/pages/pos/checkout/AddProductCheckoutDialog';
import CheckoutBarcodeScanner from '@/components/pages/pos/checkout/CheckoutBarcodeScanner';
import { ProductSelectionCard } from './checkout/ProductSelectionCard';
import { CartSummaryCard } from './checkout/CartSummaryCard';
import { PendingCheckoutsTab } from './checkout/PendingCheckoutsTab';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  barcode?: string;
  description?: string;
  measurement_unit?: string;
  image?: string;
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
  const { session } = useAuth();
  const { hasAction } = usePrivilege();

  const { data: productsData, isLoading: productsLoading } = useProductsByShop(
    session?.shop_id || ''
  );
  const products = productsData?.Products || [];

  // Fetch shop details for checkout
  const { data: shopData } = useShopById(session?.shop_id || '');
  const shop = shopData?.Shops_by_pk;

  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState('current');
  const [needsTIN, setNeedsTIN] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [isTINDialogOpen, setIsTINDialogOpen] = useState(false);
  const [isAddProductDialogOpen, setIsAddProductDialogOpen] = useState(false);
  const [isBarcodeScannerOpen, setIsBarcodeScannerOpen] = useState(false);
  const [pendingCheckouts, setPendingCheckouts] = useState<PendingCheckout[]>([]);
  const [selectedPendingCheckout, setSelectedPendingCheckout] = useState<string | null>(null);

  // Save cart data to localStorage for customer display
  React.useEffect(() => {
    const cartData = JSON.stringify(cart);
    const shopData = JSON.stringify({
      name: shop?.name || 'Shop Name',
      address: shop?.address || 'Shop Address',
      phone: session?.phoneNumber || '',
      email: session?.email || '',
    });

    localStorage.setItem('customerDisplayCart', cartData);
    localStorage.setItem('customerDisplayShop', shopData);
  }, [cart, shop, session]);

  // Load pending checkouts from localStorage on component mount
  React.useEffect(() => {
    const loadPendingCheckouts = () => {
      try {
        const stored = localStorage.getItem('pendingCheckouts');

        if (stored) {
          const parsed = JSON.parse(stored);
          const now = Date.now();

          // Filter out expired checkouts (older than 24 hours) and convert timestamps back to Date objects
          const validCheckouts = parsed
            .filter((checkout: any) => {
              // Convert string timestamp back to Date object
              const checkoutTime = new Date(checkout.timestamp).getTime();
              const hoursDiff = (now - checkoutTime) / (1000 * 60 * 60);
              return hoursDiff < 24; // Keep only checkouts less than 24 hours old
            })
            .map((checkout: any) => ({
              ...checkout,
              timestamp: new Date(checkout.timestamp), // Convert back to Date object
            }));

          setPendingCheckouts(validCheckouts);

          // Update localStorage with only valid checkouts
          if (validCheckouts.length !== parsed.length) {
            localStorage.setItem('pendingCheckouts', JSON.stringify(validCheckouts));
          }
        }
      } catch (error) {
        console.error('Error loading pending checkouts:', error);
        // Clear corrupted data
        localStorage.removeItem('pendingCheckouts');
      }
    };

    loadPendingCheckouts();
  }, []);

  // Save pending checkouts to localStorage whenever they change
  React.useEffect(() => {
    if (pendingCheckouts.length > 0) {
      localStorage.setItem('pendingCheckouts', JSON.stringify(pendingCheckouts));
    } else {
      localStorage.removeItem('pendingCheckouts');
    }
  }, [pendingCheckouts]);

  // Cleanup expired checkouts every hour
  React.useEffect(() => {
    const cleanupExpiredCheckouts = () => {
      const now = Date.now();
      const validCheckouts = pendingCheckouts.filter(checkout => {
        const checkoutTime = new Date(checkout.timestamp).getTime();
        const hoursDiff = (now - checkoutTime) / (1000 * 60 * 60);
        return hoursDiff < 24;
      });

      if (validCheckouts.length !== pendingCheckouts.length) {
        setPendingCheckouts(validCheckouts);
      }
    };

    // Run cleanup every hour
    const interval = setInterval(cleanupExpiredCheckouts, 60 * 60 * 1000);

    return () => clearInterval(interval);
  }, [pendingCheckouts]);

  const addProductByCode = (code: string) => {
    if (code.trim()) {
      const foundProduct = products.find(
        product =>
          product.ProductName?.sku === code ||
          product.ProductName?.barcode === code ||
          product.ProductName?.name.toLowerCase().includes(code.toLowerCase())
      );

      if (foundProduct) {
        addProductToCart(foundProduct);
        toast({
          title: 'Product added',
          description: `${foundProduct.ProductName?.name} has been added to the cart.`,
        });
      } else {
        toast({
          title: 'Product not found',
          description: 'No product found with this SKU or barcode.',
          variant: 'destructive',
        });
      }
    }
  };

  const addProductToCart = (product: Product) => {
    const existingItem = cart.find(item => item.id === product.id);

    if (existingItem) {
      setCart(
        cart.map(item => (item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item))
      );
    } else {
      const cartItem: CartItem = {
        id: product.id,
        name: product.ProductName?.name || 'Unknown Product',
        price: parseFloat(product.price), // Use base price for POS
        quantity: 1,
        description: product.ProductName?.description || '',
        measurement_unit: product.measurement_unit,
        image: product.ProductName?.image || '',
      };
      setCart([...cart, cartItem]);
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

  const processFinalCheckout = (paymentMethod: 'card' | 'cash' | 'momo', tinNumber?: string) => {
    const tinInfo = tinNumber ? ` with TIN: ${tinNumber}` : '';
    toast({
      title: 'Payment processed',
      description: `Order completed with ${paymentMethod}${tinInfo}. Total: $${(
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.08
      ).toFixed(2)}`,
    });

    setCart([]);
    setTinNumber('');
    setNeedsTIN(false);
  };

  const saveToPending = () => {
    if (cart.length === 0) return;

    const newPendingCheckout: PendingCheckout = {
      id: `PND-${Date.now().toString().slice(-6)}`,
      items: [...cart],
      timestamp: new Date(),
      status: 'pending',
      total: cart.reduce((sum, item) => sum + item.price * item.quantity, 0),
      customerName: 'Walk-in Customer', // Can be enhanced later with customer input
    };

    setPendingCheckouts(prev => [...prev, newPendingCheckout]);

    toast({
      title: 'Checkout Saved',
      description: `Checkout #${newPendingCheckout.id} saved to pending orders. It will expire in 24 hours.`,
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

  const loadPendingCheckout = (id: string) => {
    const checkout = pendingCheckouts.find(c => c.id === id);
    if (!checkout) return;

    // Load items back to cart
    setCart(checkout.items);

    // Remove from pending checkouts
    setPendingCheckouts(pendingCheckouts.filter(c => c.id !== id));

    // Switch to current checkout tab
    setActiveTab('current');

    toast({
      title: 'Checkout Loaded',
      description: `Checkout #${id} has been loaded back to cart.`,
    });
  };

  const handleProductFoundByScan = (product: Product) => {
    addProductToCart(product);
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

        <TabsContent value="current" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <ProductSelectionCard
              products={products}
              isLoading={productsLoading}
              onAddProductToCart={addProductToCart}
              onAddProductManually={() => setIsAddProductDialogOpen(true)}
              onScanProduct={() => setIsBarcodeScannerOpen(true)}
            />
            <CartSummaryCard
              cart={cart}
              onUpdateQuantity={updateQuantity}
              onRemoveItem={removeItem}
              onCheckout={processFinalCheckout}
              onSaveToPending={saveToPending}
              shopId={session?.shop_id}
              currentUser={{
                id: session?.id || '',
                name: session?.fullName || 'Unknown User',
                email: session?.email || 'N/A',
                role: 'Cashier', // Default role for POS users
              }}
              shopDetails={{
                name: shop?.name || 'Shop Name',
                address: shop?.address || 'Shop Address',
                phone: session?.phoneNumber || '',
                email: session?.email || '',
              }}
            />
          </div>
        </TabsContent>

        <TabsContent value="pending">
          <PendingCheckoutsTab
            pendingCheckouts={pendingCheckouts}
            onViewDetails={setSelectedPendingCheckout}
            onCompleteCheckout={completePendingCheckout}
            onDeleteCheckout={completePendingCheckout} // Assuming delete is same as complete for now
            onLoadCheckout={loadPendingCheckout}
            hasDeleteAction={hasAction('orders', 'delete_orders')}
          />
        </TabsContent>
      </Tabs>

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
                processFinalCheckout('cash'); // Or pass payment method appropriately
              }}
              disabled={!tinNumber.trim()}
            >
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AddProductDialog
        isOpen={isAddProductDialogOpen}
        onClose={() => setIsAddProductDialogOpen(false)}
        onAddProduct={addProductByCode}
      />

      <CheckoutBarcodeScanner
        open={isBarcodeScannerOpen}
        onOpenChange={setIsBarcodeScannerOpen}
        onProductFound={handleProductFoundByScan}
        products={products}
        isLoading={productsLoading}
      />
    </AdminLayout>
  );
};

export default Checkout;
