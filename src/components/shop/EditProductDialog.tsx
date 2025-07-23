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
import { toast } from 'sonner';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { Switch } from '@/components/ui/switch';

// Form schema with commission fields
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.string().min(1, 'Price is required'),
  quantity: z.number().int().min(0, 'Quantity must be a positive number'),
  measurement_unit: z.string().min(1, 'Measurement unit is required'),
  // UI-only fields (not sent to database)
  has_commission: z.boolean().default(true),
  commission_percentage: z.number().min(0).max(100).optional(),
  final_price: z.string().min(1, 'Final price is required'),
});

type FormData = z.infer<typeof formSchema>;

// Define the type for the data that will be sent to the API
type ProductSubmitData = Omit<FormData, 'has_commission' | 'commission_percentage'>;

interface EditProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductSubmitData) => void;
  product: {
    id: string;
    name: string;
    description?: string;
    price: string;
    quantity: number;
    measurement_unit: string;
    final_price: string;
  } | null;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  product,
}) => {
  const { data: systemConfig } = useSystemConfig();
  const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
  const defaultCommission =
    systemConfig?.System_configuratioins[0]?.productCommissionPercentage || 0;

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      price: '',
      quantity: 0,
      measurement_unit: 'item',
      has_commission: true,
      commission_percentage: Number(defaultCommission) || 0,
      final_price: '',
    },
  });

  // Update form when product changes
  useEffect(() => {
    if (product) {
      const basePrice = parseFloat(product.price);
      const finalPrice = parseFloat(product.final_price);
      const hasCommission = basePrice !== finalPrice;
      const commissionPercentage = hasCommission 
        ? ((finalPrice - basePrice) / basePrice) * 100 
        : Number(defaultCommission) || 0;

      form.reset({
        name: product.name,
        description: product.description || '',
        price: product.price,
        quantity: product.quantity,
        measurement_unit: product.measurement_unit,
        has_commission: hasCommission,
        commission_percentage: commissionPercentage,
        final_price: product.final_price,
      });
    }
  }, [product, form, defaultCommission]);

  const price = form.watch('price');
  const hasCommission = form.watch('has_commission');
  const commissionPercentage = form.watch('commission_percentage');

  // Calculate final price when price, has_commission, or commission_percentage changes
  useEffect(() => {
    const calculateFinalPrice = () => {
      if (price) {
        const basePrice = parseFloat(price);
        if (!isNaN(basePrice)) {
          let finalPrice;
          if (hasCommission) {
            // When commission is enabled, calculate with commission rate
            finalPrice = basePrice * (1 + commissionPercentage / 100);
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
  }, [price, hasCommission, commissionPercentage, form]);

  // Update commission percentage when has_commission changes
  useEffect(() => {
    if (hasCommission) {
      form.setValue('commission_percentage', Number(defaultCommission) || 0);
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
    const { has_commission, commission_percentage, ...productData } = values;

    const formattedValues = {
      ...productData,
      quantity: Math.max(0, Number(values.quantity) || 0),
    };
    onSubmit(formattedValues);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
          <DialogDescription>
            Update the product details. The final price will be calculated automatically.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Base Price ({currency})*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="final_price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Final Price ({currency})*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="0.00"
                        {...field}
                        readOnly
                      />
                    </FormControl>
                    <FormDescription>
                      Calculated automatically based on commission
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Stock Quantity*</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={e => field.onChange(parseInt(e.target.value) || 0)}
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
                    <FormLabel>Unit*</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select unit" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="item">Item</SelectItem>
                        <SelectItem value="kg">Kilogram</SelectItem>
                        <SelectItem value="g">Gram</SelectItem>
                        <SelectItem value="l">Liter</SelectItem>
                        <SelectItem value="ml">Milliliter</SelectItem>
                        <SelectItem value="pack">Pack</SelectItem>
                        <SelectItem value="box">Box</SelectItem>
                        <SelectItem value="bottle">Bottle</SelectItem>
                        <SelectItem value="can">Can</SelectItem>
                        <SelectItem value="piece">Piece</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
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
                        Enable to add commission to the base price
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
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
                      <FormLabel>Commission Percentage (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0"
                          {...field}
                          onChange={e => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormDescription>
                        Default: {defaultCommission}%
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit">Update Product</Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog; 