import React from 'react';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import {
  Users,
  ShoppingBag,
  Store,
  Package,
  MessageSquare,
  Search,
  Loader2,
  User,
  Receipt,
  AlertCircle,
} from "lucide-react";
import { DialogTitle, DialogDescription } from '@/components/ui/dialog';

// Import existing queries
import { GET_USERS, GET_PRODUCTS, GET_SHOPS } from '@/lib/graphql/queries';

const SEARCH_QUERY = `
  query GlobalSearch($searchTerm: String!) {
    Users(
      where: {
        _or: [
          { name: { _ilike: $searchTerm } },
          { email: { _ilike: $searchTerm } },
          { phone: { _ilike: $searchTerm } }
        ]
      },
      limit: 10,
      order_by: { name: asc }
    ) {
      id
      name
      email
      phone
      role
      profile_picture
      is_active
      created_at
    }
    Products(
      where: {
        _or: [
          { name: { _ilike: $searchTerm } },
          { description: { _ilike: $searchTerm } }
        ]
      },
      limit: 5,
      order_by: { name: asc }
    ) {
      id
      name
      description
      price
      quantity
      measurement_unit
      image
      Shop {
        id
        name
        category_id
      }
    }
    Shops(
      where: {
        _or: [
          { name: { _ilike: $searchTerm } },
          { description: { _ilike: $searchTerm } },
          { address: { _ilike: $searchTerm } }
        ]
      },
      limit: 5,
      order_by: { name: asc }
    ) {
      id
      name
      description
      address
      operating_hours
      image
      category: Category {
        id
        name
      }
      Products_aggregate {
        aggregate {
          count
        }
      }
    }
  }
`;

