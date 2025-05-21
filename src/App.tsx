
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";

// Pages
import Index from "./pages/Index";
import Orders from "./pages/Orders";
import Shoppers from "./pages/Shoppers";
import Users from "./pages/Users";
import Shops from "./pages/Shops";
import Products from "./pages/Products";
import Wallets from "./pages/Wallets";
import Refunds from "./pages/Refunds";
import Tickets from "./pages/Tickets";
import DeliverySettings from "./pages/DeliverySettings";
import Promotions from "./pages/Promotions";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
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
);

export default App;
