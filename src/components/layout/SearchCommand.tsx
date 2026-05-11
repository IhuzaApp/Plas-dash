'use client';

import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from '@/components/ui/command';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/layout/RootLayout';
import { hasPrivilege } from '@/types/privileges';
import {
  Users as UsersIcon,
  Store,
  Package,
  Search,
  Loader2,
  User as UserIcon,
  AlertCircle,
  Truck,
  LayoutDashboard,
  Settings,
  HelpCircle,
  Video,
  Building2,
  Car,
  Tag,
  X,
  CreditCard,
  Wallet,
  FileText,
  Activity,
  ShoppingBag,
  Coins,
  ShieldCheck,
  Receipt,
  MessageSquare,
} from 'lucide-react';
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

interface SearchResult {
  Users: any[];
  shoppers: any[];
  ProjectUsers: any[];
  Orders: any[];
  reel_orders: any[];
  businessProductOrders: any[];
  package_delivery: any[];
  restaurant_orders: any[];
  Shops: any[];
  Restaurants: any[];
  pet_vendors: any[];
  logisticsAccount: any[];
  business_stores: any[];
  vehicles: any[];
  orgEmployees: any[];
}

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const COMMAND_MAP: Record<string, string> = {
  '/user': 'user',
  '/users': 'user',
  '/customer': 'user',
  '/customers': 'user',
  '/shopper': 'shopper',
  '/shoppers': 'shopper',
  '/plasa': 'shopper',
  '/courier': 'shopper',
  '/order': 'order',
  '/orders': 'order',
  '/pkg': 'order',
  '/package': 'order',
  '/delivery': 'order',
  '/shop': 'shop',
  '/shops': 'shop',
  '/store': 'shop',
  '/stores': 'shop',
  '/business': 'shop',
  '/vendor': 'shop',
  '/restaurant': 'restaurant',
  '/restaurants': 'restaurant',
  '/staff': 'staff',
  '/employee': 'staff',
  '/employees': 'staff',
  '/vehicle': 'vehicle',
  '/vehicles': 'vehicle',
  '/admin': 'admin',
  '/project': 'admin',
  '/projectUser': 'admin',
  '/projectUsers': 'admin',
  '/project user': 'admin',
};