interface SearchResult {
  Users: Array<{
    id: string;
    name: string;
    email: string;
    phone: string;
    role?: string;
    profile_picture?: string;
    is_active: boolean;
    created_at: string;
  }>;
  Products: Array<{
    id: string;
    name: string;
    description: string;
    price: string;
    quantity: number;
    measurement_unit: string;
    image?: string;
    Shop: {
      id: string;
      name: string;
      category_id: string;
    };
  }>;
  Shops: Array<{
    id: string;
    name: string;
    description: string;
    address: string;
    operating_hours: string;
    image?: string;
    category: {
      id: string;
      name: string;
    };
    Products_aggregate: {
      aggregate: {
        count: number;
      };
    };
  }>;
}

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const navigationItems = [
  {
    title: "Dashboard",
    icon: Search,
    path: "/",
  },
  {
    title: "Orders",
    icon: Package,
    path: "/orders",
  },
  {
    title: "Products",
    icon: ShoppingBag,
    path: "/products",
  },
  {
    title: "Shops",
    icon: Store,
    path: "/shops",
  },
  {
    title: "Users",
    icon: Users,
    path: "/users",
    searchTerms: ["users", "customers", "shoppers", "people", "accounts"],
  },
  {
    title: "Tickets",
    icon: MessageSquare,
    path: "/tickets",
  },
  {
    title: "Refunds",
    icon: Receipt,
    path: "/refunds",
  },
];

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const router = useRouter();
  const [searchValue, setSearchValue] = React.useState("");

  const filteredNavigationItems = React.useMemo(() => {
    if (!searchValue) return navigationItems;
    return navigationItems.filter(item => 
      item.title.toLowerCase().includes(searchValue.toLowerCase()) ||
      item.searchTerms?.some(term => term.includes(searchValue.toLowerCase()))
    );
  }, [searchValue]);

  const { data, isLoading } = useQuery<SearchResult | null, Error>({
    queryKey: ['global-search', searchValue],
    queryFn: async () => {
      if (!searchValue || searchValue.length < 2) return null;
      
      const searchPattern = `%${searchValue.trim().toLowerCase()}%`;
      console.log('Search value:', searchValue);
      console.log('Search pattern:', searchPattern);
      
      try {
        const response = await hasuraRequest<SearchResult>(SEARCH_QUERY, { searchTerm: searchPattern });
        console.log('Raw response:', response);
        
        // Return the response directly since hasuraRequest already returns the data
        return {
          Users: response?.Users || [],
          Products: response?.Products || [],
          Shops: response?.Shops || []
        };
      } catch (error) {
        console.error('Search error:', error);
        // Return empty results instead of undefined on error
        return {
          Users: [],
          Products: [],
          Shops: []
        };
      }
    },
    enabled: searchValue.length >= 2,
    retry: 1
  });

  // Add debug logging for the data
  React.useEffect(() => {
    if (data) {
      console.log('Processed search results:', data);
    }
  }, [data]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [onOpenChange]);

  const handleSelect = (path: string, userId?: string) => {
    if (userId) {
      // For users, navigate to users page and highlight the user
      router.push('/users');
      // Use a small delay to ensure the page has loaded before trying to highlight
      setTimeout(() => {
        const userRow = document.getElementById(`user-${userId}`);
        if (userRow) {
          userRow.scrollIntoView({ behavior: 'smooth', block: 'center' });
          // Add multiple classes for the highlight effect
          userRow.classList.add('bg-green-100', 'transition-all', 'duration-1000');
          
          // Find and click the View Profile button
          const viewProfileButton = userRow.querySelector('button');
          if (viewProfileButton) {
            viewProfileButton.click();
          }
          
          // Remove highlight after a few seconds
          setTimeout(() => {
            userRow.classList.remove('bg-green-100');
          }, 3000);
        }
      }, 100);
    } else {
      // For other items, just navigate
      router.push(path);
    }
    onOpenChange(false);
    setSearchValue("");
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <DialogTitle className="sr-only">Search</DialogTitle>
      <DialogDescription className="sr-only">
        Search across users, products, shops, and more
      </DialogDescription>
      
      <CommandInput 
        placeholder="Search users, products, shops..." 
        value={searchValue}
        onValueChange={setSearchValue}
      />
      <CommandList>
        <CommandEmpty>
          {isLoading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          ) : (
            <div className="flex items-center justify-center py-4 text-sm text-muted-foreground">
              <AlertCircle className="mr-2 h-4 w-4" />
              No results found
            </div>
          )}
        </CommandEmpty>

        {/* Quick Navigation */}
        <CommandGroup heading="Quick Navigation">
          {filteredNavigationItems.map((item) => (
            <CommandItem
              key={item.path}
              value={item.title}
              onSelect={() => handleSelect(item.path)}
            >
              <item.icon className="mr-2 h-4 w-4" />
              {item.title}
            </CommandItem>
          ))}
        </CommandGroup>

        <CommandSeparator />

        {/* Users */}
        {data?.Users && data.Users.length > 0 && (
          <CommandGroup heading="Users">
            {data.Users.map((user) => (
              <CommandItem
                key={user.id}
                value={`${user.name} ${user.email}`}
                onSelect={() => handleSelect('/users', user.id)}
              >
                <User className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span className="font-medium">{user.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {user.email} • {user.role || 'User'}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Products */}
        {data?.Products && data.Products.length > 0 && (
          <CommandGroup heading="Products">
            {data.Products.map((product) => (
              <CommandItem
                key={product.id}
                value={product.name}
                onSelect={() => handleSelect(`/products/${product.id}`)}
              >
                <ShoppingBag className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{product.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {product.Shop.name} • {product.measurement_unit}: {product.quantity} • ${product.price}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Shops */}
        {data?.Shops && data.Shops.length > 0 && (
          <CommandGroup heading="Shops">
            {data.Shops.map((shop) => (
              <CommandItem
                key={shop.id}
                value={shop.name}
                onSelect={() => handleSelect(`/shops/${shop.id}`)}
              >
                <Store className="mr-2 h-4 w-4" />
                <div className="flex flex-col">
                  <span>{shop.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {shop.category.name} • {shop.Products_aggregate.aggregate.count} products
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {shop.address} • {shop.operating_hours}
                  </span>
                </div>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
} 