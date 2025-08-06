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
import { ScanBarcode, ScanQrCode, Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useShops, useSystemConfig } from '@/hooks/useHasuraApi';
import { Switch } from '@/components/ui/switch';
import ProductNameAutocomplete from './ProductNameAutocomplete';

// Match the API types exactly
const formSchema = z.object({
  name: z.string().optional(), // Make name optional since we might use productName_id
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
  image: z.string().optional(),
  // UI-only fields (not sent to database)
  has_commission: z.boolean().default(true),
  commission_percentage: z.number().min(0).max(100).optional(),
  final_price: z.string().optional(), // Make final_price optional since it's calculated
  productName_id: z.string().optional(), // Add this for tracking selected product name ID
}).refine((data) => {
  // Ensure either name or productName_id is provided
  return (data.name && data.name.trim() !== '') || data.productName_id;
}, {
  message: "Either product name or existing product must be selected",
  path: ["name"]
});

type FormData = z.infer<typeof formSchema>;

// Define the type for the data that will be sent to the API
type ProductSubmitData = {
  price: string;
  quantity: number;
  measurement_unit: string;
  shop_id: string | undefined;
  category: string;
  reorder_point: number | undefined;
  supplier: string | undefined;
  is_active: boolean;
  final_price: string | undefined;
  productName_id: string | undefined;
  productNameData?: {
    name: string;
    description?: string;
    barcode?: string;
    sku?: string;
    image?: string;
  };
};

interface AddProductDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: ProductSubmitData) => void;
  shopId?: string;
  isLoading?: boolean;
}

const AddProductDialog: React.FC<AddProductDialogProps> = ({
  open,
  onOpenChange,
  onSubmit,
  shopId,
  isLoading = false,
}) => {
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanType, setScanType] = useState<'barcode' | 'qrcode' | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<any>(null);
  const { data: shopsData } = useShops();
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
      category: '',
      is_active: true,
      barcode: undefined,
      sku: undefined,
      supplier: undefined,
      reorder_point: undefined,
      shop_id: shopId,
      image: '',
      has_commission: true,
      commission_percentage: Number(defaultCommission) || 0,
      final_price: '',
    },
  });

  // Watch price and commission-related fields to calculate final price
  const price = form.watch('price');
  const hasCommission = form.watch('has_commission');
  const commissionPercentage = Number(defaultCommission) || 0; // Convert to number

  // Calculate final price whenever price or commission changes
  useEffect(() => {
    const calculateFinalPrice = () => {
      if (price) {
        const basePrice = parseFloat(price);
        if (!isNaN(basePrice)) {
          let finalPrice;
          if (hasCommission) {
            // When commission is enabled, calculate with default commission rate
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

  // Reset image state when dialog opens/closes
  useEffect(() => {
    if (!open) {
      resetForm();
    }
  }, [open]);

  const resetForm = () => {
    setImageFile(null);
    setImagePreview(null);
    setSelectedProductName(null);
    form.reset({
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
      image: '',
      has_commission: true,
      commission_percentage: Number(defaultCommission) || 0,
      final_price: '',
      productName_id: undefined,
    });
    // Clear the file input
    const fileInput = document.getElementById('product-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  function handleSubmit(values: FormData) {
    // Destructure to remove has_commission and commission_percentage
    const { has_commission, commission_percentage, productName_id, name, description, barcode, sku, image, ...productData } = values;

    const formattedValues = {
      // Only include fields that the ADD_PRODUCT mutation accepts
      price: productData.price,
      quantity: Math.max(0, Number(values.quantity) || 0),
      measurement_unit: productData.measurement_unit,
      shop_id: shopId || values.shop_id,
      category: productData.category,
      reorder_point: typeof values.reorder_point === 'number' ? values.reorder_point : undefined,
      supplier: productData.supplier,
      is_active: productData.is_active,
      final_price: productData.final_price,
      // Product name related fields (will be handled by the parent component)
      productName_id: productName_id || undefined,
      productNameData: productName_id ? undefined : {
        name: name || '',
        description: description,
        barcode: barcode,
        sku: sku,
        image: image,
      },
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
    const fileInput = document.getElementById('product-image') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  };

  const handleProductNameSelect = (product: any) => {
    setSelectedProductName(product);
    
    // Auto-fill form fields with selected product details
    if (product) {
      form.setValue('name', product.name);
      form.setValue('description', product.description || '');
      form.setValue('barcode', product.barcode || '');
      form.setValue('sku', product.sku || '');
      form.setValue('image', product.image || '');
      form.setValue('productName_id', product.id);
      
      // Set image preview if product has an image
      if (product.image) {
        setImagePreview(product.image);
      }
    }
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
                            <img
                              src={imagePreview}
                              alt="Product preview"
                              className="h-full w-full object-contain"
                            />
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
                            id="product-image"
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Name*</FormLabel>
                    <FormControl>
                      <ProductNameAutocomplete
                        value={field.value}
                        onValueChange={field.onChange}
                        onProductSelect={handleProductNameSelect}
                        placeholder="Search or add product name..."
                        disabled={isLoading}
                      />
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
                      <FormDescription>Final price after applying commission</FormDescription>
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
                        onCheckedChange={checked => {
                          field.onChange(checked);
                          // Reset final price to base price when commission is turned off
                          if (!checked) {
                            form.setValue('final_price', form.getValues('price'));
                            form.setValue('commission_percentage', Number(defaultCommission) || 0);
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
                          onChange={e => field.onChange(Number(e.target.value))}
                          value={Number(field.value) || 0}
                        />
                      </FormControl>
                      <FormDescription>Default system commission rate</FormDescription>
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
                    <Input placeholder="Enter supplier name" {...field} value={field.value || ''} />
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
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Product'
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddProductDialog;
