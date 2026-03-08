'use client';

import React, { useRef, useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Check, ChevronsUpDown, Loader2, ImageIcon, Upload, X } from 'lucide-react';
import { cn } from '@/lib/utils';
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
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';
import { uploadFileToFirebase } from '@/lib/firebaseStorage';
import { UploadTask } from 'firebase/storage';
import { useDishesByName, useCreateDish, useAddDishToMenu, useProducts } from '@/hooks/useHasuraApi';

const PREDEFINED_CATEGORIES = [
    'Main Course',
    'Appetizer',
    'Starter',
    'Dessert',
    'Beverage',
    'Side Dish',
    'Soup',
    'Salad',
    'Breakfast',
    'Snack',
    'Other',
    'Pizza',
    'Burger',
    'Pasta',
    'Sushi',
    'Seafood',
    'Vegan',
    'Vegetarian',
    'Gluten-Free',
    'Combo',
    'Specials',
    'Kids Menu'
];

const addDishSchema = z.object({
    // Mode
    mode: z.enum(['existing', 'new']),

    // Existing base dish
    selectedDishId: z.string().optional(),

    // New base dish
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),

    // Restaurant Menu attributes
    price: z.string().optional(),
    discount: z.preprocess((val) => Number(val), z.number().min(0).max(100).optional()),
    preparingTime: z.string().optional(),
    promo: z.string().optional(),
    promo_type: z.string().optional(),
    quantity: z.preprocess((val) => Number(val), z.number().min(0).optional()),
    is_active: z.boolean().default(true),
    image: z.string().url('Invalid URL').or(z.literal('')).optional(),
    product_id: z.string().optional(),
}).refine(data => {
    if (data.mode === 'existing' && (!data.price || data.price.trim() === '')) return false;
    return true;
}, {
    message: "Price is required to add this dish to your menu",
    path: ["price"],
});

type AddDishFormValues = z.infer<typeof addDishSchema>;