const ALL_MODULES = [
  { title: 'Dashboard', icon: LayoutDashboard, path: '/', module: 'dashboard' },
  { title: 'Orders', icon: Package, path: '/orders', module: 'orders' },
  { title: 'Plasa Shoppers', icon: Truck, path: '/shoppers', module: 'shoppers' },
  { title: 'Customers', icon: UsersIcon, path: '/users', module: 'users' },
  { title: 'Project Admins', icon: ShieldCheck, path: '/project-users', module: 'project_users' },
  { title: 'Shops & Stores', icon: Store, path: '/shops', module: 'shops' },
  { title: 'Restaurants', icon: Building2, path: '/restaurants', module: 'restaurants' },
  { title: 'Reels Management', icon: Video, path: '/reels', module: 'reels' },
  { title: 'Products', icon: ShoppingBag, path: '/products', module: 'products' },
  { title: 'POS Checkout', icon: CreditCard, path: '/pos/checkout', module: 'checkout' },
  { title: 'Inventory', icon: ShoppingBag, path: '/pos/inventory', module: 'inventory' },
  { title: 'Staff Management', icon: UsersIcon, path: '/pos/staff', module: 'staff' },
  { title: 'Company Wallet', icon: Wallet, path: '/company-wallet', module: 'wallet' },
  { title: 'Withdraw Requests', icon: Coins, path: '/withdraw-requests', module: 'finance' },
  { title: 'Refund Claims', icon: Receipt, path: '/refunds', module: 'refunds' },
  { title: 'Support Tickets', icon: MessageSquare, path: '/tickets', module: 'tickets' },
  { title: 'Tax & Compliance', icon: FileText, path: '/tax', module: 'tax' },
  { title: 'System Settings', icon: Settings, path: '/settings', module: 'settings' },
];

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const { session } = useAuth();
  const [searchValue, setSearchValue] = React.useState('');
  const [activeScope, setActiveScope] = React.useState<string | null>(null);

  const handleInputChange = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    
    // Check if user just typed a command and a space
    if (val.endsWith(' ')) {
      const cmd = trimmed;
      if (COMMAND_MAP[cmd]) {
        setActiveScope(COMMAND_MAP[cmd]);
        setSearchValue('');
        return;
      }
    }
    
    setSearchValue(val);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // If Backspace on empty input, clear active scope
    if (e.key === 'Backspace' && !searchValue && activeScope) {
      setActiveScope(null);
      e.preventDefault();
    }
    
    // If Enter on a command (like /user), lock the scope
    if (e.key === 'Enter' && searchValue.startsWith('/')) {
      const cmd = searchValue.trim().toLowerCase();
      if (COMMAND_MAP[cmd]) {
        setActiveScope(COMMAND_MAP[cmd]);
        setSearchValue('');
        e.preventDefault();
      }
    }
  };

  const { data, isLoading } = useQuery<SearchResult | null>({
    queryKey: ['global-search', searchValue, activeScope],
    queryFn: async () => {
      if (!searchValue && !activeScope) return null;
      if (searchValue.length < 2 && !activeScope) return null;
      
      try {
        const url = new URL('/api/search', window.location.origin);
        if (searchValue) url.searchParams.append('q', searchValue.trim());
        if (activeScope) url.searchParams.append('scope', activeScope);
        
        const response = await fetch(url.toString());
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json();
        return data.results;
      } catch (error) {
        console.error('Search error:', error);
        return null;
      }
    },
    enabled: searchValue.length >= 2 || !!activeScope,
    debounceTime: 300,
  } as any);

  const handleSelect = (path: string) => {
    router.push(path);
    onOpenChange(false);
    setSearchValue('');
    setActiveScope(null);
  };

  const accessibleModules = React.useMemo(() => {
    if (!session) return [];
    return ALL_MODULES.filter(item => {
      if (item.module === 'dashboard' || item.module === 'settings') return true;
      return hasPrivilege(session.privileges, item.module as any, 'access', session.role);
    });
  }, [session]);

  const filteredModules = React.useMemo(() => {
    if (!searchValue) return accessibleModules;
    return accessibleModules.filter(item => 
      item.title.toLowerCase().includes(searchValue.toLowerCase())
    );
  }, [accessibleModules, searchValue]);

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} className="max-w-5xl">
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">Use /commands then Enter to filter</DialogDescription>
      
      <div className="flex items-center border-b px-3 h-14" onKeyDown={handleKeyDown}>
        <Search className="mr-3 h-5 w-5 shrink-0 opacity-50" />
        {activeScope && (
          <Badge variant="secondary" className="mr-2 h-7 gap-1 px-3 animate-in fade-in zoom-in duration-200 bg-primary/10 text-primary border-primary/20">
            <Tag className="h-3.5 w-3.5" />
            <span className="capitalize font-bold text-xs">{activeScope}</span>
            <X 
              className="h-3.5 w-3.5 cursor-pointer hover:text-destructive transition-colors ml-1" 
              onClick={() => setActiveScope(null)} 
            />
          </Badge>
        )}
        <CommandInput
          placeholder={activeScope ? `Search in ${activeScope}...` : "Type /shoppers [Enter] or /users [Enter]..."}
          value={searchValue}
          onValueChange={handleInputChange}
          className="border-none focus:ring-0 text-base flex-1"
        />
      </div>

      <CommandList className="max-h-[60vh]">
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
              <AlertCircle className="mb-3 h-8 w-8 opacity-20" />
              <p className="text-sm font-medium">No matches found</p>
            </div>
          )}
        </CommandEmpty>

        {/* Modules Grid - Hide when a scope is active to focus on results */}
        {!activeScope && (
          <CommandGroup heading={searchValue ? "Matching Modules" : "Accessible Modules"}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-1 p-2">
              {filteredModules.map(item => (
                <CommandItem 
                  key={item.path} 
                  onSelect={() => handleSelect(item.path)} 
                  className="cursor-pointer flex items-center p-3 rounded-xl hover:bg-primary/5 group"
                >
                  <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center mr-3 group-hover:bg-primary/10 transition-colors">
                    <item.icon className="h-4 w-4 group-hover:text-primary transition-colors" />
                  </div>
                  <span className="font-medium group-hover:text-primary transition-colors">{item.title}</span>
                </CommandItem>
              ))}
            </div>
          </CommandGroup>
        )}

        {(searchValue.length >= 2 || activeScope) && data && (
          <>
            <CommandSeparator />
            
            {(data.Users?.length > 0 || data.shoppers?.length > 0 || data.ProjectUsers?.length > 0 || data.orgEmployees?.length > 0) && (
              <CommandGroup heading="People & Accounts">
                {data.Users?.map(item => (
                  <CommandItem 
                    key={`user-${item.id}`} 
                    value={`user ${item.name} ${item.email}`}
                    onSelect={() => handleSelect(`/users?q=${encodeURIComponent(item.name || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <UserIcon className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[10px] text-white/90 uppercase">{item.email} • Customer</span>
                    </div>
                  </CommandItem>
                ))}
                {data.shoppers?.map(item => (
                  <CommandItem 
                    key={`shopper-${item.id}`} 
                    value={`shopper ${item.full_name} ${item.Employment_id}`}
                    onSelect={() => handleSelect(`/shoppers?q=${encodeURIComponent(item.full_name || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Truck className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.full_name}</span>
                      <span className="text-[10px] text-white/90 uppercase">{item.Employment_id} • Plasa</span>
                    </div>
                  </CommandItem>
                ))}
                {data.ProjectUsers?.map(item => (
                  <CommandItem 
                    key={`admin-${item.id}`} 
                    value={`admin project user ${item.username} ${item.email}`}
                    onSelect={() => handleSelect(`/project-users?q=${encodeURIComponent(item.username || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <ShieldCheck className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.username}</span>
                      <span className="text-[10px] text-white/90 uppercase">{item.email} • Project Admin</span>
                    </div>
                  </CommandItem>
                ))}
                {data.orgEmployees?.map(item => (
                  <CommandItem 
                    key={`staff-${item.id}`} 
                    value={`staff employee ${item.fullnames} ${item.employeeID}`}
                    onSelect={() => handleSelect(`/pos/staff?q=${encodeURIComponent(item.fullnames || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <UsersIcon className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.fullnames}</span>
                      <span className="text-[10px] text-white/90 uppercase">ID: {item.employeeID} • Staff</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data.Orders?.length > 0 || data.reel_orders?.length > 0 || data.package_delivery?.length > 0 || data.restaurant_orders?.length > 0 || data.businessProductOrders?.length > 0) && (
              <CommandGroup heading="Orders & Deliveries">
                {data.Orders?.map(item => (
                  <CommandItem 
                    key={`order-${item.id}`} 
                    value={`order ${item.OrderID} ${item.pin} ${item.status}`}
                    onSelect={() => handleSelect(`/orders?q=${item.OrderID}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Package className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Order #{item.OrderID}</span>
                        {item.pin && <Badge variant="outline" className="text-[10px] h-4 border-white/40 text-white bg-white/10">PIN: {item.pin}</Badge>}
                      </div>
                      <span className="text-[10px] text-white/90 uppercase">{item.status || 'Pending'} • {item.total || 0} RWF</span>
                    </div>
                  </CommandItem>
                ))}
                {data.restaurant_orders?.map(item => (
                  <CommandItem 
                    key={`rest-order-${item.id}`} 
                    value={`restaurant order ${item.OrderID} ${item.pin} ${item.status}`}
                    onSelect={() => handleSelect(`/restaurants?q=${item.OrderID}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <ShoppingBag className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Rest. Order #{item.OrderID}</span>
                        {item.pin && <Badge variant="outline" className="text-[10px] h-4 border-white/40 text-white bg-white/10">PIN: {item.pin}</Badge>}
                      </div>
                      <span className="text-[10px] text-white/90 uppercase">{item.status || 'Pending'} • Restaurant</span>
                    </div>
                  </CommandItem>
                ))}
                {data.businessProductOrders?.map(item => (
                  <CommandItem 
                    key={`biz-order-${item.id}`} 
                    value={`business order ${item.OrderID} ${item.pin} ${item.status}`}
                    onSelect={() => handleSelect(`/pos/inventory?q=${item.OrderID}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Building2 className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white">Biz Order #{item.OrderID}</span>
                        {item.pin && <Badge variant="outline" className="text-[10px] h-4 border-white/40 text-white bg-white/10">PIN: {item.pin}</Badge>}
                      </div>
                      <span className="text-[10px] text-white/90 uppercase">{item.status || 'Pending'} • Business</span>
                    </div>
                  </CommandItem>
                ))}
                {data.reel_orders?.map(item => (
                  <CommandItem 
                    key={`reel-order-${item.id}`} 
                    value={`reel order ${item.OrderID} ${item.pin} ${item.status}`}
                    onSelect={() => handleSelect(`/reels?q=${item.OrderID}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Video className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">Reel Order #{item.OrderID}</span>
                      <span className="text-[10px] text-white/90 uppercase">{item.status || 'Active'} • Reel</span>
                    </div>
                  </CommandItem>
                ))}
                {data.package_delivery?.map(item => (
                  <CommandItem 
                    key={`pkg-${item.id}`} 
                    value={`package delivery ${item.DeliveryCode} ${item.status}`}
                    onSelect={() => handleSelect(`/orders?q=${item.DeliveryCode}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Truck className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">Package: {item.DeliveryCode}</span>
                      <span className="text-[10px] text-white/90 uppercase">{item.status || 'In Transit'} • Delivery</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data.Shops?.length > 0 || data.Restaurants?.length > 0) && (
              <CommandGroup heading="Vendors & Stores">
                {data.Shops?.map(item => (
                  <CommandItem 
                    key={`shop-${item.id}`} 
                    value={`shop store ${item.name}`}
                    onSelect={() => handleSelect(`/shops?q=${encodeURIComponent(item.name || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Store className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[10px] text-white/90 uppercase">Verified Shop</span>
                    </div>
                  </CommandItem>
                ))}
                {data.Restaurants?.map(item => (
                  <CommandItem 
                    key={`restaurant-${item.id}`} 
                    value={`restaurant food ${item.name}`}
                    onSelect={() => handleSelect(`/restaurants?q=${encodeURIComponent(item.name || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Building2 className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[10px] text-white/90 uppercase">Restaurant</span>
                    </div>
                  </CommandItem>
                ))}
                {data.business_stores?.map(item => (
                  <CommandItem 
                    key={`biz-store-${item.id}`} 
                    value={`business store account ${item.name}`}
                    onSelect={() => handleSelect(`/shops?q=${encodeURIComponent(item.name || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Building2 className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.name}</span>
                      <span className="text-[10px] text-white/90 uppercase">Business Account</span>
                    </div>
                  </CommandItem>
                ))}
                {data.logisticsAccount?.map(item => (
                  <CommandItem 
                    key={`logistics-${item.id}`} 
                    value={`logistics account ${item.fullname}`}
                    onSelect={() => handleSelect(`/shops?q=${encodeURIComponent(item.fullname || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Truck className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.fullname}</span>
                      <span className="text-[10px] text-white/90 uppercase">Logistics Partner</span>
                    </div>
                  </CommandItem>
                ))}
                {data.pet_vendors?.map(item => (
                  <CommandItem 
                    key={`pet-${item.id}`} 
                    value={`pet vendor vendor ${item.fullname}`}
                    onSelect={() => handleSelect(`/shops?q=${encodeURIComponent(item.fullname || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Tag className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">{item.fullname}</span>
                      <span className="text-[10px] text-white/90 uppercase">Pet Vendor</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {(data.vehicles?.length > 0) && (
              <CommandGroup heading="Assets & Vehicles">
                {data.vehicles?.map(item => (
                  <CommandItem 
                    key={`vehicle-${item.id}`} 
                    value={`vehicle plate car ${item.plate_number}`}
                    onSelect={() => handleSelect(`/shoppers?q=${encodeURIComponent(item.plate_number || '')}`)} 
                    className="cursor-pointer h-16 mb-1 bg-green-600 hover:bg-green-700 aria-selected:bg-green-700 rounded-lg"
                  >
                    <Car className="mr-3 h-5 w-5 text-white" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white">Plate: {item.plate_number}</span>
                      <span className="text-[10px] text-white/90 uppercase">Shopper Vehicle</span>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
