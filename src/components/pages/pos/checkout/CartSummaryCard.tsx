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
      } catch (error) {
        console.error('Error saving checkout:', error);
        toast({
          title: 'Payment Error',
          description: 'Failed to save payment to database. Please try again.',
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
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Receipt - ${lastPaymentDetails?.transactionId}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; }
          .receipt { max-width: 300px; margin: 0 auto; }
          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
          .company-name { font-size: 18px; font-weight: bold; margin-bottom: 5px; }
          .company-address { font-size: 12px; color: #666; margin-bottom: 5px; }
          .transaction-id { font-size: 14px; font-weight: bold; margin-bottom: 10px; }
          .items { margin-bottom: 20px; }
          .item { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .item-name { flex: 1; }
          .item-price { text-align: right; }
          .totals { border-top: 1px solid #000; padding-top: 10px; }
          .total-row { display: flex; justify-content: space-between; margin-bottom: 5px; }
          .payment-info { margin-top: 20px; border-top: 1px solid #000; padding-top: 10px; }
          .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          @media print {
            body { margin: 0; }
            .receipt { max-width: none; }
          }
        </style>
      </head>
      <body>
        <div class="receipt">
          <div class="header">
            <div class="company-name">${lastPaymentDetails?.shopDetails?.name || 'Company Name'}</div>
            <div class="company-address">${lastPaymentDetails?.shopDetails?.address || 'Company Address'}</div>
            <div class="company-address">${lastPaymentDetails?.shopDetails?.phone || 'Phone'}</div>
          </div>
          
          <div class="transaction-id">
            Transaction ID: ${lastPaymentDetails?.transactionId || 'N/A'}
          </div>
          
          <div class="items">
            ${
              lastPaymentDetails?.items
                ?.map(
                  item => `
              <div class="item">
                <span class="item-name">${item.name} x${item.quantity}</span>
                <span class="item-price">${formatCurrencyWithConfig(item.price * item.quantity, systemConfig)}</span>
              </div>
            `
                )
                .join('') || ''
            }
          </div>
          
          <div class="totals">
            <div class="total-row">
              <span>Subtotal:</span>
              <span>${formatCurrencyWithConfig((lastPaymentDetails?.amount || 0) / 1.08, systemConfig)}</span>
            </div>
            <div class="total-row">
              <span>Tax (8%):</span>
              <span>${formatCurrencyWithConfig((lastPaymentDetails?.amount || 0) - (lastPaymentDetails?.amount || 0) / 1.08, systemConfig)}</span>
            </div>
            <div class="total-row" style="font-weight: bold; font-size: 16px;">
              <span>Total:</span>
              <span>${formatCurrencyWithConfig(lastPaymentDetails?.amount || 0, systemConfig)}</span>
            </div>
          </div>
          
          <div class="payment-info">
            <div class="total-row">
              <span>Payment Method:</span>
              <span>${lastPaymentDetails?.paymentMethod?.toUpperCase() || 'N/A'}</span>
            </div>
            ${
              lastPaymentDetails?.tinNumber
                ? `
              <div class="total-row">
                <span>TIN Number:</span>
                <span>${lastPaymentDetails.tinNumber}</span>
              </div>
            `
                : ''
            }
            <div class="total-row">
              <span>Processed By:</span>
              <span>${lastPaymentDetails?.processedBy?.name || 'N/A'}</span>
            </div>
            <div class="total-row">
              <span>Date:</span>
              <span>${new Date(lastPaymentDetails?.timestamp || Date.now()).toLocaleString()}</span>
            </div>
          </div>
          
          <div class="footer">
            Thank you for your purchase!<br>
            Please keep this receipt for your records.
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
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Cart & Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Cart Items</h3>
              <ScrollArea className="h-[300px]">
                <div className="space-y-2">
                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 bg-accent/20 rounded-lg"
                    >
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatCurrencyWithConfig(item.price, systemConfig)} × {item.quantity}
                        </p>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, -1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-6 text-center text-sm">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onUpdateQuantity(item.id, 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          className="text-destructive"
                          onClick={() => onRemoveItem(item.id)}
                        >
                          <Trash className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {cart.length === 0 && (
                    <div className="p-4 text-center text-muted-foreground">
                      <ShoppingBag className="mx-auto h-6 w-6 mb-1 opacity-50" />
                      <p className="text-sm">Cart is empty</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </div>

            {/* Customer Display Button */}
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={openCustomerDisplay}
                className="w-full"
                disabled={cart.length === 0}
              >
                <Monitor className="mr-2 h-4 w-4" />
                Show Customer Display
              </Button>
            </div>
            <Separator />
            <div>
              <div
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setIsOrderSummaryCollapsed(!isOrderSummaryCollapsed)}
              >
                <h3 className="font-medium">Order Summary</h3>
                {isOrderSummaryCollapsed ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronUp className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
              <div
                className={`overflow-hidden transition-all duration-300 ease-in-out ${isOrderSummaryCollapsed ? 'max-h-0 opacity-0' : 'max-h-96 opacity-100'}`}
              >
                <div className="space-y-2 text-sm pt-2">
                  <div className="flex justify-between">
                    <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                    <span>{formatCurrencyWithConfig(calculateTotal(), systemConfig)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax</span>
                    <span>{formatCurrencyWithConfig(calculateTotal() * 0.08, systemConfig)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between font-bold text-base">
                    <span>Total</span>
                    <span>{formatCurrencyWithConfig(calculateTotal() * 1.08, systemConfig)}</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button
                className="w-full"
                onClick={() => setIsPaymentDialogOpen(true)}
                disabled={cart.length === 0 || checkoutMutation.isPending}
              >
                {checkoutMutation.isPending ? 'Processing...' : 'Confirm Payment'}
              </Button>
              <Button
                variant="secondary"
                className="w-full"
                onClick={onSaveToPending}
                disabled={cart.length === 0}
              >
                <Clock className="mr-2 h-4 w-4" /> Save for Later
              </Button>
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
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Method</DialogTitle>
            <DialogDescription>
              Select your preferred payment method and complete the transaction.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Payment Method Selection */}
            <div className="space-y-2">
              <h4 className="font-medium">Select Payment Method</h4>
              <div className="grid grid-cols-3 gap-3">
                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                    selectedPaymentMethod === 'cash'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPaymentMethod('cash')}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`p-3 rounded-full ${
                        selectedPaymentMethod === 'cash' ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Banknote className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Cash</p>
                      <p className="text-xs text-muted-foreground">Physical payment</p>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'cash' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                    selectedPaymentMethod === 'card'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPaymentMethod('card')}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`p-3 rounded-full ${
                        selectedPaymentMethod === 'card' ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <CreditCard className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">Card</p>
                      <p className="text-xs text-muted-foreground">Credit/Debit card</p>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'card' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>

                <div
                  className={`relative cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                    selectedPaymentMethod === 'momo'
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => setSelectedPaymentMethod('momo')}
                >
                  <div className="flex flex-col items-center space-y-2">
                    <div
                      className={`p-3 rounded-full ${
                        selectedPaymentMethod === 'momo' ? 'bg-primary/10' : 'bg-muted'
                      }`}
                    >
                      <Smartphone className="h-6 w-6 text-primary" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium">MOMO</p>
                      <p className="text-xs text-muted-foreground">Mobile money</p>
                    </div>
                  </div>
                  {selectedPaymentMethod === 'momo' && (
                    <div className="absolute top-2 right-2">
                      <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* MOMO Payment Button */}
            {selectedPaymentMethod === 'momo' && (
              <div className="space-y-2">
                <Button
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
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  <Smartphone className="mr-2 h-4 w-4" />
                  Open MOMO Payment on Customer Display
                </Button>
              </div>
            )}

            {/* TIN Number Section */}
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="include-tin"
                  checked={needsTIN}
                  onCheckedChange={checked => setNeedsTIN(checked === true)}
                />
                <label
                  htmlFor="include-tin"
                  className="text-sm font-medium leading-none cursor-pointer"
                >
                  Include TIN Number
                </label>
              </div>
              {needsTIN && (
                <Input
                  placeholder="Enter TIN Number"
                  value={tinNumber}
                  onChange={e => setTinNumber(e.target.value)}
                  className="text-sm"
                />
              )}
            </div>

            {/* Order Summary in Dialog */}
            <div className="border rounded-lg p-3 bg-muted/20">
              <h4 className="font-medium mb-2">Order Summary</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Items ({cart.reduce((sum, item) => sum + item.quantity, 0)})</span>
                  <span>{formatCurrencyWithConfig(calculateTotal(), systemConfig)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span>{formatCurrencyWithConfig(calculateTotal() * 0.08, systemConfig)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Total</span>
                  <span>{formatCurrencyWithConfig(calculateTotal() * 1.08, systemConfig)}</span>
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setIsPaymentDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleConfirmPayment}
              disabled={
                !selectedPaymentMethod ||
                (needsTIN && !tinNumber.trim()) ||
                checkoutMutation.isPending
              }
            >
              {checkoutMutation.isPending
                ? 'Processing...'
                : `Pay ${formatCurrencyWithConfig(calculateTotal() * 1.08, systemConfig)}`}
            </Button>
            <Button variant="secondary" onClick={handlePrintInvoice}>
              <Printer className="mr-2 h-4 w-4" />
              Print Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print Confirmation Dialog */}
      <Dialog open={isPrintConfirmDialogOpen} onOpenChange={setIsPrintConfirmDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600" />
              Payment Successful!
            </DialogTitle>
            <DialogDescription>
              Your payment has been processed successfully. Would you like to print the invoice?
            </DialogDescription>
          </DialogHeader>

          {lastPaymentDetails && (
            <div className="border rounded-lg p-3 bg-green-50">
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
