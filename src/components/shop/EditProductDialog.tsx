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
import { ScanBarcode, ScanQrCode, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';

// Form schema with commission fields
const formSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional().or(z.literal('')),
  price: z.string().min(1, 'Price is required'),
  quantity: z.number().int().min(0, 'Quantity must be a positive number'),
  measurement_unit: z.string().min(1, 'Measurement unit is required'),
  barcode: z.string().optional().or(z.literal('')),
  sku: z.string().optional().or(z.literal('')),
  supplier: z.string().optional().or(z.literal('')),
  reorder_point: z.number().int().min(0).optional(),
  image: z.string().optional().or(z.literal('')),
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
    barcode?: string;
    sku?: string;
    supplier?: string;
    reorder_point?: number;
    image?: string;
  } | null;
  isLoading?: boolean;
}

const EditProductDialog: React.FC<EditProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  product,
  isLoading = false,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanType, setScanType] = useState<'barcode' | 'qrcode' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
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
      barcode: '',
      sku: '',
      supplier: '',
      reorder_point: undefined,
      image: '',
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
        barcode: product.barcode || '',
        sku: product.sku || '',
        supplier: product.supplier || '',
        reorder_point: product.reorder_point || undefined,
        image: product.image || '',
        has_commission: hasCommission,
        commission_percentage: commissionPercentage,
        final_price: product.final_price,
      });

      // Set image preview if product has an image
      if (product.image) {
        setImagePreview(product.image);
      } else {
        setImagePreview(null);
      }
      setImageFile(null);
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
            const commission = commissionPercentage || 0;
            finalPrice = basePrice * (1 + commission / 100);
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

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file.');
        return;
      }

      // Validate file size (2MB limit)
      const maxSize = 2 * 1024 * 1024; // 2MB in bytes
      if (file.size > maxSize) {
        toast.error('Image file size must be less than 2MB.');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setImagePreview(result);
        form.setValue('image', result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    form.setValue('image', '');
    // Clear the file input
    const fileInput = document.getElementById('edit-product-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  function handleSubmit(values: FormData) {
    try {
      // Destructure to remove has_commission and commission_percentage
      const { has_commission, commission_percentage, ...productData } = values;

      // Clean the data - convert empty strings to undefined for optional fields
      const cleanedData = {
        ...productData,
        quantity: Math.max(0, Number(values.quantity) || 0),
        description: productData.description?.trim() || undefined,
        barcode: productData.barcode?.trim() || undefined,
        sku: productData.sku?.trim() || undefined,
        supplier: productData.supplier?.trim() || undefined,
        reorder_point: typeof productData.reorder_point === 'number' ? productData.reorder_point : undefined,
        image: productData.image?.trim() || undefined,
      };

      // Remove undefined values to prevent GraphQL errors
      Object.keys(cleanedData).forEach(key => {
        if (cleanedData[key as keyof typeof cleanedData] === undefined) {
          delete cleanedData[key as keyof typeof cleanedData];
        }
      });

      onSubmit(cleanedData);
    } catch (error) {
      console.error('Error in handleSubmit:', error);
      toast.error('Form validation error. Please check your inputs.');
    }
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
          <form 
            onSubmit={form.handleSubmit(handleSubmit, (errors) => {
              console.error('Form validation errors:', errors);
              toast.error('Please fix the form errors before submitting.');
            })} 
            className="space-y-4"
          >
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
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Product Image */}
            <div className="space-y-4">
              <FormField
                control={form.control}
                name="image"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Image</FormLabel>
                    <div className="flex items-start gap-4">
                      <div className="relative">
                        <div className="h-24 w-24 rounded-md border border-border flex items-center justify-center overflow-hidden bg-muted">
                          {imagePreview ? (
                            <img src={imagePreview} alt="Product preview" className="h-full w-full object-contain" />
                          ) : (
                            <ImageIcon className="h-10 w-10 text-muted-foreground" />
                          )}
                        </div>
                        {imagePreview && (
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            onClick={handleRemoveImage}
                            className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                            title="Remove image"
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                          <Input 
                            id="edit-product-image" 
                            type="file" 
                            accept="image/*" 
                            onChange={handleImageChange}
                            className="flex-1"
                          />
                          {imagePreview && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={handleRemoveImage}
                            >
                              Remove
                            </Button>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          <p>• Recommended size: 512x512px</p>
                          <p>• Supported formats: JPG, PNG, GIF, WebP</p>
                          <p>• Maximum file size: 2MB</p>
                          {imageFile && (
                            <p className="text-green-600 font-medium">
                              ✓ {imageFile.name} ({(imageFile.size / 1024 / 1024).toFixed(2)}MB)
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
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
                    <FormLabel>Base Price ({currency})*</FormLabel>
                    <FormControl>
                      <Input type="number" step="0.01" placeholder="0.00" {...field} />
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
                      <Input type="number" step="0.01" placeholder="0.00" {...field} readOnly />
                    </FormControl>
                    <FormDescription>Calculated automatically based on commission</FormDescription>
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
                          <Input 
                            placeholder="Enter barcode" 
                            {...field} 
                            value={field.value || ''} 
                          />
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
                      <Input 
                        placeholder="Enter SKU" 
                        {...field} 
                        value={field.value || ''} 
                      />
                    </FormControl>
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="has_commission"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Apply Commission</FormLabel>
                      <FormDescription>Enable to add commission to the base price</FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
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
                      <FormDescription>Default: {defaultCommission}%</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  'Update Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default EditProductDialog;
