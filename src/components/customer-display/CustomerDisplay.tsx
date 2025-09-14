'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ShoppingCart, Store } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
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

  return (
    <div className="min-h-screen bg-white p-4">
      <div className="mx-auto max-w-[1400px]">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-4 mb-4">
            <Store className="h-16 w-16 text-black" />
            <h1 className="text-5xl font-bold text-black">Welcome</h1>
          </div>
          <p className="text-2xl text-gray-600">Please review your order details</p>
        </div>

        <div className="grid grid-cols-12 gap-8">
          {/* Order Display - Column 7 */}
          <div className="col-span-7">
            <Card className="shadow-2xl border-0">
              <CardHeader className="bg-black text-white rounded-t-lg">
                <CardTitle className="flex items-center justify-between text-3xl">
                  <span className="flex items-center gap-4">
                    <ShoppingCart className="h-10 w-10" />
                    Order Details
                  </span>
                  <Badge variant="secondary" className="text-xl px-6 py-3 bg-white text-black">
                    {cart.reduce((sum, item) => sum + item.quantity, 0)} items
                  </Badge>
                </CardTitle>
              </CardHeader>

              <CardContent className="p-10">
                {cart.length === 0 ? (
                  <div className="text-center py-20">
                    <ShoppingCart className="h-32 w-32 text-gray-300 mx-auto mb-8" />
                    <p className="text-3xl text-gray-500">Your cart is empty</p>
                    <p className="text-xl text-gray-400 mt-3">
                      Items will appear here as they are scanned
                    </p>
                  </div>
                ) : (
                  <>
                    {/* Items List */}
                    <div className="space-y-6 mb-10 max-h-[500px] overflow-y-auto">
                      {cart.map((item, index) => (
                        <div
                          key={`${item.id}-${index}`}
                          className="flex items-center justify-between p-6 bg-gray-100 rounded-xl border-l-4 border-black hover:bg-gray-200 transition-colors"
                        >
                          <div className="flex-1">
                            <h3 className="text-2xl font-semibold text-black mb-2">{item.name}</h3>
                            <div className="flex items-center gap-4">
                              <Badge
                                variant="outline"
                                className="text-base border-black text-black px-3 py-1"
                              >
                                {item.category || 'General'}
                              </Badge>
                              <span className="text-xl text-gray-700">
                                {formatCurrencyWithConfig(item.price, systemConfig)} each
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-3xl font-bold text-black mb-2">
                              {formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}
                            </div>
                            <div className="text-xl text-gray-600">Qty: {item.quantity}</div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <Separator className="my-8" />

                    {/* Order Summary */}
                    <div className="space-y-6">
                      <div className="flex justify-between items-center text-2xl">
                        <span className="text-gray-700">Subtotal:</span>
                        <span className="font-semibold">
                          {formatCurrencyWithConfig(subtotal, systemConfig)}
                        </span>
                      </div>

                      {discount > 0 && (
                        <div className="flex justify-between items-center text-2xl text-green-600">
                          <span>Discount ({discount}%):</span>
                          <span className="font-semibold">
                            -{formatCurrencyWithConfig(discountAmount, systemConfig)}
                          </span>
                        </div>
                      )}

                      <div className="flex justify-between items-center text-2xl">
                        <span className="text-gray-700">Tax:</span>
                        <span className="font-semibold">
                          {formatCurrencyWithConfig(tax, systemConfig)}
                        </span>
                      </div>

                      <Separator />

                      <div className="flex justify-between items-center text-4xl font-bold bg-gray-100 p-6 rounded-xl border-2 border-black">
                        <span className="text-black">Total:</span>
                        <span className="text-black">
                          {formatCurrencyWithConfig(total, systemConfig)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Details - Column 5 */}
          <div className="col-span-5">
            {cart.length > 0 && (
              <Card className="shadow-2xl border-2 border-black">
                <CardHeader className="bg-gray-900 text-white rounded-t-lg">
                  <CardTitle className="text-3xl">Transaction Details</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6">
                  {/* Payment Information */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-black border-b border-gray-300 pb-3">
                      Payment Information
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-lg">Payment Method:</span>
                        <span className="font-medium text-black text-lg">
                          {paymentMethod
                            ? paymentMethod === 'cash'
                              ? 'Cash'
                              : paymentMethod === 'card'
                                ? 'Credit/Debit Card'
                                : paymentMethod === 'momo'
                                  ? 'Mobile Money'
                                  : 'Not Selected'
                            : 'Pending Selection'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-lg">Transaction ID:</span>
                        <span className="font-mono text-black text-lg">
                          #TXN-{Date.now().toString().slice(-6)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-lg">Date & Time:</span>
                        <span className="text-black text-lg">{new Date().toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tax Breakdown */}
                  <div className="space-y-4">
                    <h3 className="text-xl font-semibold text-black border-b border-gray-300 pb-3">
                      Tax Breakdown
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-lg">Tax Rate:</span>
                        <span className="text-black text-lg">8.00%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-lg">Taxable Amount:</span>
                        <span className="text-black text-lg">
                          {formatCurrencyWithConfig(subtotal - discountAmount, systemConfig)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-700 text-lg">Tax Amount:</span>
                        <span className="text-black text-lg">
                          {formatCurrencyWithConfig(tax, systemConfig)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Order Summary Table */}
                  <div className="mt-8">
                    <h3 className="text-xl font-semibold text-black border-b border-gray-300 pb-3 mb-6">
                      Order Summary
                    </h3>
                    <div className="bg-gray-50 p-6 rounded-lg border border-gray-200">
                      <div className="space-y-3">
                        <div className="flex justify-between text-xl">
                          <span className="text-gray-700">
                            Items ({cart.reduce((sum, item) => sum + item.quantity, 0)}):
                          </span>
                          <span className="text-black">
                            {formatCurrencyWithConfig(subtotal, systemConfig)}
                          </span>
                        </div>
                        {discount > 0 && (
                          <div className="flex justify-between text-xl">
                            <span className="text-gray-700">Discount ({discount}%):</span>
                            <span className="text-black">
                              -{formatCurrencyWithConfig(discountAmount, systemConfig)}
                            </span>
                          </div>
                        )}
                        <div className="flex justify-between text-xl">
                          <span className="text-gray-700">Tax (8%):</span>
                          <span className="text-black">
                            {formatCurrencyWithConfig(tax, systemConfig)}
                          </span>
                        </div>
                        <div className="border-t border-gray-400 pt-3 mt-3">
                          <div className="flex justify-between text-3xl font-bold">
                            <span className="text-black">Amount Due:</span>
                            <span className="text-black">
                              {formatCurrencyWithConfig(total, systemConfig)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Footer Message */}
        <div className="text-center mt-10">
          <p className="text-2xl text-gray-600">Thank you for shopping with us!</p>
          <p className="text-lg text-gray-500 mt-3">Please verify your order before payment</p>
        </div>
      </div>
    </div>
  );
}