interface AddRestaurantDishDrawerProps {
    restaurantId: string;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const AddRestaurantDishDrawer: React.FC<AddRestaurantDishDrawerProps> = ({
    restaurantId,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const createDishMutation = useCreateDish();
    const addDishToMenuMutation = useAddDishToMenu();

    const [searchTerm, setSearchTerm] = useState('');
    const [openPopover, setOpenPopover] = useState(false);
    const [openCategoryPopover, setOpenCategoryPopover] = useState(false);
    const [openProductPopover, setOpenProductPopover] = useState(false);
    const [createdDishName, setCreatedDishName] = useState('');
    const { data: searchResults, isLoading: isSearching } = useDishesByName(searchTerm);
    const { data: productsData, isLoading: isLoadingProducts } = useProducts();

    const filteredProducts = useMemo(() => {
        if (!searchTerm || !productsData?.Products) return [];
        const term = searchTerm.toLowerCase();
        return productsData.Products.filter((p: any) =>
            p.ProductName?.name?.toLowerCase().includes(term)
        ).slice(0, 5); // Limit to top 5 products matching the search
    }, [searchTerm, productsData]);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const uploadTaskRef = useRef<UploadTask | null>(null);

    const form = useForm<AddDishFormValues>({
        resolver: zodResolver(addDishSchema),
        defaultValues: {
            mode: 'existing',
            selectedDishId: '',
            name: '',
            description: '',
            category: '',
            price: '',
            discount: 0,
            preparingTime: '',
            promo: '',
            promo_type: '',
            quantity: 0,
            is_active: true,
            image: '',
            product_id: '',
        },
    });

    const mode = form.watch('mode');
    const selectedDishId = form.watch('selectedDishId');
    const selectedDishName = searchResults?.dishes?.find(d => d.id === selectedDishId)?.name;

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

    const handleCreateNewDish = async () => {
        if (!searchTerm.trim()) return;

        form.setValue('mode', 'new');
        form.setValue('name', searchTerm);
        form.setValue('selectedDishId', '');
        setOpenPopover(false);
    };

    const onSubmit = async (values: AddDishFormValues) => {
        if (values.mode === 'existing' && !values.selectedDishId) {
            toast.error("Please select a dish");
            return;
        }

        try {
            // 1. If mode is "new", create the base dish first
            if (values.mode === 'new') {
                if (!values.name) {
                    toast.error("Dish name is required");
                    return;
                }
                const result = await createDishMutation.mutateAsync({
                    name: values.name,
                    description: values.description || '',
                    category: values.category || 'General',
                    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?q=80&w=100&h=100&auto=format&fit=crop', // Default image
                });
                if (result?.insert_dishes_one?.id) {
                    form.setValue('selectedDishId', result.insert_dishes_one.id);
                    form.setValue('mode', 'existing');
                    setCreatedDishName(values.name);
                    toast.success('Base dish created! Now set your menu pricing.');
                    return; // Stop and let the user fill in pricing
                } else {
                    throw new Error("Failed to get new dish ID");
                }
            }

            let finalDishId = values.selectedDishId;
            if (!finalDishId) {
                toast.error("Dish ID is missing");
                return;
            }

            // Generate SKU
            const selectedDishCategory = searchResults?.dishes?.find((d: any) => d.id === finalDishId)?.category;
            const categoryStr = selectedDishCategory || form.watch('category');
            const categoryCode = (categoryStr || 'GEN').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 5);
            const randomNum = Math.floor(100 + Math.random() * 900);
            const generatedSKU = `FOOD-${categoryCode}-${randomNum}`;

            // 2. Add dish to restaurant menu
            await addDishToMenuMutation.mutateAsync({
                restaurant_id: restaurantId,
                dish_id: finalDishId,
                price: values.price || '0',
                discount: values.discount?.toString() || '0',
                quantity: values.quantity?.toString() || '0',
                preparingTime: values.preparingTime || '',
                is_active: values.is_active,
                promo: false,
                promo_type: '',
                image: values.image || '', // Leave empty to fallback to base dish image
                product_id: values.product_id || undefined,
                SKU: generatedSKU,
            });

            toast.success('Dish added to menu successfully!');
            if (onSuccess) onSuccess();
            onClose();
            // Reset form for next use
            form.reset();
            setSearchTerm('');
            setCreatedDishName('');
        } catch (error) {
            console.error('Error adding dish to menu:', error);
            toast.error('Failed to add dish to menu');
        }
    };

    const currentImage = form.watch('image');

    return (
        <Sheet open={isOpen} onOpenChange={(open) => {
            if (!open) onClose();
        }}>
            <SheetContent className="sm:max-w-[540px] flex flex-col p-0">
                <SheetHeader className="p-6 pb-2">
                    <SheetTitle>Add Item to Menu</SheetTitle>
                    <SheetDescription>
                        Select an existing item from the system or create a new one, then set pricing and availability for your restaurant.
                    </SheetDescription>
                </SheetHeader>

                <ScrollArea className="flex-grow px-6">
                    <Form {...form}>
                        <form id="add-dish-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">

                            <div className="space-y-4">
                                <FormItem className="flex flex-col">
                                    <FormLabel>Search or Create Item</FormLabel>
                                    <Popover open={openPopover} onOpenChange={setOpenPopover}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openPopover}
                                                className="w-full justify-between"
                                            >
                                                {mode === 'new' ? `New: ${form.watch('name')}` : (selectedDishName || createdDishName || "Search for a base dish...")}
                                                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[490px] p-0" align="start">
                                            <div className="p-2 border-b">
                                                <Input
                                                    placeholder="Type to search dishes..."
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    className="h-9"
                                                />
                                            </div>
                                            <div className="max-h-60 overflow-y-auto">
                                                {isSearching ? (
                                                    <div className="flex items-center justify-center py-4">
                                                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                                                        <span className="text-sm text-muted-foreground">Searching...</span>
                                                    </div>
                                                ) : (
                                                    <div className="py-1">
                                                        {searchResults?.dishes?.map((d: any) => (
                                                            <div
                                                                key={d.id}
                                                                onClick={() => {
                                                                    form.setValue('mode', 'existing');
                                                                    form.setValue('selectedDishId', d.id);
                                                                    setOpenPopover(false);
                                                                }}
                                                                className="flex items-center px-4 py-2 hover:bg-accent hover:text-accent-foreground cursor-pointer"
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        'mr-2 h-4 w-4',
                                                                        selectedDishId === d.id && mode === 'existing' ? 'opacity-100' : 'opacity-0'
                                                                    )}
                                                                />
                                                                <div className="flex items-center gap-3">
                                                                    {d.image && (
                                                                        <img src={d.image} alt={d.name} className="w-8 h-8 rounded object-cover" />
                                                                    )}
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium text-sm">{d.name}</span>
                                                                        <span className="text-xs text-muted-foreground">{d.category || 'General'}</span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {searchTerm.length > 2 && (
                                                            <div
                                                                className="flex items-center px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-t mt-1 text-primary font-medium"
                                                                onClick={handleCreateNewDish}
                                                            >
                                                                <span>Create new item: "{searchTerm}"</span>
                                                            </div>
                                                        )}
                                                        {filteredProducts.map((p: any) => (
                                                            <div
                                                                key={`prod-${p.id}`}
                                                                className="flex items-center px-4 py-3 hover:bg-accent hover:text-accent-foreground cursor-pointer border-t"
                                                                onClick={() => {
                                                                    form.setValue('mode', 'new');
                                                                    form.setValue('name', p.ProductName?.name || '');
                                                                    form.setValue('selectedDishId', '');
                                                                    if (p.category) form.setValue('category', p.category);
                                                                    if (p.price) form.setValue('price', p.price.toString());
                                                                    form.setValue('product_id', p.id);
                                                                    setCreatedDishName(p.ProductName?.name || '');
                                                                    setOpenPopover(false);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-2 text-blue-600 font-medium w-full">
                                                                    <span className="truncate">Create from product: "{p.ProductName?.name}"</span>
                                                                    {p.price && <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">GHS {p.price}</span>}
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage>{form.formState.errors.selectedDishId?.message}</FormMessage>
                                </FormItem>

                                {mode === 'new' && (
                                    <div className="space-y-4 border p-4 rounded-md bg-muted/20 animate-in fade-in zoom-in duration-300">
                                        <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground bg-primary/10 text-primary px-3 py-2 rounded-md">
                                            <span>Creating a new global base dish. A default placeholder image will be assigned.</span>
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Dish Name *</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="e.g. Classic Burger" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="category"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Category</FormLabel>
                                                    <Popover open={openCategoryPopover} onOpenChange={setOpenCategoryPopover}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-[240px] justify-between",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value
                                                                        ? PREDEFINED_CATEGORIES.find(
                                                                            (category) => category === field.value
                                                                        )
                                                                        : "Select category"}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[240px] p-0">
                                                            <Command>
                                                                <CommandInput placeholder="Search category..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No category found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {PREDEFINED_CATEGORIES.map((category) => (
                                                                            <CommandItem
                                                                                key={category}
                                                                                value={category}
                                                                                onSelect={(currentValue) => {
                                                                                    form.setValue("category", category);
                                                                                    setOpenCategoryPopover(false);
                                                                                }}
                                                                            >
                                                                                <Check
                                                                                    className={cn(
                                                                                        "mr-2 h-4 w-4",
                                                                                        category === field.value ? "opacity-100" : "opacity-0"
                                                                                    )}
                                                                                />
                                                                                {category}
                                                                            </CommandItem>
                                                                        ))}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="description"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Description (Optional)</FormLabel>
                                                    <FormControl>
                                                        <Input placeholder="Brief description of the dish" {...field} />
                                                    </FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>
                                )}
                            </div>

                            {mode === 'existing' && (
                                <div className="border-t pt-6 animate-in fade-in zoom-in duration-300">
                                    <h3 className="text-sm font-semibold mb-4 text-primary">Restaurant Menu Pricing & Inventory</h3>

                                    {/* Image Section */}
                                    <div className="space-y-3 mb-6">
                                        <FormLabel>Menu Image (Override)</FormLabel>
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
                                                        size="sm"
                                                        onClick={handleCancelUpload}
                                                        className="text-destructive h-6 text-xs px-2"
                                                    >
                                                        Cancel
                                                    </Button>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4 mb-4">
                                        <FormField
                                            control={form.control}
                                            name="price"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Price *</FormLabel>
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

                                    <div className="grid grid-cols-2 gap-4 mb-4">
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

                                    <div className="bg-muted/30 p-4 rounded-lg space-y-4 mb-4">
                                        <FormField
                                            control={form.control}
                                            name="product_id"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-col">
                                                    <FormLabel>Link Product (Optional)</FormLabel>
                                                    <Popover open={openProductPopover} onOpenChange={setOpenProductPopover}>
                                                        <PopoverTrigger asChild>
                                                            <FormControl>
                                                                <Button
                                                                    variant="outline"
                                                                    role="combobox"
                                                                    className={cn(
                                                                        "w-full justify-between font-normal",
                                                                        !field.value && "text-muted-foreground"
                                                                    )}
                                                                >
                                                                    {field.value && productsData?.Products
                                                                        ? productsData.Products.find((p) => p.id === field.value)?.ProductName?.name || 'Unknown Product'
                                                                        : "Select a product to link..."}
                                                                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                                                </Button>
                                                            </FormControl>
                                                        </PopoverTrigger>
                                                        <PopoverContent className="w-[490px] p-0" align="start">
                                                            <Command>
                                                                <CommandInput placeholder="Search products..." />
                                                                <CommandList>
                                                                    <CommandEmpty>No product found.</CommandEmpty>
                                                                    <CommandGroup>
                                                                        {isLoadingProducts ? (
                                                                            <div className="flex items-center justify-center p-4">
                                                                                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                                                            </div>
                                                                        ) : (
                                                                            productsData?.Products?.map((product: any) => (
                                                                                <CommandItem
                                                                                    key={product.id}
                                                                                    value={product.ProductName?.name || product.id}
                                                                                    onSelect={() => {
                                                                                        form.setValue("product_id", product.id);
                                                                                        setOpenProductPopover(false);
                                                                                    }}
                                                                                >
                                                                                    <Check
                                                                                        className={cn(
                                                                                            "mr-2 h-4 w-4",
                                                                                            product.id === field.value ? "opacity-100" : "opacity-0"
                                                                                        )}
                                                                                    />
                                                                                    {product.ProductName?.name || 'Unnamed Product'} {product.price ? `(GHS ${product.price})` : ''}
                                                                                </CommandItem>
                                                                            ))
                                                                        )}
                                                                    </CommandGroup>
                                                                </CommandList>
                                                            </Command>
                                                        </PopoverContent>
                                                    </Popover>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </div>

                                    <div className="bg-muted/30 p-4 rounded-lg space-y-4">
                                        <FormField
                                            control={form.control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <FormItem className="flex items-center justify-between">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Active Status</FormLabel>
                                                        <div className="text-xs text-muted-foreground">
                                                            Whether this dish is visible to customers immediately.
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
                                </div>
                            )}
                        </form>
                    </Form>
                </ScrollArea>

                <SheetFooter className="p-6 border-t bg-background">
                    <Button variant="outline" onClick={onClose} disabled={addDishToMenuMutation.isPending || createDishMutation.isPending || isUploading}>
                        Cancel
                    </Button>
                    <Button type="submit" form="add-dish-form" disabled={addDishToMenuMutation.isPending || createDishMutation.isPending || isUploading}>
                        {(addDishToMenuMutation.isPending || createDishMutation.isPending) && (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {mode === 'new' ? 'Next: Add Pricing' : 'Add to Menu'}
                    </Button>
                </SheetFooter>
            </SheetContent>
        </Sheet >
    );
};

export default AddRestaurantDishDrawer;
