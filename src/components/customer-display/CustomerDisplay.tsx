'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store, CreditCard, QrCode, Wifi, Percent, Receipt, Sparkles, ShieldCheck } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';

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
}

export default function CustomerDisplay({
  cart,
  subtotal,
  discountAmount,
  tax,
  total,
  discount,
  paymentMethod,
}: CustomerDisplayProps) {
  const { data: systemConfig } = useSystemConfig();

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
          <Store className="h-4 w-4 text-primary" />
          <span className="text-slate-200 uppercase tracking-wider font-extrabold text-[10px]">Plas Store POS Terminal</span>
        </div>
        <div className="flex items-center gap-1.5 bg-emerald-500/10 text-emerald-400 px-2.5 py-1 rounded-full border border-emerald-500/25">
          <Wifi className="h-3 w-3 animate-pulse" />
          <span>Connected</span>
        </div>
      </div>

      <div className="mx-auto max-w-[1400px] p-6 lg:p-8 space-y-6">
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800/60 shadow-sm">
          <div className="space-y-1">
            <h1 className="text-2xl lg:text-3xl font-black tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
              Welcome to Our Store
              <Sparkles className="h-5 w-5 text-amber-500 animate-spin" style={{ animationDuration: '6s' }} />
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 font-medium">
              Real-time customer display terminal
            </p>
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
                      <ShoppingCart className="h-8 w-8 text-slate-300 dark:text-slate-750" />
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
                        className="flex gap-4 p-4 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-850/60 transition-all hover:shadow-sm"
                      >
                        <div className="w-12 h-12 rounded-xl bg-slate-205 dark:bg-slate-900 flex items-center justify-center shrink-0 text-slate-400 overflow-hidden font-extrabold text-xs">
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
                            <span className="font-bold text-slate-600 dark:text-slate-400 bg-slate-150 dark:bg-slate-900 px-2 py-0.5 rounded">
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
                    <span className="font-bold text-slate-955 dark:text-slate-100">
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
                    <span className="font-bold text-slate-955 dark:text-slate-100">
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
                {cart.length > 0 && (
                  <div className="space-y-4 pt-2">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      Payment Details
                    </h4>
                    <div className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/30 space-y-3 text-xs font-semibold">
                      <div className="flex justify-between items-center">
                        <span className="text-slate-400">Method</span>
                        <Badge className="bg-slate-205 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 border-0 text-[10px] font-bold px-2 py-0.5">
                          {paymentMethod
                            ? paymentMethod === 'cash'
                              ? 'Cash'
                              : paymentMethod === 'card'
                                ? 'Credit/Debit Card'
                                : paymentMethod === 'momo'
                                  ? 'Mobile Money'
                                  : 'Not Selected'
                            : 'Pending Selection'}
                        </Badge>
                      </div>

                      {paymentMethod === 'momo' && (
                        <div className="flex flex-col items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                          <QrCode className="h-20 w-20 text-slate-800 dark:text-slate-200 animate-pulse" />
                          <p className="text-[10px] text-center text-slate-400 max-w-xs leading-relaxed">
                            Scan the QR code or approve the MoMo prompt on your phone.
                          </p>
                        </div>
                      )}

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
