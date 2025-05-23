import React from "react";
import Link from "next/link";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import {
  BarChart,
  Package,
  Users,
  ShoppingCart,
  Settings,
  Store,
  User,
  Wallet,
  MessageSquare,
  Clock,
  Percent,
  ShoppingBag,
  Receipt,
  CreditCard,
  Tag,
  Coins,
  LayoutDashboard,
} from "lucide-react";

interface AdminSidebarProps {
  isSidebarOpen: boolean;
}

const AdminSidebar = ({ isSidebarOpen }: AdminSidebarProps) => {
  const menuItems = [
    { section: "Overview", items: [
      { title: "Dashboard", icon: BarChart, path: "/" },
    ]},
    { section: "Management", items: [
      { title: "Orders", icon: Package, path: "/orders" },
      { title: "Shoppers", icon: User, path: "/shoppers" },
      { title: "Customers", icon: Users, path: "/users" },
      { title: "Shops", icon: Store, path: "/shops" },
      { title: "Products", icon: ShoppingCart, path: "/products" },
    ]},
    { section: "POS", items: [
      { title: "Company Dashboard", icon: LayoutDashboard, path: "/pos/company-dashboard" },
      { title: "Shop Dashboard", icon: Store, path: "/pos/shop-dashboard" },
      { title: "Checkout", icon: CreditCard, path: "/pos/checkout" },
      { title: "Inventory", icon: ShoppingBag, path: "/pos/inventory" },
      { title: "Transactions", icon: Receipt, path: "/pos/transactions" },
      { title: "Discounts", icon: Tag, path: "/pos/discounts" },
      { title: "Financial Overview", icon: Coins, path: "/pos/financial" },
      { title: "Staff Management", icon: Users, path: "/pos/staff" },
    ]},
    { section: "Finance", items: [
      { title: "Company Wallet", icon: Wallet, path: "/company-wallet" },
      { title: "Shopper Wallets", icon: Wallet, path: "/shopper-wallets" },
      { title: "Refund Claims", icon: Wallet, path: "/refunds" },
    ]},
    { section: "Support", items: [
      { title: "Tickets", icon: MessageSquare, path: "/tickets" },
    ]},
    { section: "Configuration", items: [
      { title: "Delivery Settings", icon: Clock, path: "/delivery-settings" },
      { title: "Promotions", icon: Percent, path: "/promotions" },
      { title: "System Settings", icon: Settings, path: "/settings" },
    ]},
  ];

  return (
    <Sidebar className={`fixed left-0 top-0 bottom-0 z-40 transition-all ${isSidebarOpen ? 'w-64' : 'w-20'}`}>
      <SidebarHeader className="h-14 flex items-center px-4">
        <div className={`flex items-center ${isSidebarOpen ? 'justify-start' : 'justify-center'} w-full`}>
          {isSidebarOpen ? (
            <h1 className="text-lg font-bold text-primary">DeliveryAdmin</h1>
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold">
              D
            </div>
          )}
        </div>
      </SidebarHeader>
      <SidebarContent>
        {menuItems.map((section) => (
          <SidebarGroup key={section.section}>
            {isSidebarOpen && (
              <SidebarGroupLabel>{section.section}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {section.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link href={item.path} className={`flex items-center ${isSidebarOpen ? 'px-3' : 'justify-center'}`}>
                        <item.icon className="h-5 w-5 mr-2" />
                        {isSidebarOpen && <span>{item.title}</span>}
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="py-4">
        {isSidebarOpen && (
          <div className="px-4 text-xs text-sidebar-foreground/60">
            v1.0.0 • Plas
          </div>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AdminSidebar;
