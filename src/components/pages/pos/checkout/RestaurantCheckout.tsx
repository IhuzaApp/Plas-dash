'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useRestaurantById, useSystemConfig, useRestaurantOrders, useAssignOrder } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { apiGet, apiPost } from '@/lib/api';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, setDoc, updateDoc } from 'firebase/firestore';
import {
  Utensils,
  Search,
  ShoppingCart,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  RotateCcw,
  Sparkles,
  Users,
  Check,
  ChevronDown,
  Trash2,
  Plus,
  Minus,
  Edit,
  DollarSign,
  AlertCircle,
  FileText,
  Percent,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';



// Mock tables for dine-in tracking
const TABLES = Array.from({ length: 12 }, (_, i) => ({
  id: `T${i + 1}`,
  number: i + 1,
  capacity: i % 2 === 0 ? 4 : 2,
}));

// Fallback high-quality restaurant dishes in case DB is empty
const MOCK_DISHES = [
  {
    id: 'mock-1',
    name: 'Grilled Salmon Steak',
    price: 80,
    category: 'Sea Food',
    image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Fresh Atlantic salmon grilled with garlic butter and herbs',
    isVeg: false,
    isEgg: false,
    isTrending: true,
  },
  {
    id: 'mock-2',
    name: 'Cheese Burst Pizza',
    price: 66,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Double cheese pizza with rich herb tomato sauce',
    isVeg: true,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-3',
    name: 'Garlic Butter Shrimp',
    price: 25,
    category: 'Sea Food',
    image: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Sautéed prawns in velvety garlic white wine butter sauce',
    isVeg: false,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-4',
    name: 'Chicken Taco',
    price: 33,
    category: 'Tacos',
    image: 'https://images.unsplash.com/photo-1565299585323-38d6b0865b47?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Crispy corn shells stuffed with seasoned shredded chicken',
    isVeg: false,
    isEgg: false,
    isTrending: true,
  },
  {
    id: 'mock-5',
    name: 'Tomato Basil Soup',
    price: 44,
    category: 'Soups',
    image: 'https://images.unsplash.com/photo-1547592165-e1d17fed6005?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Creamy roasted tomato soup garnished with fresh basil oil',
    isVeg: true,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-6',
    name: 'Grilled Chicken Salad',
    price: 49,
    category: 'Salads',
    image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Tossed greens, avocado, cherry tomatoes with vinaigrette',
    isVeg: true,
    isEgg: false,
    isTrending: true,
  },
  {
    id: 'mock-7',
    name: 'Vegetable Roll',
    price: 66,
    category: 'Sushi',
    image: 'https://images.unsplash.com/photo-1579871494447-9811cf80d66c?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Fresh cucumber, avocado, and pickled radish sushi roll',
    isVeg: true,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-8',
    name: 'Lemon Mint Juice',
    price: 96,
    category: 'Beverages',
    image: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Ice-blended sweet lemonade with fresh mint leaves',
    isVeg: true,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-9',
    name: 'Grilled Veggie Taco',
    price: 69,
    category: 'Tacos',
    image: 'https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Charred zucchini, bell peppers, corn salsa, and lime crema',
    isVeg: true,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-10',
    name: 'Shrimp Tom Yum',
    price: 25,
    category: 'Soups',
    image: 'https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Spicy lemongrass broth with prawns and oyster mushrooms',
    isVeg: false,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-11',
    name: 'Corn Pizza',
    price: 96,
    category: 'Pizza',
    image: 'https://images.unsplash.com/photo-1593560708920-61dd98c46a4e?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Sweet corn, green chilies, mozzarella, and marinara',
    isVeg: true,
    isEgg: false,
    isTrending: false,
  },
  {
    id: 'mock-12',
    name: 'Chicken Noodle Soup',
    price: 45,
    category: 'Soups',
    image: 'https://images.unsplash.com/photo-1603105037880-880cd4edfb0d?q=80&w=300&h=200&auto=format&fit=crop',
    description: 'Shredded chicken, egg noodles, carrots, and celery',
    isVeg: false,
    isEgg: true,
    isTrending: false,
  },
];

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  size: 'Small' | 'Medium' | 'Large';
  note: string;
  image?: string;
  category?: string;
}

interface KitchenTicket {
  id: string; // Token ID e.g., #TK-45
  orderId: string;
  tableId?: string;
  orderType: 'Dine In' | 'Take Away' | 'Delivery' | 'Table';
  items: CartItem[];
  waiterName: string;
  timestamp: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
}

interface ActiveTable {
  id: string;
  number: number;
  name?: string;
  status: 'empty' | 'eating' | 'billed';
  waiterName?: string;
  customerName?: string;
  cart: CartItem[];
  orderId?: string;
  tokenId?: string;
  timestamp?: string;
}

interface RestaurantCheckoutProps {
  activeEmployee: any;
  onLock: () => void;
}

