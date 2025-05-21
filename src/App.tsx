
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import React from "react"; // Add explicit React import

// Pages
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Shoppers from "./pages/Shoppers";
import Users from "./pages/Users";
import Shops from "./pages/Shops";
import ShopDetail from "./pages/ShopDetail";
import Products from "./pages/Products";
import Wallets from "./pages/Wallets";
import Refunds from "./pages/Refunds";
import Tickets from "./pages/Tickets";
import DeliverySettings from "./pages/DeliverySettings";
import Promotions from "./pages/Promotions";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

// Create the query client inside the component
const App = () => {
  // Create a client for React Query
  const queryClient = new QueryClient();

  return (
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light">
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/shoppers" element={<Shoppers />} />
                <Route path="/users" element={<Users />} />
                <Route path="/shops" element={<Shops />} />
                <Route path="/shops/:id" element={<ShopDetail />} />
                <Route path="/products" element={<Products />} />
                <Route path="/company-wallet" element={<Wallets />} />
                <Route path="/shopper-wallets" element={<Wallets />} />
                <Route path="/refunds" element={<Refunds />} />
                <Route path="/tickets" element={<Tickets />} />
                <Route path="/delivery-settings" element={<DeliverySettings />} />
                <Route path="/promotions" element={<Promotions />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </React.StrictMode>
  );
};

export default App;
