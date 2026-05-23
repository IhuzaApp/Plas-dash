'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, CreditCard, QrCode, Wifi, Percent, Receipt, Sparkles, ShieldCheck, Loader2, Smartphone } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import ThemeToggle from '@/components/layout/ThemeToggle';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
  image?: string;
}

interface CustomerDisplayProps {
  cart: CartItem[];
  subtotal: number;
  discountAmount: number;
  tax: number;
  total: number;
  discount: number;
  paymentMethod: string;
  shopDetails?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
    logo?: string;
    ssd?: string;
  };
  posSessionActive?: boolean;
}

export default function CustomerDisplay({
  cart,
  subtotal,
  discountAmount,
  tax,
  total,
  discount,
  paymentMethod,
  shopDetails,
  posSessionActive = true,
}: CustomerDisplayProps) {
  const { data: systemConfig } = useSystemConfig();

  // Clean merchant ID input from any formatting (e.g. *44603#, 44603, or *182*8*1*44603#)
  const cleanMerchantId = (ssd: string) => {
    if (!ssd) return '';
    const cleaned = ssd.replace(/[^0-9]/g, '');
    if (cleaned.startsWith('18281')) {
      return cleaned.slice(5);
    }
    return cleaned;
  };

  const merchantId = cleanMerchantId(shopDetails?.ssd || '');
  const formattedSsd = `*182*8*1*${merchantId}*${Math.round(total)}#`;

  // If POS session is locked/inactive, show the waiting screen
  if (posSessionActive === false) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-white flex flex-col justify-between p-8 font-sans relative overflow-hidden transition-colors duration-300">
        {/* Ambient background glows */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 dark:bg-primary/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-full blur-[120px] animate-pulse" style={{ animationDuration: '8s' }}></div>

        {/* Top bar */}
        <div className="flex justify-between items-center z-10">
          <div className="flex items-center gap-2">
            {shopDetails?.logo ? (
              <img src={shopDetails.logo} alt={shopDetails.name} className="h-8 w-8 rounded-lg object-cover" />
            ) : (
              <Store className="h-6 w-6 text-primary animate-pulse" />
            )}
            <span className="text-sm font-black tracking-widest text-slate-600 dark:text-slate-300 uppercase">{shopDetails?.name || 'Plas Store'}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1.5 rounded-full text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <Wifi className="h-3.5 w-3.5 animate-pulse" />
              <span>Terminal Connected</span>
            </div>
            <ThemeToggle />
          </div>
        </div>

        {/* Center content */}
        <div className="flex flex-col items-center justify-center text-center max-w-xl mx-auto space-y-8 z-10 py-12">
          {/* Logo container */}
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 rounded-3xl blur-xl animate-ping scale-75 opacity-75"></div>
            <div className="w-28 h-28 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-3xl flex items-center justify-center shadow-2xl relative overflow-hidden">
              {shopDetails?.logo ? (
                <img src={shopDetails.logo} alt={shopDetails.name} className="w-24 h-24 rounded-2xl object-cover" />
              ) : (
                <Store className="w-12 h-12 text-primary" />
              )}
            </div>
          </div>

          <div className="space-y-3">
            <h2 className="text-3xl lg:text-4xl font-black tracking-tight text-slate-950 dark:text-white">
              Next Customer Please
            </h2>
            <p className="text-slate-500 dark:text-slate-400 text-sm font-semibold max-w-md mx-auto leading-relaxed">
              We are ready to serve you. Please present your shopping items to the cashier to begin scanning.
            </p>
          </div>

          {/* Quick Pay Info if SSD is present */}
          {shopDetails?.ssd && (
            <div className="bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 p-5 rounded-2xl max-w-sm w-full space-y-2 shadow-sm">
              <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest block">Quick Mobile Money Pay</span>
              <div className="font-mono text-base font-bold tracking-wider text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 py-2 rounded-xl border border-slate-200 dark:border-slate-800">
                {shopDetails.ssd}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold block">Dial the code above to pay instantly</span>
            </div>
          )}

          {/* Scanning status banner */}
          <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 bg-white dark:bg-slate-900/30 px-4 py-2 rounded-full border border-slate-200 dark:border-slate-900 shadow-sm">
            <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
            <span>Awaiting cashier session...</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-[10px] text-slate-400 dark:text-slate-500 font-bold z-10 uppercase tracking-wider">
          © {new Date().getFullYear()} {shopDetails?.name || 'Plas'}. Powered by Plasa POS.
        </div>
      </div>
    );
  }

  // Dynamic status based on cart and payment method
  const getStatusDetails = () => {
    if (cart.length === 0) {
      return {
        label: 'Ready for scanning',
        color: 'bg-blue-500/10 text-blue-500 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30',
        description: 'Please present your items to the cashier'
      };
    }
    if (paymentMethod && paymentMethod !== 'Not Selected') {
      return {
        label: 'Payment Pending',
        color: 'bg-amber-500/10 text-amber-500 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-400 dark:border-amber-500/30',
        description: `Please proceed with ${paymentMethod.toUpperCase()}`
      };
    }
    return {
      label: 'Scanning Items',
      color: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-400 dark:border-emerald-500/30',
      description: 'Review your items below'
    };
  };

  const status = getStatusDetails();

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 font-sans antialiased text-slate-800 dark:text-slate-100 selection:bg-primary/10">
      {/* Top Banner showing connection status */}
      <div className="bg-slate-900 dark:bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between text-slate-400 text-xs font-semibold">
        <div className="flex items-center gap-2">
          {shopDetails?.logo ? (
            <img src={shopDetails.logo} alt={shopDetails.name} className="h-5 w-5 rounded object-cover" />
          ) : (
            <Store className="h-4 w-4 text-primary" />
          )}
          <span className="text-slate-200 uppercase tracking-wider font-extrabold text-[10px]">
            {shopDetails?.name || 'Plas Store'} POS Terminal
          </span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/25">
            <Wifi className="h-3 w-3 animate-pulse" />
            <span>Connected</span>
          </div>
          <ThemeToggle />
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
          <div className="flex items-center gap-4">
            {shopDetails?.logo && (
              <div className="w-12 h-12 bg-slate-50 dark:bg-slate-955 rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800/80 overflow-hidden shrink-0">
                <img src={shopDetails.logo} alt={shopDetails.name} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="space-y-1">
              <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
                Welcome to {shopDetails?.name || 'Our Store'}
                <Sparkles className="h-5 w-5 text-amber-500 animate-spin animate-pulse" style={{ animationDuration: '6s' }} />
              </h1>
              <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
                {shopDetails?.address || 'Real-time customer display terminal'}
              </p>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl border font-bold text-xs flex flex-col items-start gap-0.5 ${status.color}`}>
            <span className="uppercase tracking-wider text-[10px] opacity-75 font-extrabold">Current Status</span>
            <span>{status.label}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Cart View - Column 7 */}
          <div className="lg:col-span-7 space-y-4">
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4 text-primary" />
                  Your Order List
                </CardTitle>
                <Badge className="bg-primary/10 text-primary hover:bg-primary/10 border-0 text-xs px-3 py-1 font-extrabold rounded-lg">
                  {cart.reduce((sum, item) => sum + item.quantity, 0)} Items
                </Badge>
              </CardHeader>

              <CardContent className="p-6">
                {cart.length === 0 ? (
                  <div className="text-center py-20 space-y-3">
                    <div className="w-16 h-16 bg-slate-50 dark:bg-slate-950 rounded-full flex items-center justify-center mx-auto border border-slate-100 dark:border-slate-800/80">
                      <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-700" />
                    </div>
                    <h3 className="text-base font-bold text-slate-700 dark:text-slate-300">Your shopping cart is empty</h3>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto">
                      Scanned items will appear here instantly for your verification.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3.5 max-h-[520px] overflow-y-auto pr-1">
                    {cart.map((item, index) => (
                      <div
                        key={`${item.id}-${index}`}
                        className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/60 transition-all hover:shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-200 dark:bg-slate-900 flex items-center justify-center shrink-0 text-slate-400 overflow-hidden font-extrabold text-xs">
                          {item.image ? (
                            <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <ShoppingCart className="h-5 w-5 opacity-40" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex justify-between items-start gap-2">
                            <h3 className="font-extrabold text-sm text-slate-900 dark:text-slate-100 truncate">
                              {item.name}
                            </h3>
                            <span className="font-extrabold text-sm text-slate-900 dark:text-slate-100 shrink-0">
                              {formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}
                            </span>
                          </div>

                          <div className="flex justify-between items-center text-xs">
                            <div className="flex items-center gap-2">
                              <span className="text-slate-400 font-bold">
                                {formatCurrencyWithConfig(item.price, systemConfig)} each
                              </span>
                              <Badge variant="outline" className="text-[10px] font-bold border-slate-200 dark:border-slate-800 text-slate-505 py-0 px-1.5">
                                {item.category || 'General'}
                              </Badge>
                            </div>
                            <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                              Qty: {item.quantity}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Pricing & Checkout Summary - Column 5 */}
          <div className="lg:col-span-5 space-y-6">
            <Card className="border-0 shadow-md bg-white dark:bg-slate-900 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 border-b border-slate-100 dark:border-slate-800/60">
                <CardTitle className="text-sm font-extrabold text-slate-800 dark:text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Receipt className="h-4 w-4 text-primary" />
                  Order Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-5">
                
                {/* Financial breakdown */}
                <div className="space-y-3.5 text-sm font-semibold text-slate-600 dark:text-slate-400">
                  <div className="flex justify-between items-center">
                    <span>Subtotal</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrencyWithConfig(subtotal, systemConfig)}
                    </span>
                  </div>

                  {discount > 0 && (
                    <div className="flex justify-between items-center text-emerald-600 dark:text-emerald-400">
                      <span className="flex items-center gap-1">
                        <Percent className="h-3.5 w-3.5" />
                        Discount ({discount}%)
                      </span>
                      <span className="font-bold">
                        -{formatCurrencyWithConfig(discountAmount, systemConfig)}
                      </span>
                    </div>
                  )}

                  <div className="flex justify-between items-center">
                    <span>VAT / Tax (8%)</span>
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {formatCurrencyWithConfig(tax, systemConfig)}
                    </span>
                  </div>

                  <Separator className="bg-slate-100 dark:bg-slate-800" />

                  <div className="bg-primary/5 dark:bg-primary/10 border border-primary/10 p-5 rounded-2xl flex justify-between items-center">
                    <span className="text-base font-black text-slate-900 dark:text-white">Amount Due</span>
                    <span className="text-2xl font-black text-primary">
                      {formatCurrencyWithConfig(total, systemConfig)}
                    </span>
                  </div>
                </div>

                {/* Custom Payment Details / Instructions */}
                {cart.length > 0 && paymentMethod && paymentMethod !== 'Not Selected' && (
                  <div className="space-y-4 pt-2">
                    {paymentMethod === 'momo' ? (
                      <div className="p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm text-center space-y-2">
                        <span className="text-[10px] text-amber-500 font-extrabold uppercase tracking-wider block">Quick Dial Code</span>
                        <div className="font-mono text-sm font-bold tracking-wider text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-950 py-2.5 rounded-xl border border-slate-100 dark:border-slate-800">
                          {formattedSsd}
                        </div>
                        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-normal">
                          Dial the code above to pay {formatCurrencyWithConfig(total, systemConfig)} instantly.
                        </p>
                      </div>
                    ) : (
                      <>
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                          Payment Details
                        </h4>
                        <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 space-y-3 text-xs font-semibold">
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Method</span>
                            <Badge className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-0 text-[10px] font-bold px-2 py-0.5">
                              {paymentMethod === 'cash' ? 'Cash' : 'Credit/Debit Card'}
                            </Badge>
                          </div>

                          {paymentMethod === 'card' && (
                            <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <CreditCard className="h-10 w-10 text-primary animate-bounce" />
                              <p className="text-[10px] text-center text-slate-400">
                                Please insert or tap your card on the payment terminal.
                              </p>
                            </div>
                          )}

                          {paymentMethod === 'cash' && (
                            <div className="flex flex-col items-center gap-1 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                              <p className="text-[10px] text-center text-slate-400">
                                Please hand over the cash to the cashier.
                              </p>
                            </div>
                          )}

                          <div className="flex justify-between items-center pt-2 border-t border-slate-100 dark:border-slate-800/80">
                            <span className="text-slate-400">Reference ID</span>
                            <span className="font-mono text-slate-500 text-[10px]">
                              TXN-{Date.now().toString().slice(-6)}
                            </span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Security disclaimer */}
            <div className="flex items-center gap-2 bg-slate-100/50 dark:bg-slate-900/30 p-4 rounded-xl border border-slate-100 dark:border-slate-800/60">
              <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                Your transaction is secure and encrypted. Thank you for shopping with us! Please verify items before making payment.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