const RestaurantCheckout: React.FC<RestaurantCheckoutProps> = ({ activeEmployee, onLock }) => {
  const { color } = useThemeColor();
  const { toast } = useToast();
  const { session } = useAuth();
  const { shopSession } = useShopSession();
  const { data: systemConfig } = useSystemConfig();

  const restaurantId =
    session?.restaurant_id ||
    (shopSession?.isRestaurant ? shopSession?.shopId : null);

  const { data: restaurantData, isLoading: restaurantLoading } = useRestaurantById(
    restaurantId || ''
  );
  const restaurant = restaurantData?.Restaurants_by_pk;

  const activeServer = activeEmployee;

  // Active top tab (matches header)
  const [activeTab, setActiveTab] = useState<'POS' | 'Orders' | 'Kitchen' | 'Table' | 'Delivery'>('POS');

  // Fetch online restaurant orders and status update mutation
  const { data: restaurantOrdersData, refetch: refetchRestaurantOrders } = useRestaurantOrders();
  const assignOrder = useAssignOrder();

  const incomingOrders = restaurantOrdersData?.orders || [];

  const deliveryOrders = useMemo(() => {
    return incomingOrders.filter((o: any) => {
      const isOurRestaurant = o.restaurant_id === restaurantId || o.Restaurant?.id === restaurantId;
      if (!isOurRestaurant) return false;
      const statusUpper = (o.status || '').toUpperCase();
      // Show orders that are WAITING_FOR_CONFIRMATION or PENDING (not accepted yet)
      return statusUpper === 'WAITING_FOR_CONFIRMATION' || statusUpper === 'PENDING';
    });
  }, [incomingOrders, restaurantId]);

  // Set default selected waiter to the logged in employee name
  useEffect(() => {
    if (activeEmployee?.fullnames) {
      setSelectedWaiter(activeEmployee.fullnames);
    }
  }, [activeEmployee]);

  // Food filter states
  const [selectedCategory, setSelectedCategory] = useState<string>('All Menus');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterNonVeg, setFilterNonVeg] = useState(false);
  const [filterEgg, setFilterEgg] = useState(false);

  // Cart & Order Options
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedOrderType, setSelectedOrderType] = useState<'Dine In' | 'Take Away' | 'Delivery' | 'Table'>('Dine In');
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [employees, setEmployees] = useState<any[]>([]);
  const [selectedWaiter, setSelectedWaiter] = useState<string>('');

  useEffect(() => {
    const fetchEmployees = async () => {
      if (!restaurantId) return;
      try {
        const data = await apiGet<{ orgEmployees: any[] }>('/api/queries/org-employees');
        const allEmployees = data.orgEmployees || [];
        const filtered = allEmployees.filter(emp => 
          emp.shop_id === restaurantId || 
          emp.restaurant_id === restaurantId
        );
        setEmployees(filtered);
      } catch (e) {
        console.error(e);
      }
    };
    fetchEmployees();
  }, [restaurantId]);

  const [customerName, setCustomerName] = useState('Walk-in Customer');

  // Dynamic custom tables
  const [isNewTable, setIsNewTable] = useState(true);
  const [newTableName, setNewTableName] = useState('');

  // Interactive items
  const [editingItemNote, setEditingItemNote] = useState<{ itemId: string; index: number; note: string } | null>(null);
  const [isNoteDialogOpen, setIsNoteDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'cash' | 'card' | 'momo'>('cash');
  const [taxRate, setTaxRate] = useState(18); // Default 18% as screenshot

  // Sync state for kitchen tickets & active tables
  const [kitchenTickets, setKitchenTickets] = useState<KitchenTicket[]>([]);
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);

  // Load state from localStorage on mount
  // Subscribe to Firestore for real-time kitchen tickets sync, and load tables from localStorage
  useEffect(() => {
    // 1. Load active tables from localStorage
    try {
      const storedTables = localStorage.getItem('restaurantActiveTables');
      if (storedTables) {
        setActiveTables(JSON.parse(storedTables));
      } else {
        setActiveTables([]);
        localStorage.setItem('restaurantActiveTables', JSON.stringify([]));
      }
    } catch (e) {
      console.error('Error loading tables:', e);
    }

    if (!restaurantId) return;

    // 2. Subscribe to kitchen tickets for this restaurant
    const ticketsCollectionRef = collection(db, 'kitchen_tickets', restaurantId, 'tickets');
    const unsubscribe = onSnapshot(ticketsCollectionRef, (snapshot) => {
      try {
        const ticketsList: KitchenTicket[] = [];
        snapshot.forEach((docSnap) => {
          ticketsList.push(docSnap.data() as KitchenTicket);
        });
        // Sort by timestamp ascending (oldest first)
        ticketsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
        
        setKitchenTickets(ticketsList);
        localStorage.setItem('restaurantKitchenOrders', JSON.stringify(ticketsList));
        // Trigger local storage sync event
        window.dispatchEvent(new Event('storage'));
      } catch (err) {
        console.error('Error handling tickets snapshot:', err);
      }
    }, (error) => {
      console.error('Error subscribing to kitchen tickets:', error);
    });

    // 3. Listen to local storage changes for active tables updates
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'restaurantActiveTables') {
        try {
          const storedTables = localStorage.getItem('restaurantActiveTables');
          if (storedTables) {
            setActiveTables(JSON.parse(storedTables));
          }
        } catch (err) {
          console.error('Error syncing tables:', err);
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [restaurantId]);

  // Update customer display cart data in localStorage
  useEffect(() => {
    localStorage.setItem('customerDisplayCart', JSON.stringify(cart));
    localStorage.setItem(
      'customerDisplayShop',
      JSON.stringify({
        name: restaurant?.name || 'Dreams Restaurant',
        address: restaurant?.location || 'Restaurant Address',
        phone: restaurant?.phone || session?.phoneNumber || '',
        email: restaurant?.email || session?.email || '',
      })
    );
  }, [cart, restaurant, session]);

  // Combine DB dishes and Mock dishes
  const foodItems = useMemo(() => {
    const dbDishes = (restaurant?.restaurant_dishes || []).map((rd: any) => {
      const category = rd.dishes?.category;
      const ingredients = rd.dishes?.ingredients;
      
      const isVeg = typeof category === 'string' && category.toLowerCase().includes('veg');
      
      let isEgg = false;
      if (typeof ingredients === 'string') {
        isEgg = ingredients.toLowerCase().includes('egg');
      } else if (Array.isArray(ingredients)) {
        isEgg = ingredients.some((i: any) => typeof i === 'string' && i.toLowerCase().includes('egg'));
      }

      return {
        id: rd.id,
        name: rd.dishes?.name || rd.ProductNames?.name || 'Unnamed Dish',
        price: parseFloat(rd.price) || 0,
        category: category || 'General',
        image: rd.image || rd.dishes?.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c',
        description: rd.dishes?.description || '',
        isVeg,
        isEgg,
        isTrending: !!rd.promo,
      };
    });

    if (dbDishes.length === 0) {
      return MOCK_DISHES;
    }
    return dbDishes;
  }, [restaurant]);

  // Categories list
  const categories = useMemo(() => {
    const list = new Set<string>();
    list.add('All Menus');
    foodItems.forEach((item: any) => {
      if (item.category) list.add(item.category);
    });
    return Array.from(list);
  }, [foodItems]);

  // Filtered Food items
  const filteredFoodItems = useMemo(() => {
    return foodItems.filter((item: any) => {
      const matchesCategory =
        selectedCategory === 'All Menus' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter types
      let matchesType = true;
      if (filterVeg && !item.isVeg) matchesType = false;
      if (filterNonVeg && item.isVeg) matchesType = false;
      if (filterEgg && !item.isEgg) matchesType = false;

      return matchesCategory && matchesSearch && matchesType;
    });
  }, [foodItems, selectedCategory, searchQuery, filterVeg, filterNonVeg, filterEgg]);

  // Recent Orders list (from active kitchen tickets)
  const recentOrders = useMemo(() => {
    return kitchenTickets.slice(-5).reverse();
  }, [kitchenTickets]);

  const addToCart = (dish: any) => {
    const existing = cart.find(item => item.id === dish.id);
    if (existing) {
      setCart(
        cart.map(item =>
          item.id === dish.id ? { ...item, quantity: item.quantity + 1 } : item
        )
      );
    } else {
      setCart([
        ...cart,
        {
          id: dish.id,
          name: dish.name,
          price: dish.price,
          quantity: 1,
          size: 'Medium',
          note: '',
          image: dish.image,
          category: dish.category,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCart(
      cart
        .map(item => (item.id === id ? { ...item, quantity: item.quantity + change } : item))
        .filter(item => item.quantity > 0)
    );
  };

  const removeItem = (id: string) => {
    setCart(cart.filter(item => item.id !== id));
  };

  const changeItemSize = (id: string, size: 'Small' | 'Medium' | 'Large') => {
    setCart(cart.map(item => (item.id === id ? { ...item, size } : item)));
  };

  const openNoteDialog = (itemId: string, index: number, currentNote: string) => {
    setEditingItemNote({ itemId, index, note: currentNote });
    setIsNoteDialogOpen(true);
  };

  const saveItemNote = () => {
    if (editingItemNote) {
      setCart(
        cart.map((item, idx) =>
          item.id === editingItemNote.itemId && idx === editingItemNote.index
            ? { ...item, note: editingItemNote.note }
            : item
        )
      );
      setIsNoteDialogOpen(false);
      setEditingItemNote(null);
    }
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const getTax = () => {
    return (getSubtotal() * taxRate) / 100;
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  // Kitchen Ticket Print Formatter
  const printKitchenTicket = (ticket: KitchenTicket) => {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>KOT #${ticket.id}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 14px; margin: 0; padding: 10px; width: 280px; }
          .header { text-align: center; border-bottom: 2px dashed #000; padding-bottom: 10px; margin-bottom: 10px; }
          .title { font-size: 22px; font-weight: bold; }
          .token { font-size: 28px; font-weight: bold; background: #000; color: #fff; padding: 4px 10px; display: inline-block; margin-top: 5px; }
          .details { margin-bottom: 10px; line-height: 1.4; }
          .items-table { width: 100%; border-collapse: collapse; border-bottom: 2px dashed #000; margin-bottom: 10px; }
          .items-table th { text-align: left; border-bottom: 1px solid #000; padding-bottom: 5px; }
          .items-table td { padding: 5px 0; vertical-align: top; }
          .item-note { font-style: italic; font-size: 12px; padding-left: 10px; color: #555; }
          .footer { text-align: center; font-size: 11px; margin-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="title">KITCHEN ORDER</div>
          <div class="token">${ticket.id}</div>
        </div>
        <div class="details">
          <strong>Order ID:</strong> ${ticket.orderId}<br/>
          <strong>Waiter:</strong> ${ticket.waiterName}<br/>
          <strong>Type:</strong> ${ticket.orderType} ${ticket.tableId ? `- Table ${ticket.tableId.replace('T', '')}` : ''}<br/>
          <strong>Time:</strong> ${new Date(ticket.timestamp).toLocaleTimeString()}<br/>
        </div>
        <table class="items-table">
          <thead>
            <tr>
              <th style="width: 40px;">Qty</th>
              <th>Item Name [Size]</th>
            </tr>
          </thead>
          <tbody>
            ${ticket.items
              .map(
                item => `
              <tr>
                <td><strong>${item.quantity}x</strong></td>
                <td>
                  ${item.name} <span style="font-size:11px;">[${item.size}]</span>
                  ${item.note ? `<div class="item-note">* Note: ${item.note}</div>` : ''}
                </td>
              </tr>
            `
              )
              .join('')}
          </tbody>
        </table>
        <div class="footer">
          *** Placed via Dreams POS ***
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  // Customer Receipt Print Formatter
  const printCustomerReceipt = (
    ticketItems: CartItem[],
    waiter: string,
    tableId: string,
    orderType: string,
    payMethod: string,
    txnId: string,
    tokenId: string
  ) => {
    const subtotal = ticketItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt ${txnId}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; margin: 0; padding: 10px; width: 280px; }
          .logo { text-align: center; font-size: 20px; font-weight: bold; margin-bottom: 2px; }
          .address { text-align: center; font-size: 11px; margin-bottom: 8px; line-height: 1.3; }
          .separator { border-top: 1px dashed #000; margin: 8px 0; }
          .details { margin-bottom: 10px; line-height: 1.4; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .item-name { flex: 1; }
          .totals { font-weight: bold; margin-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 11px; }
        </style>
      </head>
      <body>
        <div class="logo">DREAMS RESTAURANT</div>
        <div class="address">
          ${restaurant?.name || 'Dreams POS Brand'}<br/>
          ${restaurant?.location || 'Kigali, Rwanda'}<br/>
          TIN: ${restaurant?.tin || '100234589'}<br/>
          Phone: ${restaurant?.phone || '0780000000'}<br/>
          USSD Code: ${restaurant?.ussd || '*182*8*1*12345#'}
        </div>
        <div class="separator"></div>
        <div class="details">
          <strong>Txn:</strong> ${txnId}<br/>
          <strong>Token:</strong> ${tokenId}<br/>
          <strong>Waiter:</strong> ${waiter}<br/>
          <strong>Table:</strong> ${orderType === 'Table' || orderType === 'Dine In' ? tableId.replace('T', '') : 'N/A'}<br/>
          <strong>Date:</strong> ${new Date().toLocaleString()}
        </div>
        <div class="separator"></div>
        <div class="items">
          ${ticketItems
            .map(
              item => `
            <div class="item-row">
              <span class="item-name">${item.name} (${item.size}) x${item.quantity}</span>
              <span>${formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}</span>
            </div>
          `
            )
            .join('')}
        </div>
        <div class="separator"></div>
        <div class="totals">
          <div class="item-row">
            <span>Subtotal:</span>
            <span>${formatCurrencyWithConfig(subtotal, systemConfig)}</span>
          </div>
          <div class="item-row">
            <span>Tax (18%):</span>
            <span>${formatCurrencyWithConfig(tax, systemConfig)}</span>
          </div>
          <div class="item-row" style="font-size: 15px;">
            <span>TOTAL DUE:</span>
            <span>${formatCurrencyWithConfig(total, systemConfig)}</span>
          </div>
        </div>
        <div class="separator"></div>
        <div class="details">
          <strong>Payment Method:</strong> ${payMethod.toUpperCase()}<br/>
          Status: PAID
        </div>
        <div class="footer">
          Thank you for dining with us!<br/>
          Murakoze cyane!
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  const handleAcceptOnlineOrder = async (order: any) => {
    try {
      await assignOrder.mutateAsync({
        id: order.id,
        shopper_id: order.shopper_id || null,
        status: 'accepted',
        type: 'restaurant',
      });

      // Use order.OrderID or order.id as the token number
      const orderTokenId = order.OrderID != null ? String(order.OrderID) : order.id;
      const tokenNumber = `TK-${orderTokenId}`;
      
      const itemsMapped = order.restaurant_order_items?.map((item: any) => ({
        id: item.id || item.dish_id,
        name: item.restaurant_dishes?.dishes?.name || 'Unknown Dish',
        price: parseFloat(item.price || '0'),
        quantity: item.quantity || 1,
        size: 'Medium' as const,
        note: '',
      })) || [];

      const newTicket: KitchenTicket = {
        id: tokenNumber,
        orderId: order.id,
        orderType: 'Delivery',
        items: itemsMapped,
        waiterName: 'Online Order',
        timestamp: new Date().toISOString(),
        status: 'Pending',
      };

      // Save ticket to Firestore
      if (restaurantId) {
        await setDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', newTicket.id), newTicket);
      }

      // Persist to database (kitchenQueue table)
      try {
        await apiPost('/api/mutations/kitchen-queue', {
          dishesOrdered: itemsMapped.map((item: any) => ({
            id: item.id,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
          })),
          restaurant_id: restaurantId,
          restaurant_order_id: order.id,
          status: 'Pending',
          table_number: '',
          token_number: tokenNumber,
          updated_at: new Date().toISOString(),
          waiter_id: null,
        });
      } catch (dbErr) {
        console.error('[Kitchen Queue] Failed to save online order ticket to DB:', dbErr);
      }

      // Trigger print popup for the Kitchen Ticket (KOT)
      printKitchenTicket(newTicket);

      toast({
        title: 'Order Accepted',
        description: `Order accepted, sent to kitchen, and token ${tokenNumber} printed.`,
      });
      refetchRestaurantOrders();
    } catch (e) {
      toast({
        title: 'Error accepting order',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  const handleCollectOnlineOrder = async (order: any) => {
    try {
      await assignOrder.mutateAsync({
        id: order.id,
        shopper_id: order.shopper_id || null,
        status: 'delivered',
        type: 'restaurant',
      });

      // Find token ID from kitchenTickets if it exists, otherwise generate/fallback
      const matchedTicket = kitchenTickets.find(t => t.orderId === order.id);
      const tokenNumber = matchedTicket ? matchedTicket.id : 'N/A';

      // Map cart items for receipt printing
      const cartItems: CartItem[] = order.restaurant_order_items?.map((item: any) => ({
        id: item.id || item.dish_id,
        name: item.restaurant_dishes?.dishes?.name || 'Unknown Dish',
        price: parseFloat(item.price || '0'),
        quantity: item.quantity || 1,
        size: 'Medium' as const,
        note: '',
      })) || [];

      // Print Customer Receipt (shows PAID ONLINE)
      printCustomerReceipt(
        cartItems,
        'Online Client',
        'Online',
        'Delivery',
        'Paid Online',
        order.id.slice(0, 8).toUpperCase(),
        tokenNumber
      );

      // Remove from kitchenTickets in KDS/Firestore (mark as Served/Collected)
      if (matchedTicket && restaurantId) {
        await updateDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', matchedTicket.id), {
          status: 'Served',
        });
      }

      toast({
        title: 'Order Collected',
        description: 'Order marked as completed and receipt printed successfully.',
      });
      refetchRestaurantOrders();
    } catch (e) {
      toast({
        title: 'Error processing collection',
        description: e instanceof Error ? e.message : 'Unknown error',
        variant: 'destructive',
      });
    }
  };

  // Place Order flow (sends ticket to kitchen)
  const placeKitchenOrder = async () => {
    if (cart.length === 0) {
      toast({ title: 'Cart Empty', description: 'Please add items to place order.' });
      return;
    }

    const tokenNumber = `#TK-${Math.floor(Math.random() * 90 + 10)}`;
    const orderId = `ORD-${Date.now().toString().slice(-6)}`;

    let tableId = selectedTable;
    let tableName = '';

    if (selectedOrderType === 'Table' || selectedOrderType === 'Dine In') {
      if (isNewTable) {
        tableId = `tbl-${Date.now()}`;
        tableName = newTableName.trim() || `Table #${Math.floor(Math.random() * 900 + 100)}`;
      } else {
        const existing = activeTables.find(t => t.id === selectedTable);
        tableName = (existing && existing.name) ? existing.name : `Table #${Math.floor(Math.random() * 900 + 100)}`;
      }
    }

    const newTicket: KitchenTicket = {
      id: tokenNumber,
      orderId,
      tableId: selectedOrderType === 'Table' || selectedOrderType === 'Dine In' ? tableId : undefined,
      orderType: selectedOrderType,
      items: [...cart],
      waiterName: selectedWaiter,
      timestamp: new Date().toISOString(),
      status: 'Pending',
    };

    // Save ticket to Firestore
    if (restaurantId) {
      try {
        await setDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', newTicket.id), newTicket);
      } catch (err) {
        console.error('Error saving ticket to Firestore:', err);
      }
    }

    // Persist to database (kitchenQueue table)
    try {
      await apiPost('/api/mutations/kitchen-queue', {
        dishesOrdered: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          note: item.note || '',
        })),
        restaurant_id: restaurantId,
        restaurant_order_id: null,
        status: 'Pending',
        table_number: (selectedOrderType === 'Table' || selectedOrderType === 'Dine In')
          ? (activeTables.find(t => t.id === tableId)?.name || tableId || '')
          : '',
        token_number: tokenNumber,
        updated_at: new Date().toISOString(),
        waiter_id: activeEmployee?.id || null,
      });
    } catch (dbErr) {
      console.error('[Kitchen Queue] Failed to save POS ticket to DB:', dbErr);
    }

    // Update active table state if table was selected
    if (selectedOrderType === 'Table' || selectedOrderType === 'Dine In') {
      const tableExists = activeTables.some(t => t.id === tableId);
      let updatedTables;
      if (tableExists) {
        updatedTables = activeTables.map(t => {
          if (t.id === tableId) {
            return {
              ...t,
              status: 'eating' as const,
              waiterName: selectedWaiter,
              customerName: customerName,
              cart: [...cart],
              orderId,
              tokenId: tokenNumber,
              timestamp: new Date().toISOString(),
            };
          }
          return t;
        });
      } else {
        const newTable: ActiveTable = {
          id: tableId,
          name: tableName,
          number: 0,
          status: 'eating' as const,
          waiterName: selectedWaiter,
          customerName: customerName,
          cart: [...cart],
          orderId,
          tokenId: tokenNumber,
          timestamp: new Date().toISOString(),
        };
        updatedTables = [...activeTables, newTable];
      }
      setActiveTables(updatedTables);
      localStorage.setItem('restaurantActiveTables', JSON.stringify(updatedTables));
      
      setSelectedTable(tableId);
      setIsNewTable(false);
    }

    // Trigger Print Kitchen Ticket
    printKitchenTicket(newTicket);

    // Toast
    toast({
      title: 'Order Sent to Kitchen',
      description: `Token ${tokenNumber} generated and printed.`,
    });

    // Clear cart
    resetPOSCart();
  };

  // Billing summary layout (pre-bill)
  const printPreBill = (table: ActiveTable) => {
    const subtotal = table.cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = (subtotal * taxRate) / 100;
    const total = subtotal + tax;

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Pre-Bill ${table.name || 'Table'}</title>
        <style>
          body { font-family: 'Courier New', monospace; font-size: 13px; margin: 0; padding: 10px; width: 280px; text-align:center;}
          .title { font-size: 18px; font-weight: bold; margin-bottom: 2px; }
          .subtitle { font-size: 14px; font-weight: bold; margin-bottom: 8px; }
          .details { text-align: left; margin-bottom: 10px; line-height: 1.4; }
          .item-row { display: flex; justify-content: space-between; margin-bottom: 4px; }
          .totals { font-weight: bold; text-align: left; }
        </style>
      </head>
      <body>
        <div class="title">DREAMS RESTAURANT</div>
        <div class="subtitle">PRE-BILL (NOT A RECEIPT)</div>
        <hr style="border-top:1px dashed #000;"/>
        <div class="details">
          <strong>Table:</strong> ${table.name || 'Table'}<br/>
          <strong>Waiter:</strong> ${table.waiterName || 'N/A'}<br/>
          <strong>Token:</strong> ${table.tokenId || 'N/A'}<br/>
          <strong>Date:</strong> ${new Date().toLocaleString()}
        </div>
        <hr style="border-top:1px dashed #000;"/>
        <div class="details">
          ${table.cart
            .map(
              item => `
            <div class="item-row">
              <span>${item.name} (${item.size}) x${item.quantity}</span>
              <span>${formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}</span>
            </div>
          `
            )
            .join('')}
        </div>
        <hr style="border-top:1px dashed #000;"/>
        <div class="totals">
          <div class="item-row">
            <span>Subtotal:</span>
            <span>${formatCurrencyWithConfig(subtotal, systemConfig)}</span>
          </div>
          <div class="item-row">
            <span>Tax (18%):</span>
            <span>${formatCurrencyWithConfig(tax, systemConfig)}</span>
          </div>
          <div class="item-row" style="font-size: 14px; font-weight:bold;">
            <span>Estimated Total:</span>
            <span>${formatCurrencyWithConfig(total, systemConfig)}</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }
  };

  // Final checkout from Active Table
  const [activeCheckoutTable, setActiveCheckoutTable] = useState<ActiveTable | null>(null);

  const startTableCheckout = (table: ActiveTable) => {
    setActiveCheckoutTable(table);
    setSelectedPaymentMethod('cash');
    setIsPaymentDialogOpen(true);
  };

  const confirmTablePayment = () => {
    if (!activeCheckoutTable) return;

    const txnId = `TRX-${Date.now().toString().slice(-6)}`;
    
    // Print receipt
    printCustomerReceipt(
      activeCheckoutTable.cart,
      activeCheckoutTable.waiterName || selectedWaiter,
      activeCheckoutTable.id,
      'Table',
      selectedPaymentMethod,
      txnId,
      activeCheckoutTable.tokenId || '#TK-00'
    );

    // Remove table from activeTables
    const updatedTables = activeTables.filter(t => t.id !== activeCheckoutTable.id);
    setActiveTables(updatedTables);
    localStorage.setItem('restaurantActiveTables', JSON.stringify(updatedTables));

    // Update KDS ticket associated with this order to Served in Firestore
    const ticketToServe = kitchenTickets.find(t => t.orderId === activeCheckoutTable.orderId);
    if (ticketToServe && restaurantId) {
      updateDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', ticketToServe.id), {
        status: 'Served'
      }).catch(err => console.error('Error serving ticket on table payment:', err));
    }

    toast({
      title: 'Payment Completed',
      description: `${activeCheckoutTable.name || 'Table'} bill paid. Receipt printed.`,
    });

    setIsPaymentDialogOpen(false);
    setActiveCheckoutTable(null);
    resetPOSCart();
  };

  const resetPOSCart = () => {
    setCart([]);
    setSelectedTable('');
    setIsNewTable(true);
    setNewTableName('');
    setCustomerName('Walk-in Customer');
  };

  // Load a table's bill back into active POS cart
  const loadTableCart = (table: ActiveTable) => {
    setCart(table.cart);
    setSelectedOrderType('Table');
    setSelectedTable(table.id);
    setIsNewTable(false);
    if (table.name) setNewTableName(table.name);
    if (table.waiterName) setSelectedWaiter(table.waiterName);
    if (table.customerName) setCustomerName(table.customerName);
    setActiveTab('POS');
    toast({
      title: 'Table Loaded',
      description: `Cart loaded for ${table.name || 'Table'}. You can add more items now.`,
    });
  };



  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Dreams POS Header Nav */}
      <header className="sticky top-0 z-40 bg-white border-b shadow-sm">
        <div className="flex items-center justify-between px-6 py-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary text-white font-bold shadow-md">
              <Utensils className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-extrabold text-lg tracking-tight text-slate-800 flex items-center gap-1.5">
                Dreams <span className="text-primary">POS</span>
                <span className="text-[10px] bg-emerald-500/10 text-emerald-600 px-2 py-0.5 rounded-full font-bold">Restaurant</span>
              </h1>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="flex items-center space-x-1">
            <button
              onClick={() => setActiveTab('POS')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'POS'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              POS Menu
            </button>
            <button
              onClick={() => setActiveTab('Orders')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative ${
                activeTab === 'Orders'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Orders & Tables
              {activeTables.filter(t => t.status === 'eating').length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {activeTables.filter(t => t.status === 'eating').length}
                </span>
              )}
            </button>
            <button
              onClick={() => setActiveTab('Kitchen')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors ${
                activeTab === 'Kitchen'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Kitchen Tickets
            </button>
            <button
              onClick={() => setActiveTab('Delivery')}
              className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors relative ${
                activeTab === 'Delivery'
                  ? 'bg-primary/10 text-primary'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              Delivery Orders
              {deliveryOrders.length > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-[10px] flex items-center justify-center font-bold">
                  {deliveryOrders.length}
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
              <p className="text-sm font-black text-slate-800">{activeServer?.fullnames || selectedWaiter}</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={onLock}
              className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700 font-bold text-xs"
            >
              Lock Terminal
            </Button>
          </div>
        </div>
      </header>

      {/* POS Menu View */}
      {activeTab === 'POS' && (
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6">
          {/* Main Left Menu Column */}
          <div className="lg:col-span-8 space-y-6">
            {/* Recent Orders Carousel */}
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-3">Recent Kitchen Batches</h2>
              <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-thin">
                {recentOrders.map((ticket, index) => (
                  <Card key={ticket.id} className="min-w-[210px] max-w-[210px] shrink-0 border-l-4 border-l-primary shadow-sm">
                    <CardContent className="p-3 space-y-1 text-xs">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-slate-800">{ticket.id}</span>
                        <Badge
                          className={`text-[9px] px-1.5 py-0.5 leading-none ${
                            ticket.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700 hover:bg-amber-100'
                              : ticket.status === 'Preparing'
                                ? 'bg-primary/10 text-primary hover:bg-primary/10'
                                : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {ticket.status}
                        </Badge>
                      </div>
                      <p className="font-semibold text-slate-600">
                        {ticket.orderType === 'Table' && ticket.tableId
                          ? `Table ${ticket.tableId.replace('T', '')}`
                          : ticket.orderType}
                      </p>
                      <p className="text-slate-400 font-medium">Waiter: {ticket.waiterName.split(' ')[1]}</p>
                      <div className="w-full bg-slate-100 h-1 rounded-full overflow-hidden mt-1">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            ticket.status === 'Pending'
                              ? 'w-1/3 bg-amber-500'
                              : ticket.status === 'Preparing'
                                ? 'w-2/3 bg-primary'
                                : 'w-full bg-emerald-500'
                          }`}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                {recentOrders.length === 0 && (
                  <div className="text-xs text-slate-400 py-3">No active kitchen orders placed recently.</div>
                )}
              </div>
            </div>

            {/* Menu Categories */}
            <div className="bg-white rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <h3 className="font-bold text-slate-800">Menu Categories</h3>
                  <div className="flex items-center gap-3 border-l pl-4 text-xs font-semibold text-slate-600">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterVeg}
                        onChange={e => setFilterVeg(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Veg</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterNonVeg}
                        onChange={e => setFilterNonVeg(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Non Veg</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={filterEgg}
                        onChange={e => setFilterEgg(e.target.checked)}
                        className="rounded text-primary focus:ring-primary"
                      />
                      <span>Egg</span>
                    </label>
                  </div>
                </div>

                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search menu..."
                    className="pl-9 bg-slate-50 focus-visible:ring-primary"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              {/* Category selector */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? 'default' : 'outline'}
                    size="sm"
                    className={`rounded-full text-xs font-bold shrink-0 ${
                      selectedCategory === cat
                        ? 'bg-primary hover:bg-primary/90 text-white'
                        : 'text-slate-600 border-slate-200'
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {filteredFoodItems.map((dish: any) => (
                <Card
                  key={dish.id}
                  className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer border shadow-sm group"
                  onClick={() => addToCart(dish)}
                >
                  <div className="relative h-40 bg-slate-100 overflow-hidden">
                    <img
                      src={dish.image}
                      alt={dish.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {dish.isTrending && (
                      <Badge className="absolute top-2 left-2 bg-gradient-to-r from-amber-500 to-orange-600 text-[10px] font-bold text-white uppercase px-2 py-0.5 leading-none">
                        Must Try
                      </Badge>
                    )}
                    <span className="absolute bottom-2 right-2 bg-slate-900/85 text-white font-bold text-xs px-2.5 py-1 rounded-lg">
                      ${dish.price.toFixed(2)}
                    </span>
                  </div>
                  <CardContent className="p-4 space-y-1">
                    <div className="flex justify-between items-start gap-2">
                      <h4 className="font-extrabold text-sm text-slate-800 leading-tight truncate">
                        {dish.name}
                      </h4>
                      <Badge variant="outline" className="text-[9px] h-4 py-0 leading-none">
                        {dish.category}
                      </Badge>
                    </div>
                    <p className="text-xs text-slate-400 line-clamp-2">{dish.description}</p>
                  </CardContent>
                </Card>
              ))}
              {filteredFoodItems.length === 0 && (
                <div className="col-span-full py-20 text-center text-slate-400">
                  No food items found matching your filters.
                </div>
              )}
            </div>
          </div>

          {/* Right Summary/Cart Column */}
          <div className="lg:col-span-4 bg-white rounded-2xl shadow-sm border p-5 flex flex-col h-[calc(100vh-140px)] sticky top-[80px]">
            {/* Active order heading */}
            <div className="border-b pb-3 mb-4 space-y-1">
              <div className="flex justify-between items-center">
                <span className="font-black text-slate-800">New Order Summary</span>
                <span className="text-xs text-slate-400 font-medium">
                  {new Date().toLocaleDateString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            </div>

            {/* Order types selector */}
            <div className="grid grid-cols-4 gap-1.5 mb-4">
              {(['Dine In', 'Take Away', 'Delivery', 'Table'] as const).map(type => (
                <Button
                  key={type}
                  variant={selectedOrderType === type ? 'default' : 'outline'}
                  size="sm"
                  className={`text-[10px] font-extrabold px-1 ${
                    selectedOrderType === type
                      ? 'bg-primary hover:bg-primary/90 text-white'
                      : 'text-slate-600 border-slate-200'
                  }`}
                  onClick={() => setSelectedOrderType(type)}
                >
                  {type}
                </Button>
              ))}
            </div>

            {/* Waiter Selection */}
            <div className="mb-4">
              <label className="text-[10px] font-bold text-slate-400 uppercase">Servant / Waiter</label>
              <div className="relative mt-1">
                <select
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                  value={selectedWaiter}
                  onChange={e => setSelectedWaiter(e.target.value)}
                >
                  {employees.map(w => (
                    <option key={w.id} value={w.fullnames}>
                      {w.fullnames} ({w.Position || w.roleType || 'Staff'})
                    </option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
              </div>
            </div>

            {/* Table or Customer Assignment */}
            <div className="mb-4">
              {(selectedOrderType === 'Table' || selectedOrderType === 'Dine In') ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Dining Table</label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => {
                          setIsNewTable(true);
                          setSelectedTable('');
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                          isNewTable
                            ? 'bg-primary text-white font-extrabold'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        New Table
                      </button>
                      {activeTables.filter(t => t.status === 'eating').length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsNewTable(false);
                            const active = activeTables.find(t => t.status === 'eating');
                            if (active) {
                              setSelectedTable(active.id);
                              setCart(active.cart);
                              if (active.customerName) setCustomerName(active.customerName);
                              if (active.waiterName) setSelectedWaiter(active.waiterName);
                            }
                          }}
                          className={`px-2 py-0.5 rounded text-[9px] font-bold transition-colors ${
                            !isNewTable
                              ? 'bg-primary text-white font-extrabold'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                        >
                          Add to Existing ({activeTables.filter(t => t.status === 'eating').length})
                        </button>
                      )}
                    </div>
                  </div>

                  {isNewTable ? (
                    <div className="flex gap-1.5 mt-1">
                      <Input
                        placeholder="Table Name / Number (e.g. VIP 1)"
                        className="h-8 text-xs font-semibold bg-slate-50 focus-visible:ring-primary flex-1"
                        value={newTableName}
                        onChange={e => setNewTableName(e.target.value)}
                      />
                      <Button
                        type="button"
                        onClick={() => {
                          const randNum = Math.floor(Math.random() * 900 + 100);
                          setNewTableName(`Table #${randNum}`);
                        }}
                        className="h-8 text-[10px] font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 shrink-0"
                      >
                        Random
                      </Button>
                    </div>
                  ) : (
                    <div className="relative mt-1">
                      <select
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 px-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-primary appearance-none"
                        value={selectedTable}
                        onChange={e => {
                          const val = e.target.value;
                          setSelectedTable(val);
                          const active = activeTables.find(t => t.id === val);
                          if (active) {
                            setCart(active.cart);
                            if (active.customerName) setCustomerName(active.customerName);
                            if (active.waiterName) setSelectedWaiter(active.waiterName);
                          }
                        }}
                      >
                        {activeTables
                          .filter(t => t.status === 'eating')
                          .map(t => (
                            <option key={t.id} value={t.id}>
                              {t.name} (Waiter: {t.waiterName?.split(' ')[1] || 'N/A'}) - ${t.cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}
                            </option>
                          ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-2.5 h-3.5 w-3.5 text-slate-500 pointer-events-none" />
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                  <Input
                    className="h-8 text-xs font-semibold mt-1 bg-slate-50 focus-visible:ring-primary"
                    value={customerName}
                    onChange={e => setCustomerName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Scrollable ordered list */}
            <div className="flex-1 min-h-0 mb-4">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Ordered Menus</h4>
              <ScrollArea className="h-full pr-2">
                <div className="space-y-3">
                  {cart.map((item, idx) => (
                    <div key={`${item.id}-${idx}`} className="flex gap-3 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <div className="w-12 h-12 bg-slate-200 rounded-lg overflow-hidden shrink-0">
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-extrabold text-xs text-slate-800 truncate pr-1">
                            {item.name}
                          </h5>
                          <span className="font-bold text-xs text-slate-800">
                            ${(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-[10px]">
                          {/* Size Selection */}
                          <div className="flex gap-1">
                            {(['Small', 'Medium', 'Large'] as const).map(sz => (
                              <button
                                key={sz}
                                onClick={() => changeItemSize(item.id, sz)}
                                className={`px-1.5 py-0.5 rounded font-bold leading-none ${
                                  item.size === sz
                                    ? 'bg-primary text-white'
                                    : 'bg-slate-200 text-slate-600'
                                }`}
                              >
                                {sz[0]}
                              </button>
                            ))}
                          </div>
                          {/* Add Note Button */}
                          <button
                            onClick={() => openNoteDialog(item.id, idx, item.note)}
                            className="text-primary font-extrabold hover:underline"
                          >
                            {item.note ? 'View Note' : 'Add Note'}
                          </button>
                        </div>
                        {/* Quantity change & Remove row */}
                        <div className="flex justify-between items-center pt-1 border-t">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-black hover:bg-slate-300"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="text-xs font-extrabold text-slate-800">{item.quantity}</span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-5 h-5 rounded-full bg-slate-200 flex items-center justify-center font-black hover:bg-slate-300"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <button onClick={() => removeItem(item.id)} className="text-slate-400 hover:text-red-500">
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-10 text-xs text-slate-400">
                      Cart is empty. Select food to begin.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Financial summary */}
            <div className="border-t pt-3 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span className="font-bold text-slate-800">${getSubtotal().toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (${taxRate}%)</span>
                <span className="font-bold text-slate-800">${getTax().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-800 pt-1.5 border-t">
                <span>Amount to be Paid</span>
                <span className="text-primary text-lg">${getTotal().toFixed(2)}</span>
              </div>
            </div>

            {/* Footer Order placement buttons */}
            <div className="mt-4 space-y-2">
              <Button
                onClick={placeKitchenOrder}
                className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold shadow-md flex items-center justify-center gap-2"
                disabled={cart.length === 0}
              >
                <Utensils className="h-4 w-4" /> Place an Order
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedOrderType === 'Table' || selectedOrderType === 'Dine In') {
                      const tbl = activeTables.find(t => t.id === selectedTable);
                      if (tbl && tbl.status === 'eating') {
                        printPreBill(tbl);
                        toast({ title: 'Pre-Bill Printed', description: `Printed details for ${tbl.name || 'Table'}` });
                      } else {
                        toast({ title: 'Error', description: 'Table is not occupied with active order.' });
                      }
                    } else {
                      toast({ title: 'Error', description: 'Pre-bill is only available for tables.' });
                    }
                  }}
                  className="text-xs font-bold border-slate-200 text-slate-700"
                >
                  Print
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    if (selectedOrderType === 'Table' || selectedOrderType === 'Dine In') {
                      const tbl = activeTables.find(t => t.id === selectedTable);
                      if (tbl && tbl.status === 'eating') {
                        startTableCheckout(tbl);
                      } else {
                        toast({ title: 'Error', description: 'Table has no active order.' });
                      }
                    } else {
                      if (cart.length > 0) {
                        setActiveCheckoutTable({
                          id: 'walkin',
                          number: 0,
                          status: 'eating',
                          cart: [...cart],
                        });
                        setSelectedPaymentMethod('cash');
                        setIsPaymentDialogOpen(true);
                      } else {
                        toast({ title: 'Cart Empty', description: 'Cannot process empty cart.' });
                      }
                    }
                  }}
                  className="text-xs font-bold border-slate-200 text-slate-700"
                >
                  Invoice
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setCart([]);
                    toast({ title: 'Cart Cleared' });
                  }}
                  className="text-xs font-bold border-slate-200 text-red-600 hover:bg-red-50"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Orders & Tables View */}
      {activeTab === 'Orders' && (
        <div className="flex-1 p-6 space-y-8">
          {/* Tables layout grid */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Active Dining Tables (Clients Still Eating)
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
              {activeTables
                .filter(table => table.status === 'eating')
                .map(table => {
                  const totalBill = table.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) * (1 + taxRate / 100);
                  return (
                    <Card
                      key={table.id}
                      onClick={() => loadTableCart(table)}
                      className="relative overflow-hidden border shadow-sm transition-all bg-gradient-to-br from-amber-50 to-orange-50 border-amber-300 ring-2 ring-amber-400/20 cursor-pointer hover:shadow-md hover:scale-[1.02]"
                    >
                      <CardContent className="p-4 space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="font-black text-slate-800 text-sm truncate max-w-[100px]">{table.name}</span>
                          <Badge className="text-[9px] font-bold uppercase leading-none bg-amber-500 text-white">
                            Occupied
                          </Badge>
                        </div>
                        <div className="space-y-1.5 text-xs text-slate-600">
                          <p className="font-bold text-slate-800 truncate">Customer: {table.customerName || 'Walk-in'}</p>
                          <p className="font-semibold text-slate-500">Waiter: {table.waiterName || 'N/A'}</p>
                          <p className="font-extrabold text-slate-800 pt-1 border-t text-[13px]">
                            Bill: <span className="text-orange-600">${totalBill.toFixed(2)}</span>
                          </p>
                          <div className="grid grid-cols-2 gap-2 pt-2" onClick={e => e.stopPropagation()}>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => loadTableCart(table)}
                              className="text-[10px] font-bold border-amber-300 text-amber-700 bg-amber-100/50 hover:bg-amber-100"
                            >
                              Add Items
                            </Button>
                            <Button
                              variant="default"
                              size="sm"
                              onClick={() => startTableCheckout(table)}
                              className="text-[10px] font-bold bg-amber-600 hover:bg-amber-700 text-white"
                            >
                              Pay / Check
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              {activeTables.filter(table => table.status === 'eating').length === 0 && (
                <div className="col-span-full text-center py-10 bg-slate-50 border border-dashed rounded-2xl p-6 text-slate-400">
                  <Utensils className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                  <p className="text-xs font-bold">No active tables found.</p>
                  <p className="text-[10px]">Create a new table order in the POS to begin tracking.</p>
                </div>
              )}
            </div>
          </div>

          {/* Kitchen Orders List inside POS tab */}
          <div>
            <h2 className="text-lg font-extrabold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" /> Kitchen Tickets Queue (Live Status)
            </h2>
            <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 border-b text-slate-400 font-bold uppercase text-[10px]">
                    <th className="p-4">Token #</th>
                    <th className="p-4">Table</th>
                    <th className="p-4">Waiter</th>
                    <th className="p-4">Time Placed</th>
                    <th className="p-4">Dishes Ordered</th>
                    <th className="p-4">Current Status</th>
                    <th className="p-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y font-semibold text-slate-700">
                  {kitchenTickets.map(ticket => (
                    <tr key={ticket.id} className="hover:bg-slate-50/50">
                      <td className="p-4 font-black text-slate-800">{ticket.id}</td>
                      <td className="p-4">
                        {ticket.tableId ? `Table ${ticket.tableId.replace('T', '')}` : 'Take Away/Delivery'}
                      </td>
                      <td className="p-4 text-slate-500">{ticket.waiterName}</td>
                      <td className="p-4 text-slate-400">{new Date(ticket.timestamp).toLocaleTimeString()}</td>
                      <td className="p-4">
                        <div className="space-y-0.5 max-w-xs">
                          {ticket.items.map((item, idx) => (
                            <p key={idx} className="truncate">
                              {item.quantity}x {item.name} [{item.size}]
                            </p>
                          ))}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge
                          className={`text-[10px] font-bold ${
                            ticket.status === 'Pending'
                              ? 'bg-amber-100 text-amber-700'
                              : ticket.status === 'Preparing'
                                ? 'bg-primary/10 text-primary'
                                : ticket.status === 'Ready'
                                  ? 'bg-emerald-100 text-emerald-700'
                                  : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {ticket.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => printKitchenTicket(ticket)}
                          className="h-7 px-2.5 text-[10px] font-bold border-slate-200 text-slate-600 flex items-center gap-1.5 ml-auto"
                        >
                          <Printer className="h-3 w-3" /> Re-Print KOT
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {kitchenTickets.length === 0 && (
                    <tr>
                      <td colSpan={7} className="p-10 text-center text-slate-400">
                        No orders sent to kitchen yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Standalone KOT Tickets tab */}
      {activeTab === 'Kitchen' && (
        <div className="flex-1 p-6 space-y-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Utensils className="h-5 w-5 text-primary" /> Kitchen Display Board
            </h2>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.open('/kitchen-display', '_blank');
              }}
              className="text-xs font-bold border-slate-200 text-slate-700"
            >
              Open Dedicated Kitchen Screen
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {kitchenTickets
              .filter(t => t.status !== 'Served')
              .map(ticket => (
                <Card key={ticket.id} className="overflow-hidden border border-slate-200 shadow-sm flex flex-col">
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div>
                      <span className="text-lg font-black">{ticket.id}</span>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {ticket.orderType} {ticket.tableId ? `- Table ${ticket.tableId.replace('T', '')}` : ''}
                      </p>
                    </div>
                    <Badge className="bg-primary text-white uppercase text-[9px] font-bold">
                      {ticket.status}
                    </Badge>
                  </div>
                  <CardContent className="p-4 flex-1 space-y-4">
                    <div className="space-y-2 text-xs">
                      {ticket.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between border-b pb-1.5">
                          <div>
                            <span className="font-black text-slate-800 mr-2">{item.quantity}x</span>
                            <span>{item.name} ({item.size})</span>
                            {item.note && (
                              <p className="text-[10px] text-amber-600 font-medium italic mt-0.5">
                                * {item.note}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center text-[10px] text-slate-400 border-t pt-3 font-semibold">
                      <span>Servant: {ticket.waiterName}</span>
                      <span>{new Date(ticket.timestamp).toLocaleTimeString()}</span>
                    </div>
                  </CardContent>
                  <div className="bg-slate-50 border-t p-3 grid grid-cols-3 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (restaurantId) {
                          try {
                            await updateDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', ticket.id), {
                              status: 'Preparing',
                            });
                          } catch (err) {
                            console.error('Error preparing ticket:', err);
                          }
                        }
                      }}
                      disabled={ticket.status !== 'Pending'}
                      className="text-[10px] font-extrabold border-slate-200"
                    >
                      Prepare
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={async () => {
                        if (restaurantId) {
                          try {
                            await updateDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', ticket.id), {
                              status: 'Ready',
                            });
                          } catch (err) {
                            console.error('Error marking ticket ready:', err);
                          }
                        }
                      }}
                      disabled={ticket.status !== 'Preparing'}
                      className="text-[10px] font-extrabold border-slate-200"
                    >
                      Ready
                    </Button>
                    <Button
                      size="sm"
                      onClick={async () => {
                        if (restaurantId) {
                          try {
                            await updateDoc(doc(db, 'kitchen_tickets', restaurantId, 'tickets', ticket.id), {
                              status: 'Served',
                            });
                          } catch (err) {
                            console.error('Error serving ticket:', err);
                          }
                        }

                        // Clear table occupied state
                        if (ticket.tableId) {
                          const updatedTbls = activeTables.map(tbl =>
                            tbl.id === ticket.tableId
                              ? { ...tbl, status: 'empty' as const, cart: [] }
                              : tbl
                          );
                          setActiveTables(updatedTbls);
                          localStorage.setItem('restaurantActiveTables', JSON.stringify(updatedTbls));
                        }

                        // If it's a Delivery order, mark it as delivered/collected on DB and print receipt
                        if (ticket.orderType === 'Delivery') {
                          try {
                            await assignOrder.mutateAsync({
                              id: ticket.orderId,
                              shopper_id: null,
                              status: 'delivered',
                              type: 'restaurant',
                            });

                            printCustomerReceipt(
                              ticket.items,
                              'Online Client',
                              'Online',
                              'Delivery',
                              'Paid Online',
                              ticket.orderId.slice(0, 8).toUpperCase(),
                              ticket.id
                            );

                            toast({
                              title: 'Delivery Order Collected',
                              description: 'Order marked delivered and invoice printed.',
                            });
                            refetchRestaurantOrders();
                          } catch (err) {
                            console.error('Failed to mark delivery order collected:', err);
                          }
                        } else {
                          toast({ title: 'Order Served', description: `Order ${ticket.id} cleared.` });
                        }

                        // Trigger storage sync event
                        window.dispatchEvent(new Event('storage'));
                      }}
                      className="text-[10px] font-extrabold bg-primary text-white"
                    >
                      {ticket.orderType === 'Delivery' ? 'Collect & Print' : 'Serve / Clear'}
                    </Button>

                  </div>
                </Card>
              ))}
            {kitchenTickets.filter(t => t.status !== 'Served').length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400">
                No active tickets in kitchen.
              </div>
            )}
          </div>
        </div>
      )}

      {/* Online/Delivery Orders Tab */}
      {activeTab === 'Delivery' && (
        <div className="flex-1 p-6 space-y-6 overflow-y-auto">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
                <ShoppingCart className="h-5 w-5 text-primary" /> Online & Delivery Orders
              </h2>
              <p className="text-xs text-slate-500 mt-1">Accept and manage orders placed online by customers</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetchRestaurantOrders()}
              className="text-xs font-bold border-slate-200 text-slate-700"
            >
              Refresh Orders
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {deliveryOrders.map((order: any) => {
              const statusUpper = (order.status || '').toUpperCase();
              const formattedDate = order.created_at
                ? new Date(order.created_at).toLocaleString()
                : 'N/A';

              return (
                <Card key={order.id} className="overflow-hidden border border-slate-200 shadow-sm flex flex-col animate-in fade-in-50 duration-200">
                  {/* Card Header */}
                  <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
                    <div>
                      <span className="text-sm font-bold font-mono">ORD-{order.id.slice(0, 8).toUpperCase()}</span>
                      <p className="text-[10px] text-slate-400 mt-0.5">{formattedDate}</p>
                    </div>
                    <Badge className={`uppercase text-[9px] font-bold ${
                      statusUpper === 'PENDING' ? 'bg-amber-500 text-slate-950' : 'bg-red-500 text-white'
                    }`}>
                      {order.status || 'Pending'}
                    </Badge>
                  </div>

                  {/* Card Content */}
                  <CardContent className="p-4 flex-1 space-y-4">
                    {/* Customer Info */}
                    <div className="space-y-1 text-xs">
                      <p className="font-extrabold text-slate-700">Customer Details:</p>
                      <p className="text-slate-600"><span className="font-semibold text-slate-700">Name:</span> {order.orderedBy?.name || 'Walk-in Customer'}</p>
                      {order.orderedBy?.phone && (
                        <p className="text-slate-600"><span className="font-semibold text-slate-700">Phone:</span> {order.orderedBy.phone}</p>
                      )}
                      {order.Address && (
                        <p className="text-slate-600">
                          <span className="font-semibold text-slate-700">Address:</span> {order.Address.street}, {order.Address.city}
                        </p>
                      )}
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 border-t pt-3">
                      <p className="text-xs font-extrabold text-slate-700">Items Ordered:</p>
                      <div className="space-y-1.5 text-xs max-h-40 overflow-y-auto pr-2">
                        {order.restaurant_order_items?.map((item: any, idx: number) => (
                          <div key={idx} className="flex justify-between text-slate-600">
                            <span>
                              <span className="font-bold text-primary mr-1">{item.quantity}x</span>
                              {item.restaurant_dishes?.dishes?.name || 'Unknown Dish'}
                            </span>
                            <span className="font-bold">{formatCurrencyWithConfig(parseFloat(item.price || '0'), systemConfig)}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total billing */}
                    <div className="border-t pt-3 flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Paid Online:</span>
                      <span className="text-lg font-black text-primary">
                        {formatCurrencyWithConfig(parseFloat(order.total || '0'), systemConfig)}
                      </span>
                    </div>

                    <div className="border-t pt-3">
                      <Button
                        className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs h-10 shadow-sm"
                        onClick={() => handleAcceptOnlineOrder(order)}
                        disabled={assignOrder.isPending}
                      >
                        {assignOrder.isPending ? 'Processing...' : 'Accept & Send to Kitchen'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {deliveryOrders.length === 0 && (
              <div className="col-span-full text-center py-20 text-slate-400 font-bold">
                No active delivery or online orders.
              </div>
            )}
          </div>
        </div>
      )}



      {/* Edit Note Dialog */}
      <Dialog open={isNoteDialogOpen} onOpenChange={setIsNoteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Item Note</DialogTitle>
            <DialogDescription>Add preparing instructions for the kitchen ticket.</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="E.g., No onions, extra spicy..."
            value={editingItemNote?.note || ''}
            onChange={e =>
              setEditingItemNote(prev => (prev ? { ...prev, note: e.target.value } : null))
            }
            className="mt-2"
          />
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsNoteDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveItemNote}>Save Note</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Invoice/Payment Dialog */}
      <Dialog open={isPaymentDialogOpen} onOpenChange={setIsPaymentDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Restaurant Payment Checkout</DialogTitle>
            <DialogDescription>
              Select payment method to settle bill for {activeCheckoutTable?.name || 'Table'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              {(['cash', 'card', 'momo'] as const).map(method => (
                <div
                  key={method}
                  onClick={() => setSelectedPaymentMethod(method)}
                  className={`border-2 rounded-xl p-4 text-center cursor-pointer hover:shadow-sm transition-all ${
                    selectedPaymentMethod === method
                      ? 'border-primary bg-primary/5'
                      : 'border-slate-200 hover:border-primary/80'
                  }`}
                >
                  <DollarSign className="h-6 w-6 mx-auto mb-1 text-slate-600" />
                  <span className="font-extrabold text-xs capitalize text-slate-800">{method}</span>
                </div>
              ))}
            </div>

            <div className="bg-slate-50 border rounded-xl p-4 space-y-2 text-xs font-semibold text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-bold text-slate-800">
                  ${(activeCheckoutTable?.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Tax (18%)</span>
                <span className="font-bold text-slate-800">
                  ${((activeCheckoutTable?.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0) * 0.18).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-800 border-t pt-2 mt-2">
                <span>Total Settle Due</span>
                <span className="text-primary text-base">
                  ${((activeCheckoutTable?.cart.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0) * 1.18).toFixed(2)}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={confirmTablePayment} className="bg-primary hover:bg-primary/90 text-white">
              Confirm Payment & Print
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default RestaurantCheckout;
