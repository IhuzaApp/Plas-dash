import React, { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScanBarcode, ScanQrCode } from 'lucide-react';
import { toast } from 'sonner';
import { useShops, useSystemConfig } from '@/hooks/useHasuraApi';
import { Switch } from '@/components/ui/switch';

// Match the API types exactly
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  quantity: z.number().int().min(0, 'Quantity must be a positive number'),
  measurement_unit: z.string().min(1, 'Measurement unit is required'),
  category: z.string().min(1, 'Category is required'),
  is_active: z.boolean().default(true),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  supplier: z.string().optional(),
  reorder_point: z.number().int().min(0).optional(),
  shop_id: z.string().optional(),
  // UI-only fields (not sent to database)
  has_commission: z.boolean().default(true),
  commission_percentage: z.number().min(0).max(100).optional(),
  final_price: z.string().min(1, 'Final price is required'),
});

type FormData = z.infer<typeof formSchema>;

// Define the type for the data that will be sent to the API
type ProductSubmitData = Omit<FormData, 'has_commission' | 'commission_percentage'>;

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductSubmitData) => void;
  shopId?: string;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  shopId,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanType, setScanType] = useState<'barcode' | 'qrcode' | null>(null);
  const { data: shopsData } = useShops();
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
  const defaultCommission = systemConfig?.System_configuratioins[0]?.productCommissionPercentage || 0;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      quantity: 0,
      measurement_unit: 'item',
      category: '',
      is_active: true,
      barcode: undefined,
      sku: undefined,
      supplier: undefined,
      reorder_point: undefined,
      shop_id: shopId,
      has_commission: true,
      commission_percentage: defaultCommission,
      final_price: '',
    },
  });

  // Watch price and commission-related fields to calculate final price
  const price = form.watch('price');
  const hasCommission = form.watch('has_commission');
  const commissionPercentage = defaultCommission; // Always use default commission

  // Calculate final price whenever price or commission changes
  useEffect(() => {
    const calculateFinalPrice = () => {
      if (price) {
        const basePrice = parseFloat(price);
        if (!isNaN(basePrice)) {
          let finalPrice;
          if (hasCommission) {
            // When commission is enabled, calculate with default commission rate
            finalPrice = basePrice * (1 + (defaultCommission / 100));
          } else {
            // When commission is disabled, final price is exactly the same as base price
            finalPrice = basePrice;
          }
          form.setValue('final_price', finalPrice.toFixed(2));
        }
      } else {
        // If no base price, set final price to empty
        form.setValue('final_price', '');
      }
    };

    calculateFinalPrice();
  }, [price, hasCommission, defaultCommission, form]);

  // Update commission percentage when has_commission changes
  useEffect(() => {
    if (hasCommission) {
      form.setValue('commission_percentage', defaultCommission);
    } else {
      form.setValue('commission_percentage', 0);
      // When turning off commission, set final price to match base price exactly
      if (price) {
        form.setValue('final_price', price);
      }
    }
  }, [hasCommission, defaultCommission, form, price]);

  function handleSubmit(values: FormData) {
    // Destructure to remove has_commission and commission_percentage
    const {
      has_commission,
      commission_percentage,
      ...productData
    } = values;

    const formattedValues = {
      ...productData,
      quantity: Math.max(0, Number(values.quantity) || 0),
      reorder_point: typeof values.reorder_point === 'number' ? values.reorder_point : undefined,
      shop_id: shopId || values.shop_id,
    };
    onSubmit(formattedValues);
  }

  const startScanning = (type: 'barcode' | 'qrcode') => {
    setScanType(type);
    setIsScanning(true);

    setTimeout(() => {
      const mockData =
        type === 'barcode' ? '5901234123457' : 'https://product-info.example.com/12345';

      if (type === 'barcode') {
        form.setValue('barcode', mockData);
        toast.success('Barcode scanned successfully!');
      } else {
        form.setValue('barcode', mockData);
        toast.success('QR code scanned successfully!');
      }

      setIsScanning(false);
    }, 1500);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Product</DialogTitle>
          <DialogDescription>
            Enter the details of the new inventory item. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            {!shopId && (
              <FormField
                control={form.control}
                name="shop_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shop*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a shop" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {shopsData?.Shops.map(shop => (
                          <SelectItem key={shop.id} value={shop.id}>
                            {shop.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name*</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter product name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="dairy">Dairy</SelectItem>
                        <SelectItem value="produce">Produce</SelectItem>
                        <SelectItem value="bakery">Bakery</SelectItem>
                        <SelectItem value="meat">Meat</SelectItem>
                        <SelectItem value="grocery">Grocery</SelectItem>
                        <SelectItem value="frozen">Frozen</SelectItem>
                        <SelectItem value="beverages">Beverages</SelectItem>
                        <SelectItem value="snacks">Snacks</SelectItem>
                        <SelectItem value="household">Household</SelectItem>
                        <SelectItem value="health">Health & Beauty</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="barcode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Barcode</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <div className="relative flex-1">
                          <Input placeholder="Enter barcode" {...field} value={field.value || ''} />
                        </div>
                      </FormControl>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => startScanning('barcode')}
                        disabled={isScanning}
                      >
                        <ScanBarcode className="h-4 w-4" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="outline"
                        onClick={() => startScanning('qrcode')}
                        disabled={isScanning}
                      >
                        <ScanQrCode className="h-4 w-4" />
                      </Button>
                    </div>
                    {isScanning && (
                      <div className="mt-2 text-sm text-muted-foreground">
                        Scanning {scanType === 'barcode' ? 'barcode' : 'QR code'}...
                      </div>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter SKU" {...field} value={field.value || ''} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price*</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-2.5">{currency}</span>
                        <Input placeholder="0" className="pl-12" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {hasCommission && (
                <FormField
                  control={form.control}
                  name="final_price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Final Price</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-2.5">{currency}</span>
                          <Input placeholder="0" className="pl-12" {...field} disabled />
                        </div>
                      </FormControl>
                      <FormDescription>
                        Final price after applying commission
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="has_commission"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Apply Commission</FormLabel>
                      <FormDescription>
                        Enable to apply commission percentage to this product
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={(checked) => {
                          field.onChange(checked);
                          // Reset final price to base price when commission is turned off
                          if (!checked) {
                            form.setValue('final_price', form.getValues('price'));
                            form.setValue('commission_percentage', defaultCommission);
                          }
                        }}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              {hasCommission && (
                <FormField
                  control={form.control}
                  name="commission_percentage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Commission Percentage</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          disabled
                          className="bg-muted"
                          {...field}
                          value={defaultCommission}
                        />
                      </FormControl>
                      <FormDescription>
                        Default system commission rate
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        value={value}
                        onChange={e => {
                          const val =
                            e.target.value === ''
                              ? 0
                              : Math.max(0, parseInt(e.target.value, 10) || 0);
                          onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="measurement_unit"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Measurement Unit*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="item">Item</SelectItem>
                        <SelectItem value="kg">Kilogram (kg)</SelectItem>
                        <SelectItem value="g">Gram (g)</SelectItem>
                        <SelectItem value="l">Liter (L)</SelectItem>
                        <SelectItem value="ml">Milliliter (mL)</SelectItem>
                        <SelectItem value="lb">Pound (lb)</SelectItem>
                        <SelectItem value="oz">Ounce (oz)</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="reorder_point"
                render={({ field: { onChange, value, ...field } }) => (
                  <FormItem>
                    <FormLabel>Reorder Point</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        placeholder="0"
                        {...field}
                        value={value ?? ''}
                        onChange={e => {
                          const val =
                            e.target.value === ''
                              ? undefined
                              : Math.max(0, parseInt(e.target.value, 10));
                          onChange(val);
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

              <FormField
                control={form.control}
                name="supplier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Supplier</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter supplier name"
                        {...field}
                        value={field.value || ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Enter product description"
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Save Product</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
