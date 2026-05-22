'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useShopSession } from '@/contexts/ShopSessionContext';
import { useRestaurantById, useShopById } from '@/hooks/useHasuraApi';
import { db } from '@/lib/firebase';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { apiGet } from '@/lib/api';
import {
  Clock,
  Volume2,
  VolumeX,
  Check,
  UtensilsCrossed,
  Store,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useThemeColor } from '@/components/providers/ThemeColorProvider';
import ThemeToggle from '@/components/layout/ThemeToggle';
import { useToast } from '@/hooks/use-toast';

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
  id: string;
  orderId: string;
  tableId?: string;
  orderType: 'Dine In' | 'Take Away' | 'Delivery' | 'Table';
  items: CartItem[];
  waiterName: string;
  timestamp: string;
  status: 'Pending' | 'Preparing' | 'Ready' | 'Served';
}

export default function KitchenDisplay() {
  const { color } = useThemeColor();
  const { toast } = useToast();
  const [tickets, setTickets] = useState<KitchenTicket[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('restaurantKitchenOrders');
        if (stored) return JSON.parse(stored);
      } catch (e) { }
    }
    return [];
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const prevTicketsLength = useRef(0);

  const { session } = useAuth();
  const { shopSession } = useShopSession();

  // Resolve restaurant vs shop ID from session
  const isRestaurant = !!(session?.restaurant_id || shopSession?.isRestaurant);

  let localId = '';
  try {
    const storedShop = localStorage.getItem('currentShopSession');
    if (storedShop) {
      const parsed = JSON.parse(storedShop);
      localId = parsed?.restaurant_id || parsed?.shopId || '';
    }
  } catch (e) {}

  const restaurantId =
    session?.restaurant_id ||
    (shopSession?.isRestaurant ? shopSession?.shopId : null) ||
    (isRestaurant ? localId : null);

  const shopId =
    session?.shop_id ||
    (!shopSession?.isRestaurant ? shopSession?.shopId : null) ||
    (!isRestaurant ? localId : null);

  // Fetch business data
  const { data: restaurantData } = useRestaurantById(restaurantId || '');
  const { data: shopData } = useShopById(shopId || '');

  const restaurant = restaurantData?.Restaurants_by_pk;
  const shop = shopData?.Shops_by_pk;

  // Resolve display name and logo from whichever branch is active
  const businessName = restaurant?.name || shop?.name || session?.shop_name || session?.restaurant_name || '';
  const businessLogo = restaurant?.logo || shop?.logo || shop?.image || null;

  // Update clock every second
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Subscribe to Firebase Firestore for real-time kitchen tickets
  const activeId = restaurantId || shopId;
  useEffect(() => {
    if (!activeId) return;

    const ticketsCollectionRef = collection(db, 'kitchen_tickets', activeId, 'tickets');
    const unsubscribe = onSnapshot(ticketsCollectionRef, (snapshot) => {
      try {
        const ticketsList: KitchenTicket[] = [];
        snapshot.forEach((docSnap) => {
          ticketsList.push(docSnap.data() as KitchenTicket);
        });
        ticketsList.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        if (soundEnabled && ticketsList.length > prevTicketsLength.current) {
          playAlertSound();
        }
        prevTicketsLength.current = ticketsList.length;

        setTickets(ticketsList);
        localStorage.setItem('restaurantKitchenOrders', JSON.stringify(ticketsList));
        window.dispatchEvent(new Event('storage'));
      } catch (e) {
        console.error('Failed to parse kitchen tickets:', e);
      }
    }, (error) => {
      console.error('Error subscribing to kitchen tickets in KDS:', error);
    });

    return () => unsubscribe();
  }, [activeId, soundEnabled]);

  // DB Fallback: Poll Postgres every 10 seconds to catch any missed tickets if Firebase is down
  useEffect(() => {
    if (!activeId) return;

    const fetchBackup = async () => {
      try {
        const response = await apiGet<{ kitchenQueue: any[] }>(`/api/queries/kitchen-queue?restaurantId=${activeId}`);
        if (response && response.kitchenQueue) {
          const dbTickets: KitchenTicket[] = response.kitchenQueue.map(q => ({
            id: q.token_number,
            orderId: q.restaurant_order_id || q.token_number,
            tableId: q.table_number || undefined,
            orderType: q.table_number ? 'Table' : 'Take Away',
            items: q.dishesOrdered || [],
            waiterName: 'Waiter',
            timestamp: q.updated_at,
            status: q.status as any,
          }));

          setTickets(prev => {
            const merged = [...prev];
            let changed = false;

            dbTickets.forEach(dbT => {
              // Only merge tickets that don't exist in Firebase yet
              if (!merged.find(t => t.id === dbT.id)) {
                merged.push(dbT);
                changed = true;
              }
            });

            if (changed) {
              merged.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
              localStorage.setItem('restaurantKitchenOrders', JSON.stringify(merged));
              return merged;
            }
            return prev;
          });
        }
      } catch (e) {
        // Silently fail backup polling
      }
    };

    fetchBackup();
    const interval = setInterval(fetchBackup, 10000);
    return () => clearInterval(interval);
  }, [activeId]);

  // Audio alert — loud double-beep using Web Audio API
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const beep = (delay = 0) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(987.77, audioCtx.currentTime + delay);
        gain.gain.setValueAtTime(0.8, audioCtx.currentTime + delay);
        osc.start(audioCtx.currentTime + delay);
        osc.stop(audioCtx.currentTime + delay + 0.25);
      };
      beep(0);
      beep(0.3);
    } catch (err) {
      console.log('Audio alert blocked or not supported');
    }
  };

  const updateTicketStatus = async (ticketId: string, newStatus: 'Pending' | 'Preparing' | 'Ready' | 'Served') => {
    if (activeId) {
      try {
        await updateDoc(doc(db, 'kitchen_tickets', activeId, 'tickets', ticketId), {
          status: newStatus,
        });
      } catch (err) {
        console.error('Error updating status in Firestore:', err);
      }
    }

    if (newStatus === 'Served') {
      const ticket = tickets.find(t => t.id === ticketId);
      if (ticket?.tableId) {
        try {
          const tablesStored = localStorage.getItem('restaurantActiveTables');
          if (tablesStored) {
            const tables = JSON.parse(tablesStored);
            const updatedTables = tables.map((t: any) =>
              t.id === ticket.tableId ? { ...t, status: 'empty', cart: [] } : t
            );
            localStorage.setItem('restaurantActiveTables', JSON.stringify(updatedTables));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  };

  const serveTicket = (ticket: KitchenTicket) => {
    updateTicketStatus(ticket.id, 'Served');
    toast({
      title: 'Order Completed',
      description: `Token ${ticket.id} has been served.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={async () => {
            if (activeId) {
              try {
                await updateDoc(doc(db, 'kitchen_tickets', activeId, 'tickets', ticket.id), {
                  status: 'Ready',
                });
                toast({ title: 'Restored', description: `Token ${ticket.id} moved back to active queue.` });
              } catch (err) {
                console.error('Error restoring ticket status:', err);
              }
            }
          }}
          className="border-primary text-primary hover:bg-primary/10 text-xs font-bold"
        >
          Undo
        </Button>
      ),
    });
  };

  const activeTickets = tickets.filter(t => t.status !== 'Served');

  return (
    <div className="flex flex-col h-screen bg-background text-foreground select-none transition-colors duration-300">
      {/* Header Bar */}
      <header className="flex justify-between items-center bg-card border-b border-border px-6 py-3 shrink-0">
        {/* Left: Logo + Name */}
        <div className="flex items-center gap-3">
          {businessLogo ? (
            <img
              src={businessLogo}
              alt={businessName}
              className="w-11 h-11 rounded-xl object-cover border border-border shadow-sm"
            />
          ) : (
            <div className="w-11 h-11 rounded-xl bg-primary flex items-center justify-center shadow-md shrink-0">
              <Store className="h-5 w-5 text-primary-foreground" />
            </div>
          )}
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase leading-tight">
              {businessName || 'Kitchen Display'}
              <span className="text-primary font-bold ml-2">BOARD</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Live Order Queue • {isRestaurant ? 'Restaurant POS' : 'Retail POS'}
            </p>
          </div>
        </div>

        {/* Right: Controls */}
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border-border text-xs font-bold gap-1.5 ${soundEnabled ? 'bg-primary/5 text-primary border-primary/30' : 'text-muted-foreground'}`}
          >
            {soundEnabled ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
            Beep: {soundEnabled ? 'ON' : 'OFF'}
          </Button>

          <ThemeToggle />

          <div className="flex items-center gap-2 bg-muted px-3 py-2 rounded-xl border border-border/50">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono text-sm font-bold text-foreground">{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Ticket Grid */}
      <div className="flex-1 p-6 min-h-0 overflow-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {activeTickets.map(t => {
            const isReady = t.status === 'Ready';

            const tableLabel = t.tableId
              ? t.tableId.startsWith('tbl-') ? `Table #${t.tableId.replace('tbl-', '')}` : t.tableId
              : null;

            return (
              <div
                key={t.id}
                onClick={() => serveTicket(t)}
                className={`group relative rounded-2xl border-2 overflow-hidden cursor-pointer transition-all duration-300 shadow-sm hover:shadow-lg active:scale-[0.97] ${
                  isReady
                    ? 'border-primary bg-primary/5 hover:bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40'
                }`}
              >
                {/* Left accent bar */}
                <div
                  className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-primary"
                  style={{ opacity: isReady ? 1 : 0.35 }}
                />

                {/* Ready pulse dot */}
                {isReady && (
                  <span className="absolute top-3 right-3 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                  </span>
                )}

                {/* Card body — single row */}
                <div className="flex items-center gap-4 px-5 pl-6 py-4">
                  {/* Token Number */}
                  <span className={`text-4xl font-black tracking-tighter leading-none tabular-nums shrink-0 ${
                    isReady ? 'text-primary' : 'text-foreground'
                  }`}>
                    {t.id}
                  </span>

                  {/* Divider */}
                  <div className={`h-10 w-px shrink-0 ${isReady ? 'bg-primary/30' : 'bg-border'}`} />

                  {/* Right info column */}
                  <div className="flex flex-col gap-1 min-w-0">
                    {/* Status badge */}
                    <span className={`inline-flex items-center gap-1 self-start text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      isReady
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-primary/15 text-primary'
                    }`}>
                      {isReady ? '✓ READY' : '⏳ PREPARING'}
                    </span>

                    {/* Order type + Table */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide">
                        {t.orderType}
                      </span>
                      {tableLabel && (
                        <>
                          <span className="text-muted-foreground/40 text-[10px]">•</span>
                          <span className="text-[10px] font-bold text-muted-foreground">{tableLabel}</span>
                        </>
                      )}
                    </div>

                    {/* Waiter if set */}
                    {t.waiterName && t.waiterName !== 'Online Order' && (
                      <span className="text-[9px] text-muted-foreground/60 truncate">
                        {t.waiterName}
                      </span>
                    )}
                  </div>
                </div>

                {/* Hover serve overlay */}
                <div className="absolute inset-0 bg-emerald-500/95 flex items-center justify-center text-white font-black text-sm gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-2xl">
                  <Check className="h-5 w-5" />
                  TAP TO SERVE
                </div>
              </div>
            );
          })}

          {activeTickets.length === 0 && (
            <div className="col-span-full flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
              <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30 mb-4 animate-pulse" />
              <h2 className="text-lg font-bold">All Orders Served</h2>
              <p className="text-xs mt-1 text-muted-foreground/80">Waiting for new orders from the POS terminal...</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
