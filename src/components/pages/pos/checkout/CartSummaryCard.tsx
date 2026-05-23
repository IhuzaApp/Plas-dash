import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  ShoppingBag,
  Plus,
  Minus,
  Trash,
  CreditCard,
  Banknote,
  Clock,
  ChevronDown,
  ChevronUp,
  Printer,
  Smartphone,
  CheckCircle,
  Monitor,
} from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import { apiGet, apiPost } from '@/lib/api';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  description?: string;
  measurement_unit?: string;
  image?: string;
}

interface CartSummaryCardProps {
  cart: CartItem[];
  onUpdateQuantity: (id: string, change: number) => void;
  onRemoveItem: (id: string) => void;
  onCheckout: (paymentMethod: 'card' | 'cash' | 'momo', tinNumber?: string) => void;
  onSaveToPending: () => void;
  shopDetails?: {
    name: string;
    address: string;
    phone?: string;
    email?: string;
  };
  currentUser?: {
    id: string; // Add user ID
    name: string;
    email: string;
    role: string;
  };
  shopId?: string;
}

export const CartSummaryCard: React.FC<CartSummaryCardProps> = ({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
  onSaveToPending,
  shopDetails,
  currentUser,
  shopId,
}) => {
  const [isOrderSummaryCollapsed, setIsOrderSummaryCollapsed] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [isPrintConfirmDialogOpen, setIsPrintConfirmDialogOpen] = useState(false);

  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<
    'card' | 'cash' | 'momo' | null
  >(null);
  const [needsTIN, setNeedsTIN] = useState(false);
  const [tinNumber, setTinNumber] = useState('');
  const [lastPaymentDetails, setLastPaymentDetails] = useState<{
    transactionId: string; // Add transaction ID
    paymentMethod: string;
    amount: number;
    tinNumber?: string;
    items: CartItem[];
    shopDetails?: {
      name: string;
      address: string;
      phone?: string;
      email?: string;
    };
    processedBy?: {
      name: string;
      email: string;
      role: string;
    };
    timestamp: string;
  } | null>(null);

  const { toast } = useToast();
  const checkoutMutation = useMutation({
    mutationFn: (variables: {
      Processed_By?: string;
      cartItems?: string;
      payment_method?: string;
      shop_id?: string;
      subtotal?: string;
      tax?: string;
      tin?: string;
      total?: string;
    }) =>
      apiPost<{ insert_shopCheckouts: { returning: Array<{ id: string; number: number }> } }>(
        '/api/pos-checkout',
        variables
      ),
  });
  const { data: systemConfig } = useSystemConfig();

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const handleConfirmPayment = async () => {
    if (needsTIN && !tinNumber.trim()) {
      console.error('TIN Number is required but not provided');
      toast({
        title: 'Error',
        description: 'TIN Number is required when checkbox is checked.',
        variant: 'destructive',
      });
      return;
    }

    if (selectedPaymentMethod) {
      const subtotal = calculateTotal();
      const tax = subtotal * 0.08;
      const totalAmount = subtotal + tax;

      // Console logs showing payment saving details
      const currency = systemConfig?.System_configuratioins?.[0]?.currency || 'RWF';
      console.log('=== PAYMENT PROCESSING STARTED ===');
      console.log('Shop Details:', shopDetails);
      console.log('Processed By:', currentUser);
      console.log('Payment Method:', selectedPaymentMethod.toUpperCase());
      console.log('Currency:', currency);
      console.log('Total Amount:', formatCurrencyWithConfig(totalAmount, systemConfig));
      console.log('TIN Number:', needsTIN ? tinNumber : 'Not included');
      console.log('Items Count:', cart.length);
      console.log(
        'Cart Items:',
        cart.map(item => ({
          id: item.id,
          name: item.name,
          price: formatCurrencyWithConfig(item.price, systemConfig),
          quantity: item.quantity,
          subtotal: formatCurrencyWithConfig(item.price * item.quantity, systemConfig),
        }))
      );
      console.log('Tax Amount:', formatCurrencyWithConfig(tax, systemConfig));
      console.log('Subtotal:', formatCurrencyWithConfig(subtotal, systemConfig));
      console.log('Payment Timestamp:', new Date().toISOString());
      console.log('=== PAYMENT SAVING TO DATABASE ===');

      try {
        // Save checkout to database
        const checkoutData = {
          Processed_By: currentUser?.id || '',
          cartItems: JSON.stringify(cart),
          payment_method: selectedPaymentMethod,
          shop_id: shopId || '',
          subtotal: subtotal.toFixed(2),
          tax: tax.toFixed(2),
          tin: needsTIN ? tinNumber : '',
          total: totalAmount.toFixed(2),
        };

        console.log('Saving checkout data:', checkoutData);

        const result = await checkoutMutation.mutateAsync(checkoutData);
        console.log('Checkout saved successfully:', result);

        // Generate transaction ID using the auto-generated number from database
        const savedCheckout = result.insert_shopCheckouts?.returning?.[0];
        const autoGeneratedNumber = savedCheckout?.number;

        if (autoGeneratedNumber) {
          const now = new Date();
          const year = now.getFullYear().toString().slice(-2);
          const month = (now.getMonth() + 1).toString().padStart(2, '0');
          const transactionId = `TRX-0${year}${month}${autoGeneratedNumber}`;

          console.log('Generated Transaction ID:', transactionId);
          console.log('Auto-generated number from DB:', autoGeneratedNumber);

          // Fetch employee details from API
          let employee = null;
          try {
            const employeeResult = await apiGet<{
              orgEmployee: {
                fullnames?: string;
                email?: string;
                Position?: string;
                roleType?: string;
              } | null;
            }>(`/api/queries/org-employee-by-id?id=${encodeURIComponent(currentUser?.id || '')}`);
            employee = employeeResult.orgEmployee;
            console.log('Employee data from DB:', employee);
          } catch (error) {
            console.error('Error fetching employee data:', error);
          }

          // Save payment details for logging and print confirmation
          const paymentDetails = {
            transactionId, // Use the generated transaction ID
            paymentMethod: selectedPaymentMethod,
            amount: totalAmount,
            tinNumber: needsTIN ? tinNumber : undefined,
            items: [...cart],
            shopDetails: shopDetails,
            processedBy: {
              name: employee?.fullnames || currentUser?.name || 'Unknown User',
              email: employee?.email || currentUser?.email || 'N/A',
              role: employee?.Position || employee?.roleType || currentUser?.role || 'Cashier',
            },
            timestamp: new Date().toISOString(),
          };
          setLastPaymentDetails(paymentDetails);
        }

        // Close MOMO dialog on customer display if payment is confirmed
        if (selectedPaymentMethod === 'momo') {
          console.log('=== CART SUMMARY: CLOSING MOMO DIALOG ON CUSTOMER DISPLAY ===');
          localStorage.setItem(
            'momoDialogState',
            JSON.stringify({
              shouldClose: true,
              timestamp: Date.now(),
            })
          );

          // Dispatch custom event for immediate communication
          window.dispatchEvent(new CustomEvent('momoDialogClose'));

          // Try direct communication with customer display window
          try {
            const customerDisplayWindow = window.open('', 'customer-display');
            if (customerDisplayWindow && (customerDisplayWindow as any).closeMomoDialog) {
              console.log('=== CART SUMMARY: DIRECT MOMO DIALOG CLOSE ===');
              (customerDisplayWindow as any).closeMomoDialog();
            }
          } catch (error) {
            console.log('Direct communication failed, using localStorage fallback');
          }
        }

        // Call the checkout function
        onCheckout(selectedPaymentMethod, needsTIN ? tinNumber : undefined);

        // Close payment dialog
        setIsPaymentDialogOpen(false);

        // Show print confirmation for all payment methods
        setIsPrintConfirmDialogOpen(true);

        // Reset payment form
        setSelectedPaymentMethod(null);
        setNeedsTIN(false);
        setTinNumber('');

        console.log('=== PAYMENT PROCESSING COMPLETED ===');

        toast({
          title: 'Payment Successful',
          description: 'Payment has been processed and saved to database.',
        });
      } catch (error: any) {
        console.error('Error saving checkout:', error);
        toast({
          title: 'Payment Error',
          description: error?.message || 'Failed to save payment to database. Please try again.',
          variant: 'destructive',
        });
      }
    }
  };

  const handlePrintInvoice = () => {
    console.log('=== PRINTING INVOICE ===');
    console.log('Transaction ID:', lastPaymentDetails?.transactionId);
    console.log('Invoice Details:', lastPaymentDetails);
    console.log('Shop Information:', lastPaymentDetails?.shopDetails);
    console.log('Processed By:', lastPaymentDetails?.processedBy);
    console.log('Payment Details:', {
      transactionId: lastPaymentDetails?.transactionId,
      method: lastPaymentDetails?.paymentMethod,
      amount: lastPaymentDetails?.amount,
      tinNumber: lastPaymentDetails?.tinNumber,
      timestamp: lastPaymentDetails?.timestamp,
    });
    console.log('Items to Print:', lastPaymentDetails?.items);
    console.log('Printing timestamp:', new Date().toISOString());

    // Create print content
    // Create print content
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${lastPaymentDetails?.transactionId}</title>
        <style>
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
            margin: 0;
            padding: 15px;
            width: 80mm;
            box-sizing: border-box;
          }
          .receipt {
            width: 100%;
          }
          .header {
            text-align: center;
            margin-bottom: 15px;
          }
          .company-name {
            font-size: 16px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 4px;
          }
          .company-address, .company-phone {
            font-size: 10px;
            color: #333;
            margin-bottom: 2px;
          }
          .separator {
            border-top: 1px dashed #000;
            margin: 10px 0;
          }
          .title {
            text-align: center;
            font-size: 13px;
            font-weight: bold;
            letter-spacing: 2px;
            margin: 8px 0;
            text-transform: uppercase;
          }
          .meta-info {
            font-size: 10px;
            margin-bottom: 10px;
          }
          .meta-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 2px;
          }
          .table-header {
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            border-bottom: 1px solid #000;
            padding-bottom: 4px;
            margin-bottom: 6px;
            font-size: 10px;
          }
          .items {
            margin-bottom: 10px;
          }
          .item-row {
            display: flex;
            flex-direction: column;
            margin-bottom: 6px;
          }
          .item-main {
            display: flex;
            justify-content: space-between;
            font-weight: bold;
          }
          .item-details {
            display: flex;
            justify-content: space-between;
            font-size: 10px;
            color: #444;
            padding-left: 10px;
          }
          .totals {
            margin-top: 10px;
            font-size: 11px;
          }
          .totals-row {
            display: flex;
            justify-content: space-between;
            margin-bottom: 3px;
          }
          .grand-total {
            display: flex;
            justify-content: space-between;
            font-size: 14px;
            font-weight: bold;
            border-top: 1px dashed #000;
            border-bottom: 1px dashed #000;
            padding: 6px 0;
            margin: 6px 0;
          }
          .payment-method {
            font-size: 10px;
            margin-top: 10px;
            font-weight: bold;
          }
          .footer {
            text-align: center;
            margin-top: 20px;
            font-size: 9px;
            line-height: 1.5;
          }
          .barcode-placeholder {
            text-align: center;
            margin-top: 15px;
            letter-spacing: 4px;
            font-size: 10px;
          }
          .barcode-lines {
            width: 150px;
            height: 30px;
            border-left: 1px solid #000;
            border-right: 1px solid #000;
            margin: 4px auto;
            background: repeating-linear-gradient(
              90deg,
              #000,
              #000 2px,
              #fff 2px,
              #fff 4px,
              #000 4px,
              #000 5px,
              #fff 5px,
              #fff 8px
            );
          }
          @media print {
            body {
              padding: 0;
              margin: 0;
            }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">${lastPaymentDetails?.shopDetails?.name || 'SUPERMARKET'}</div>
            <div class="company-address">${lastPaymentDetails?.shopDetails?.address || ''}</div>
            <div class="company-phone">TEL: ${lastPaymentDetails?.shopDetails?.phone || ''}</div>
            ${lastPaymentDetails?.shopDetails?.email ? `<div class="company-phone">EMAIL: ${lastPaymentDetails.shopDetails.email}</div>` : ''}
          </div>

          <div class="separator"></div>
          <div class="title">Sales Receipt</div>
          <div class="separator"></div>

          <div class="meta-info">
            <div class="meta-row">
              <span>Receipt ID:</span>
              <span style="font-weight: bold;">${lastPaymentDetails?.transactionId || 'N/A'}</span>
            </div>
            <div class="meta-row">
              <span>Cashier:</span>
              <span>${lastPaymentDetails?.processedBy?.name || 'N/A'}</span>
            </div>
            <div class="meta-row">
              <span>Date:</span>
              <span>${new Date(lastPaymentDetails?.timestamp || Date.now()).toLocaleString()}</span>
            </div>
          </div>

          <div class="table-header">
            <span style="width: 50%;">ITEM</span>
            <span style="width: 15%; text-align: center;">QTY</span>
            <span style="width: 35%; text-align: right;">TOTAL</span>
          </div>

          <div class="items">
            ${
              lastPaymentDetails?.items
                ?.map(
                  item => `
              <div class="item-row">
                <div class="item-main">
                  <span style="width: 50%;">${item.name}</span>
                  <span style="width: 15%; text-align: center;">${item.quantity}</span>
                  <span style="width: 35%; text-align: right;">${formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}</span>
                </div>
                <div class="item-details">
                  <span>(${formatCurrencyWithConfig(item.price, systemConfig)} each)</span>
                </div>
              </div>
            `
                )
                .join('') || ''
            }
          </div>

          <div class="separator"></div>

          <div class="totals">
            <div class="totals-row">
              <span>Subtotal:</span>
              <span>${formatCurrencyWithConfig((lastPaymentDetails?.amount || 0) / 1.08, systemConfig)}</span>
            </div>
            <div class="totals-row">
              <span>VAT / Tax (8%):</span>
              <span>${formatCurrencyWithConfig((lastPaymentDetails?.amount || 0) - (lastPaymentDetails?.amount || 0) / 1.08, systemConfig)}</span>
            </div>
            <div class="grand-total">
              <span>TOTAL DUE:</span>
              <span>${formatCurrencyWithConfig(lastPaymentDetails?.amount || 0, systemConfig)}</span>
            </div>
          </div>

          <div class="payment-method">
            <div class="meta-row">
              <span>Payment Method:</span>
              <span>${lastPaymentDetails?.paymentMethod?.toUpperCase() || 'N/A'}</span>
            </div>
            ${
              lastPaymentDetails?.tinNumber
                ? `
              <div class="meta-row" style="margin-top: 3px;">
                <span>TIN Number:</span>
                <span>${lastPaymentDetails.tinNumber}</span>
              </div>
            `
                : ''
            }
          </div>

          <div class="separator"></div>

          <div class="barcode-placeholder">
            <div class="barcode-lines"></div>
            <div>${lastPaymentDetails?.transactionId || ''}</div>
          </div>

          <div class="footer">
            Thank you for shopping at ${lastPaymentDetails?.shopDetails?.name || 'our store'}!<br>
            Please check and verify all items before leaving.<br>
            Exchange allowed within 7 days with original receipt.<br>
            Have a wonderful day!
          </div>
        </div>
      </body>
      </html>
    `;

    // Create a new window for printing
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();

      // Wait for content to load then print
      printWindow.onload = () => {
        printWindow.print();
        printWindow.close();
      };
    }

    // Close the print confirmation dialog
    setIsPrintConfirmDialogOpen(false);
    setLastPaymentDetails(null);
  };

  const handleSkipPrint = () => {
    console.log('=== PRINT SKIPPED ===');
    console.log('User chose to skip printing invoice');

    setIsPrintConfirmDialogOpen(false);
    setLastPaymentDetails(null);
  };

  const openCustomerDisplay = () => {
    // Save cart data to localStorage for the customer display page
    localStorage.setItem('customerDisplayCart', JSON.stringify(cart));
    localStorage.setItem('customerDisplayShop', JSON.stringify(shopDetails));

    // Save payment information
    const paymentInfo = {
      paymentMethod: selectedPaymentMethod || 'pending',
      discount: 0, // Can be enhanced later with discount functionality
    };
    localStorage.setItem('customerDisplayPayment', JSON.stringify(paymentInfo));

    // Open customer display page in a new window
    const customerDisplayWindow = window.open(
      '/customer-display',
      'customer-display',
      'width=1400,height=1000,scrollbars=yes,resizable=yes,menubar=no,toolbar=no,location=no,status=no'
    );

    if (customerDisplayWindow) {
      customerDisplayWindow.focus();
    }
  };

  return (
    <>
      <Card className="lg:col-span-2 flex flex-col h-[780px] bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-sm rounded-xl">
        <CardHeader className="pb-3 border-b border-slate-100 dark:border-slate-900">
          <CardTitle className="text-sm font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Cart & Summary
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-6 min-h-0">
          <div className="flex-1 flex flex-col min-h-0 space-y-4">
            
            {/* Scrollable Cart Items */}
            <div className="flex-1 min-h-0">
              <h4 className="text-[10px] font-bold text-slate-400 uppercase mb-2">Cart Items</h4>
              <ScrollArea className="h-[380px] pr-2">
                <div className="space-y-3">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex gap-3 bg-slate-50 dark:bg-slate-900/50 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800/80"
                    >
                      <div className="w-12 h-12 bg-slate-200 dark:bg-slate-950 rounded-lg overflow-hidden shrink-0">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-slate-150 dark:bg-slate-900 flex items-center justify-center text-slate-400">
                            <ShoppingBag className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex justify-between items-start">
                          <h5 className="font-extrabold text-xs text-slate-800 dark:text-slate-100 truncate pr-1">
                            {item.name}
                          </h5>
                          <span className="font-bold text-xs text-slate-800 dark:text-slate-200">
                            {formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}
                          </span>
                        </div>
                        
                        <p className="text-[10px] text-slate-400 font-semibold">
                          {formatCurrencyWithConfig(item.price, systemConfig)}
                          {item.measurement_unit && ` / ${item.measurement_unit}`}
                        </p>

                        {/* Quantity change & Remove row */}
                        <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-slate-800/50">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, -1)}
                              className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              <Minus className="h-2.5 w-2.5" />
                            </button>
                            <span className="text-xs font-extrabold text-slate-800 dark:text-slate-200">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => onUpdateQuantity(item.id, 1)}
                              className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-800 flex items-center justify-center font-black hover:bg-slate-350 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
                            >
                              <Plus className="h-2.5 w-2.5" />
                            </button>
                          </div>
                          <button 
                            type="button"
                            onClick={() => onRemoveItem(item.id)} 
                            className="text-slate-400 hover:text-red-500 transition-colors"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="text-center py-16 text-xs text-slate-400">
                      <ShoppingBag className="mx-auto h-8 w-8 mb-2 opacity-30" />
                      Cart is empty. Select products to begin.
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Financial summary */}
            <div className="border-t border-slate-100 dark:border-slate-900 pt-3 space-y-2 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <div className="flex justify-between">
                <span>Sub Total</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrencyWithConfig(calculateTotal(), systemConfig)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax (8%)</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">{formatCurrencyWithConfig(calculateTotal() * 0.08, systemConfig)}</span>
              </div>
              <div className="flex justify-between text-sm font-extrabold text-slate-800 dark:text-slate-100 pt-1.5 border-t border-slate-100 dark:border-slate-900">
                <span>Amount to be Paid</span>
                <span className="text-primary text-lg">{formatCurrencyWithConfig(calculateTotal() * 1.08, systemConfig)}</span>
              </div>
            </div>

            {/* Actions Grid */}
            <div className="mt-4 space-y-2">
              <Button
                type="button"
                onClick={() => setIsPaymentDialogOpen(true)}
                className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold shadow-md flex items-center justify-center gap-2 h-11"
                disabled={cart.length === 0 || checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </Button>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={openCustomerDisplay}
                  disabled={cart.length === 0}
                  className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-9"
                >
                  <Monitor className="h-3.5 w-3.5 mr-1" /> Display
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onSaveToPending}
                  disabled={cart.length === 0}
                  className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-9"
                >
                  <Clock className="h-3.5 w-3.5 mr-1" /> Hold
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    cart.forEach(item => onRemoveItem(item.id));
                  }}
                  disabled={cart.length === 0}
                  className="text-xs font-bold border-slate-200 dark:border-slate-800 text-red-600 hover:bg-red-50 dark:hover:bg-red-950/20 h-9"
                >
                  Cancel
                </Button>
              </div>
            </div>

          </div>
        </CardContent>
      </Card>

      {/* Payment Dialog */}
      <Dialog
        open={isPaymentDialogOpen}
        onOpenChange={open => {
          setIsPaymentDialogOpen(open);
          // Close MOMO dialog on customer display when payment dialog is closed
          if (!open && selectedPaymentMethod === 'momo') {
            console.log('=== CART SUMMARY: PAYMENT DIALOG CLOSED, CLOSING MOMO DIALOG ===');
            localStorage.setItem(
              'momoDialogState',
              JSON.stringify({
                shouldClose: true,
                timestamp: Date.now(),
              })
            );
          }
        }}
      >
        <DialogContent className="sm:max-w-lg rounded-2xl border-0 p-6">
          <DialogHeader className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <DialogTitle className="flex items-center gap-2 text-base font-extrabold text-slate-800 dark:text-slate-100">
              <Banknote className="h-5 w-5 text-primary animate-pulse" />
              Complete Payment
            </DialogTitle>
            <DialogDescription className="text-xs font-semibold text-slate-400">
              Choose your preferred payment method and click confirm to complete checkout.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wide">Select Payment Method</label>
              <div className="grid grid-cols-3 gap-3">
                {/* Cash Method */}
                <div
                  className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all hover:shadow-sm flex flex-col items-center justify-center gap-2 ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-100 dark:border-slate-850/80 text-slate-500 hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  <div className={`p-2.5 rounded-full ${selectedPaymentMethod === 'cash' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Banknote className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold">Cash</p>
                    <p className="text-[10px] opacity-75 font-medium mt-0.5">Physical Cash</p>
                  </div>
                </div>

                {/* Card Method */}
                <div
                  className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all hover:shadow-sm flex flex-col items-center justify-center gap-2 ${
                    selectedPaymentMethod === 'card'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-100 dark:border-slate-850/80 text-slate-505 hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                  onClick={() => setSelectedPaymentMethod('card')}
                >
                  <div className={`p-2.5 rounded-full ${selectedPaymentMethod === 'card' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold">Card</p>
                    <p className="text-[10px] opacity-75 font-medium mt-0.5">Credit/Debit</p>
                  </div>
                </div>

                {/* MOMO Method */}
                <div
                  className={`relative cursor-pointer rounded-2xl border-2 p-4 transition-all hover:shadow-sm flex flex-col items-center justify-center gap-2 ${
                    selectedPaymentMethod === 'momo'
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-slate-100 dark:border-slate-850/80 text-slate-500 hover:border-slate-200 dark:hover:border-slate-800'
                  }`}
                  onClick={() => setSelectedPaymentMethod('momo')}
                >
                  <div className={`p-2.5 rounded-full ${selectedPaymentMethod === 'momo' ? 'bg-primary/10' : 'bg-slate-100 dark:bg-slate-800'}`}>
                    <Smartphone className="h-5 w-5" />
                  </div>
                  <div className="text-center">
                    <p className="text-xs font-extrabold">MOMO</p>
                    <p className="text-[10px] opacity-75 font-medium mt-0.5">Mobile Money</p>
                  </div>
                </div>
              </div>
            </div>

            {/* MOMO Payment Button */}
            {selectedPaymentMethod === 'momo' && (
              <div className="pt-1">
                <Button
                  type="button"
                  onClick={() => {
                    // Update localStorage to trigger MOMO dialog in customer display
                    const paymentInfo = {
                      paymentMethod: selectedPaymentMethod,
                      discount: 0,
                    };
                    localStorage.setItem('customerDisplayPayment', JSON.stringify(paymentInfo));

                    console.log('=== OPENING MOMO DIALOG ON CUSTOMER DISPLAY ===');
                    console.log('Updated localStorage with:', paymentInfo);

                    toast({
                      title: 'MOMO Payment',
                      description: 'MOMO payment dialog opened on customer display screen.',
                    });
                  }}
                  className="w-full bg-primary hover:bg-primary/90 text-white font-extrabold text-xs shadow-sm flex items-center justify-center gap-2 h-10 rounded-xl"
                >
                  <Smartphone className="h-4 w-4" />
                  Open MOMO Payment on Customer Display
                </Button>
              </div>
            )}

            {/* TIN Number Section */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 space-y-3">
              <div className="flex items-center space-x-2.5">
                <Checkbox
                  id="include-tin"
                  checked={needsTIN}
                  onCheckedChange={checked => setNeedsTIN(checked === true)}
                  className="rounded-md border-slate-300 dark:border-slate-800"
                />
                <label
                  htmlFor="include-tin"
                  className="text-xs font-bold leading-none cursor-pointer text-slate-600 dark:text-slate-350"
                >
                  Include Customer TIN Number
                </label>
              </div>
              {needsTIN && (
                <Input
                  placeholder="Enter Customer TIN Number"
                  value={tinNumber}
                  onChange={e => setTinNumber(e.target.value)}
                  className="text-xs h-9 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl"
                />
              )}
            </div>

            {/* Order Summary in Dialog */}
            <div className="border border-slate-100 dark:border-slate-850 bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-4 space-y-2.5 text-xs font-semibold text-slate-550 dark:text-slate-400">
              <h4 className="font-bold text-[10px] uppercase text-slate-400 tracking-wide">Order Totals</h4>
              <div className="space-y-1.5">
                <div className="flex justify-between">
                  <span>Sub Total</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrencyWithConfig(calculateTotal(), systemConfig)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>VAT / Tax (8%)</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {formatCurrencyWithConfig(calculateTotal() * 0.08, systemConfig)}
                  </span>
                </div>
                <Separator className="bg-slate-100 dark:bg-slate-800" />
                <div className="flex justify-between text-sm font-extrabold text-slate-850 dark:text-slate-150">
                  <span>Total Amount Due</span>
                  <span className="text-primary font-black">
                    {formatCurrencyWithConfig(calculateTotal() * 1.08, systemConfig)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPaymentDialogOpen(false)}
              className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-10 rounded-xl"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handlePrintInvoice}
              className="text-xs font-bold border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 h-10 rounded-xl flex items-center justify-center gap-1.5"
            >
              <Printer className="h-4 w-4 text-slate-500" />
              Print Invoice
            </Button>
            <Button
              type="button"
              onClick={handleConfirmPayment}
              disabled={
                !selectedPaymentMethod ||
                (needsTIN && !tinNumber.trim()) ||
                checkoutMutation.isPending
              }
              className="bg-primary hover:bg-primary/90 text-white font-extrabold shadow-md text-xs px-5 h-10 rounded-xl flex-1 flex items-center justify-center gap-1.5"
            >
              {checkoutMutation.isPending ? 'Processing...' : 'Confirm & Pay'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Confirmation Dialog */}
      <Dialog open={isPrintConfirmDialogOpen} onOpenChange={setIsPrintConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-primary" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription>
              Your payment has been processed successfully. Would you like to print the invoice?
            </DialogDescription>
          </DialogHeader>

          {lastPaymentDetails && (
            <div className="border rounded-lg p-3 bg-primary/10 border-primary/20">
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Payment Method:</span>
                  <span className="font-medium">
                    {lastPaymentDetails.paymentMethod.toUpperCase()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Amount Paid:</span>
                  <span className="font-medium">
                    {formatCurrencyWithConfig(lastPaymentDetails.amount, systemConfig)}
                  </span>
                </div>
                {lastPaymentDetails.tinNumber && (
                  <div className="flex justify-between">
                    <span>TIN Number:</span>
                    <span className="font-medium">{lastPaymentDetails.tinNumber}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Transaction ID:</span>
                  <span className="font-medium">{lastPaymentDetails.transactionId}</span>
                </div>
                <div className="flex justify-between">
                  <span>Items:</span>
                  <span className="font-medium">{lastPaymentDetails.items.length}</span>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Company:</span>
                  <span className="font-medium">{lastPaymentDetails.shopDetails?.name}</span>
                </div>

                <Separator />
                <div className="flex justify-between">
                  <span>Processed By:</span>
                  <span className="font-medium">{lastPaymentDetails.processedBy?.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Email:</span>
                  <span className="font-medium">{lastPaymentDetails.processedBy?.email}</span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleSkipPrint}>
              Skip Print
            </Button>
            <Button onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
