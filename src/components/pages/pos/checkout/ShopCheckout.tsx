import React, { useState } from 'react';
import PageHeader from '@/components/layout/PageHeader';
import { ShoppingBag, Lock, Store, Sparkles } from 'lucide-react';
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
import { useAuth } from '@/contexts/AuthContext';
import { useProductsByShop, useShopById, useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';
import { Product } from '@/hooks/useGraphql';
import { AddProductDialog } from './AddProductCheckoutDialog';
import CheckoutBarcodeScanner from './CheckoutBarcodeScanner';
import { ProductSelectionCard } from './ProductSelectionCard';
import { CartSummaryCard } from './CartSummaryCard';
import { PendingCheckoutsTab } from './PendingCheckoutsTab';

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

interface ShopCheckoutProps {
  activeEmployee: any;
  onLock: () => void;
}

const ShopCheckout: React.FC<ShopCheckoutProps> = ({ activeEmployee, onLock }) => {
  const { color } = useThemeColor();
  const { toast } = useToast();
  const { session } = useAuth();
  const { hasAction } = usePrivilege();
  const { data: systemConfig } = useSystemConfig();

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
      phone: session?.phoneNumber || shop?.phone || '',
      email: session?.email || '',
      logo: shop?.logo || shop?.image || '',
      ssd: shop?.ssd || '',
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

  // Hardware barcode scanner support (USB / HID Keyboard scanners)
  const barcodeBufferRef = React.useRef<string>('');
  const lastKeyTimeRef = React.useRef<number>(0);
  const addProductByCodeRef = React.useRef(addProductByCode);

  React.useEffect(() => {
    addProductByCodeRef.current = addProductByCode;
  });

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const now = Date.now();
      const delay = now - lastKeyTimeRef.current;
      lastKeyTimeRef.current = now;

      // If the delay is more than 50ms, assume it is manual typing and reset the buffer
      if (delay > 50) {
        barcodeBufferRef.current = '';
      }

      if (e.key === 'Enter') {
        const finalCode = barcodeBufferRef.current.trim();
        if (finalCode.length >= 3) {
          e.preventDefault();
          e.stopPropagation();
          addProductByCodeRef.current(finalCode);
          barcodeBufferRef.current = '';
        }
        return;
      }

      // Collect alphanumeric characters or symbols (length 1)
      if (e.key.length === 1) {
        barcodeBufferRef.current += e.key;
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
    };
  }, []);

  const addProductToCart = (product: Product) => {
    // Play scanner beep sound
    try {
      const audio = new Audio('/Assets/sound/storescannerbeep.mp3');
      audio.play().catch(err => console.log('Audio playback prevented or failed:', err));
    } catch (e) {
      console.warn('Failed to initialize scanner audio:', e);
    }

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
      description: `Order completed with ${paymentMethod}${tinInfo}. Total: ${formatCurrencyWithConfig(
        cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * 1.08, systemConfig
      )}`,
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

  // Get initials for active employee
  const getInitials = (name: string) => {
    return name
      ? name
          .split(' ')
          .map((n) => n[0])
          .slice(0, 2)
          .join('')
          .toUpperCase()
      : 'POS';
  };

  const employeeName = activeEmployee?.fullnames || activeEmployee?.name || session?.fullName || 'Cashier Terminal';
  const employeeInitials = getInitials(employeeName);
  const employeeRole = activeEmployee?.Position || activeEmployee?.roleType || 'Terminal Cashier';

  return (
    <div className="space-y-6">
      <header className="sticky top-0 z-40 bg-white dark:bg-slate-900 border-b dark:border-slate-800 shadow-sm rounded-xl">
        <div className="flex flex-col md:flex-row items-center justify-between px-6 py-3 gap-4">
          <div className="flex items-center gap-3">
            {shop?.image ? (
              <img
                src={shop.image}
                alt={shop.name}
                className="w-10 h-10 rounded-xl object-cover border border-slate-205 dark:border-slate-800 shadow-sm shrink-0"
              />
            ) : (
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold shadow-md shrink-0">
                <Store className="h-5 w-5" />
              </div>
            )}
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
                {shop?.name || 'Retail'} <span className="text-primary">POS</span>
                <span className="text-[10px] bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground px-2 py-0.5 rounded-full font-bold">Shop</span>
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setActiveTab('current')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'current'
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              POS Catalogue
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('pending')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative ${
                activeTab === 'pending'
                  ? 'bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary-foreground'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              Pending Invoices
              {pendingCheckouts.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {pendingCheckouts.length}
                </span>
              )}
            </button>
          </nav>

          {/* Quick Access Actions */}
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="flex items-center gap-1.5 justify-end">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Session Active</p>
              </div>
              <p className="text-sm font-black text-slate-800 dark:text-slate-200 leading-tight">{employeeName}</p>
              <p className="text-[10px] text-slate-400 font-medium capitalize mt-0.5">{employeeRole}</p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onLock}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs"
            >
              <Lock className="mr-1.5 h-3.5 w-3.5" />
              Lock Terminal
            </Button>
          </div>
        </div>
      </header>

      {activeTab === 'current' && (
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
            shopId={session?.shop_id || undefined}
            currentUser={{
              id: activeEmployee?.id || session?.id || '',
              name: employeeName,
              email: activeEmployee?.email || session?.email || 'N/A',
              role: employeeRole,
            }}
            shopDetails={{
              name: shop?.name || 'Shop Name',
              address: shop?.address || 'Shop Address',
              phone: session?.phoneNumber || '',
              email: session?.email || '',
            }}
          />
        </div>
      )}

      {activeTab === 'pending' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-sm">
          <PendingCheckoutsTab
            pendingCheckouts={pendingCheckouts}
            onViewDetails={setSelectedPendingCheckout}
            onCompleteCheckout={completePendingCheckout}
            onDeleteCheckout={completePendingCheckout} // Assuming delete is same as complete for now
            onLoadCheckout={loadPendingCheckout}
            hasDeleteAction={hasAction('orders', 'delete_orders')}
          />
        </div>
      )}

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
        onScanSuccess={addProductByCode}
      />
    </div>
  );
};

export default ShopCheckout;
