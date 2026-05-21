'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Clock,
  Volume2,
  VolumeX,
  Coffee,
  Check,
  UtensilsCrossed,
  Tv,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [currentTime, setCurrentTime] = useState('');
  const [restaurantName, setRestaurantName] = useState('Dreams Restaurant');
  const prevTicketsLength = useRef(0);

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

  // Fetch restaurant details
  useEffect(() => {
    try {
      const storedShop = localStorage.getItem('currentShopSession');
      if (storedShop) {
        const parsed = JSON.parse(storedShop);
        if (parsed?.shop?.name) {
          setRestaurantName(parsed.shop.name);
        }
      }
    } catch (e) {
      console.error(e);
    }
  }, []);

  // Load and sync from localStorage
  useEffect(() => {
    const loadTickets = () => {
      try {
        const stored = localStorage.getItem('restaurantKitchenOrders');
        if (stored) {
          const parsed = JSON.parse(stored) as KitchenTicket[];
          setTickets(parsed);

          // Audio notification if new ticket arrives
          if (soundEnabled && parsed.length > prevTicketsLength.current) {
            playAlertSound();
          }
          prevTicketsLength.current = parsed.length;
        }
      } catch (e) {
        console.error('Failed to load kitchen tickets:', e);
      }
    };

    loadTickets();

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'restaurantKitchenOrders') {
        loadTickets();
      }
    };
    window.addEventListener('storage', handleStorage);
    // Poll localstorage every 2 seconds for active tab changes
    const pollInterval = setInterval(loadTickets, 2000);

    return () => {
      window.removeEventListener('storage', handleStorage);
      clearInterval(pollInterval);
    };
  }, [soundEnabled]);

  // Audio alert using Web Audio API
  const playAlertSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      // Play second beep shortly after
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1109.73, audioCtx.currentTime); // C#6 note
        gain2.gain.setValueAtTime(0.15, audioCtx.currentTime);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.2);
      }, 180);
    } catch (err) {
      console.log('Audio contextual beep blocked or not supported');
    }
  };

  const updateTicketStatus = (ticketId: string, newStatus: 'Pending' | 'Preparing' | 'Ready' | 'Served') => {
    const updated = tickets.map(t => (t.id === ticketId ? { ...t, status: newStatus } : t));
    setTickets(updated);
    localStorage.setItem('restaurantKitchenOrders', JSON.stringify(updated));

    // Clear active table occupancy if served
    const ticket = tickets.find(t => t.id === ticketId);
    if (newStatus === 'Served' && ticket?.tableId) {
      try {
        const tablesStored = localStorage.getItem('restaurantActiveTables');
        if (tablesStored) {
          const tables = JSON.parse(tablesStored);
          const updatedTables = tables.map((t: any) =>
            t.id === ticket.tableId
              ? { ...t, status: 'empty', cart: [] }
              : t
          );
          localStorage.setItem('restaurantActiveTables', JSON.stringify(updatedTables));
        }
      } catch (e) {
        console.error(e);
      }
    }

    // Trigger localstorage sync event manually
    window.dispatchEvent(new Event('storage'));
  };

  const serveTicket = (ticket: KitchenTicket) => {
    updateTicketStatus(ticket.id, 'Served');
    toast({
      title: 'Order Completed',
      description: `Order #${ticket.id} has been served.`,
      action: (
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            const stored = localStorage.getItem('restaurantKitchenOrders');
            if (stored) {
              const parsed = JSON.parse(stored) as KitchenTicket[];
              const restored = parsed.map(t => t.id === ticket.id ? { ...t, status: 'Ready' as const } : t);
              setTickets(restored);
              localStorage.setItem('restaurantKitchenOrders', JSON.stringify(restored));
              window.dispatchEvent(new Event('storage'));
              toast({ title: 'Restored', description: `Order #${ticket.id} moved back to active list.` });
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
      <header className="flex justify-between items-center bg-card border-b border-border px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white font-extrabold shadow-md">
            <Tv className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2 uppercase">
              {restaurantName} <span className="text-primary font-bold">DISPLAY BOARD</span>
            </h1>
            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">
              Live Order Queue
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`border-border text-xs font-bold ${soundEnabled ? 'bg-primary/5 text-primary' : 'text-muted-foreground'}`}
          >
            Beep Alert: {soundEnabled ? 'ON' : 'OFF'}
          </Button>

          <ThemeToggle />

          <div className="flex items-center gap-2 bg-muted px-4 py-2 rounded-xl border border-border/50">
            <Clock className="h-4 w-4 text-primary" />
            <span className="font-mono text-base font-bold text-foreground">{currentTime}</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div className="flex-1 p-8 min-h-0">
        <ScrollArea className="h-full">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6 pr-3">
            {activeTickets.map(t => {
              const isReady = t.status === 'Ready';
              return (
                <div
                  key={t.id}
                  onClick={() => serveTicket(t)}
                  className={`relative overflow-hidden aspect-square rounded-3xl border-2 flex flex-col items-center justify-center cursor-pointer transition-all duration-300 group shadow-sm ${
                    isReady
                      ? 'bg-primary border-primary text-primary-foreground hover:scale-[1.03] hover:shadow-lg'
                      : 'bg-muted/40 border-border text-foreground hover:border-primary/50'
                  }`}
                >
                  {isReady && (
                    <span className="absolute top-4 right-4 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                    </span>
                  )}
                  
                  <span className={`text-5xl sm:text-6xl md:text-7xl font-black tracking-tighter ${isReady ? 'text-primary-foreground' : 'text-foreground'}`}>
                    #{t.id}
                  </span>
                  
                  <span className={`text-[10px] font-bold uppercase mt-2.5 tracking-wider px-2 py-0.5 rounded-full ${
                    isReady 
                      ? 'bg-white/20 text-white' 
                      : 'bg-amber-500/10 text-amber-600 dark:text-amber-500'
                  }`}>
                    {isReady ? 'Ready' : 'Preparing'}
                  </span>

                  {t.tableId && (
                    <span className={`text-[9px] font-semibold mt-1 opacity-70 ${isReady ? 'text-white' : 'text-muted-foreground'}`}>
                      Table {t.tableId.replace('tbl-', '')}
                    </span>
                  )}

                  {/* Tap to Settle/Dismiss Hover Overlay */}
                  <div className="absolute inset-0 bg-emerald-500 flex flex-col items-center justify-center text-white font-black text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <Check className="h-8 w-8 mb-1.5 animate-bounce text-white" />
                    TAP TO SERVE
                  </div>
                </div>
              );
            })}

            {activeTickets.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center py-32 text-center text-muted-foreground">
                <UtensilsCrossed className="h-16 w-16 text-muted-foreground/30 mb-4 animate-pulse" />
                <h2 className="text-lg font-bold">All Orders Served</h2>
                <p className="text-xs mt-1 text-muted-foreground/80">Waiting for new orders from the POS checkout...</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>
    </div>
  );
}
