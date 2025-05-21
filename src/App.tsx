
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/orders" element={<Index />} />
          <Route path="/shoppers" element={<Index />} />
          <Route path="/users" element={<Index />} />
          <Route path="/shops" element={<Index />} />
          <Route path="/products" element={<Index />} />
          <Route path="/company-wallet" element={<Index />} />
          <Route path="/shopper-wallets" element={<Index />} />
          <Route path="/refunds" element={<Index />} />
          <Route path="/tickets" element={<Index />} />
          <Route path="/delivery-settings" element={<Index />} />
          <Route path="/promotions" element={<Index />} />
          <Route path="/settings" element={<Index />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
