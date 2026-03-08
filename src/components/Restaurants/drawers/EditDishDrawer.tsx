'use client';

import React, { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetFooter,
} from '@/components/ui/sheet';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateRestaurantDish } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { uploadFileToFirebase } from '@/lib/firebaseStorage';
import { UploadTask } from 'firebase/storage';

const dishSchema = z.object({
    price: z.string().min(1, 'Price is required'),
    discount: z.preprocess((val) => Number(val), z.number().min(0).max(100)),
    SKU: z.string().optional(),
    preparingTime: z.string().optional(),
    promo: z.string().optional(),
    promo_type: z.string().optional(),
    quantity: z.preprocess((val) => Number(val), z.number().min(0)),
    is_active: z.boolean().default(true),
    image: z.string().url('Invalid URL').or(z.literal('')).optional(),
});

type DishFormValues = z.infer<typeof dishSchema>;

interface EditDishDrawerProps {
    dish: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditDishDrawer: React.FC<EditDishDrawerProps> = ({
    dish,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const updateRestaurantDish = useUpdateRestaurantDish();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const uploadTaskRef = useRef<UploadTask | null>(null);

    const form = useForm<DishFormValues>({
        resolver: zodResolver(dishSchema),
        defaultValues: {
            price: dish?.price !== undefined && dish?.price !== null ? dish.price.toString() : '',
            discount: typeof dish?.discount === 'number' ? dish.discount : 0,
            SKU: dish?.SKU?.toString() || '',
            preparingTime: dish?.preparingTime?.toString() || '',
            promo: dish?.promo?.toString() || '',
            promo_type: dish?.promo_type?.toString() || '',
            quantity: typeof dish?.quantity === 'number' ? dish.quantity : 0,
            is_active: dish?.is_active ?? true,
            image: dish?.dishes?.image?.toString() || '',
        },
    });

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            if (!file.type.startsWith('image/')) {
                toast.error('Please select a valid image file');
                return;
            }

            const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
            if (file.size > MAX_FILE_SIZE) {
                toast.error(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum limit is 10MB.`);
                return;
            }

            try {
                setIsUploading(true);
                setUploadProgress(0);

                const url = await uploadFileToFirebase(
                    file,
                    (progress) => setUploadProgress(progress),
                    'images',
                    (task) => { uploadTaskRef.current = task; },
                    'company images and logos'
                );

                form.setValue('image', url);
                setIsUploading(false);
                toast.success('Dish image uploaded successfully!');
            } catch (error: any) {
                if (error.code !== 'storage/canceled') {
                    console.error('Upload failed:', error);
                    toast.error('Failed to upload image');
                }
                setIsUploading(false);
                setUploadProgress(0);
            }
        }
    };

    const handleCancelUpload = () => {
        if (uploadTaskRef.current) {
            uploadTaskRef.current.cancel();
            uploadTaskRef.current = null;
            setIsUploading(false);
            setUploadProgress(0);
            toast.info('Upload cancelled');
        }
    };

    const onSubmit = async (values: DishFormValues) => {
        try {
            const { image, promo, discount, quantity, ...restaurantValues } = values;

            // Update restaurant-specific dish details
            await updateRestaurantDish.mutateAsync({
                id: dish.id,
                discount: discount.toString(),
                quantity: quantity.toString(),
                preparingTime: restaurantValues.preparingTime || '',
                price: restaurantValues.price || '0',
                promo: !!promo,
                promo_type: restaurantValues.promo_type || '',
                is_active: restaurantValues.is_active,
                image: image || '',
                dish_id: dish.dish_id,
                product_id: dish.product_id,
                updated_at: new Date().toISOString(),
            });


            toast.success('Dish updated successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating dish:', error);
            toast.error('Failed to update dish');
        }
    };

    const currentImage = form.watch('image');

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Edit Dish: {dish?.dishes?.name}</SheetTitle>
                    <SheetDescription>
                        Update restaurant-specific details and dish image.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-grow px-6">
                    <Form {...form}>
                        <form id="edit-dish-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                            {/* Image Section */}
                            <div className="space-y-3">
                                <FormLabel>Dish Image</FormLabel>
                                <div className="flex flex-col items-center gap-4 p-4 border-2 border-dashed rounded-xl bg-muted/30">
                                    {currentImage ? (
                                        <div className="relative group w-32 h-32 rounded-lg overflow-hidden border shadow-sm">
                                            <img
                                                src={currentImage}
                                                alt="Dish preview"
                                                className="w-full h-full object-cover transition-transform group-hover:scale-110"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => form.setValue('image', '')}
                                                className="absolute top-1 right-1 p-1 bg-destructive/90 text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        </div>
                                    ) : (
                                        <div className="w-32 h-32 rounded-lg bg-muted flex items-center justify-center border shadow-inner">
                                            <ImageIcon className="h-10 w-10 text-muted-foreground/50" />
                                        </div>
                                    )}

                                    <div className="flex flex-col items-center gap-2">
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileUpload}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => fileInputRef.current?.click()}
                                            disabled={isUploading}
                                            className="bg-background hover:bg-muted"
                                        >
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                    Uploading {uploadProgress}%
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className="mr-2 h-4 w-4" />
                                                    {currentImage ? 'Change Image' : 'Upload Image'}
                                                </>
                                            )}
                                        </Button>
                                        {isUploading && (
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="xs"
                                                onClick={handleCancelUpload}
                                                className="text-destructive"
                                            >
                                                Cancel Upload
                                            </Button>
                                        )}
                                        <p className="text-[10px] text-muted-foreground text-center max-w-[200px]">
                                            Recommended: Square image, max 10MB.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="price"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Price</FormLabel>
                                            <FormControl>
                                                <Input placeholder="0.00" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="discount"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Discount (%)</FormLabel>
                                            <FormControl>
                                                <Input type="number" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="SKU"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>SKU</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SKU-123" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="preparingTime"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Prep Time</FormLabel>
                                            <FormControl>
                                                <Input placeholder="20-30 mins" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <FormField
                                    control={form.control}
                                    name="promo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Promo Code</FormLabel>
                                            <FormControl>
                                                <Input placeholder="SUMMER24" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="promo_type"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Promo Type</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Percentage/Fixed" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>

                            <FormField
                                control={form.control}
                                name="quantity"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Available Quantity</FormLabel>
                                        <FormControl>
                                            <Input type="number" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                                <FormField
                                    control={form.control}
                                    name="is_active"
                                    render={({ field }) => (
                                        <FormItem className="flex items-center justify-between">
                                            <div className="space-y-0.5">
                                                <FormLabel>Active Status</FormLabel>
                                                <div className="text-xs text-muted-foreground">
                                                    Whether this dish is visible to customers.
                                                </div>
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
                            </div>
                        </form>
                    </Form>
                </ScrollArea>

                <SheetFooter className="p-6 border-t bg-background">
                    <Button variant="outline" onClick={onClose} disabled={updateRestaurantDish.isPending || isUploading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="edit-dish-form" disabled={updateRestaurantDish.isPending || isUploading}>
                        {updateRestaurantDish.isPending && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        Save Changes
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet>
    );
};

export default EditDishDrawer;
