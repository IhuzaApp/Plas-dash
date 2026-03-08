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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useUpdateRestaurant } from '@/hooks/useHasuraApi';
import { toast } from 'sonner';
import { Loader2, Upload, X, ImageIcon } from 'lucide-react';
import { uploadFileToFirebase } from '@/lib/firebaseStorage';
import { UploadTask } from 'firebase/storage';

const restaurantSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().min(10, 'Phone must be at least 10 digits'),
    location: z.string().min(2, 'Location is required'),
    lat: z.string().optional(),
    long: z.string().optional(),
    logo: z.string().url('Invalid URL').or(z.literal('')).optional(),
    profile: z.string().optional(),
    relatedTo: z.string().optional(),
    tin: z.string().optional(),
    ussd: z.string().optional(),
    is_active: z.boolean().default(false),
    verified: z.boolean().default(false),
});

type RestaurantFormValues = z.infer<typeof restaurantSchema>;

interface EditRestaurantDrawerProps {
    restaurant: any;
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

const EditRestaurantDrawer: React.FC<EditRestaurantDrawerProps> = ({
    restaurant,
    isOpen,
    onClose,
    onSuccess,
}) => {
    const updateRestaurant = useUpdateRestaurant();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [isUploading, setIsUploading] = useState(false);
    const uploadTaskRef = useRef<UploadTask | null>(null);

    const form = useForm<RestaurantFormValues>({
        resolver: zodResolver(restaurantSchema),
        defaultValues: {
            name: restaurant?.name?.toString() || '',
            email: restaurant?.email?.toString() || '',
            phone: restaurant?.phone?.toString() || '',
            location: restaurant?.location?.toString() || '',
            lat: restaurant?.lat?.toString() || '',
            long: restaurant?.long?.toString() || '',
            logo: restaurant?.logo?.toString() || '',
            profile: restaurant?.profile?.toString() || '',
            relatedTo: restaurant?.relatedTo?.toString() || '',
            tin: restaurant?.tin?.toString() || '',
            ussd: restaurant?.ussd?.toString() || '',
            is_active: !!restaurant?.is_active,
            verified: !!restaurant?.verified,
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

                form.setValue('logo', url, { shouldDirty: true });
                setIsUploading(false);
                toast.success('Logo uploaded successfully!');
            } catch (error: any) {
                if (error.code !== 'storage/canceled') {
                    console.error('Upload failed:', error);
                    toast.error('Failed to upload logo');
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

    const onSubmit = async (values: RestaurantFormValues) => {
        try {
            const dirtyFields = form.formState.dirtyFields;
            const updatedValues = Object.keys(dirtyFields).reduce((acc, key) => {
                const k = key as keyof RestaurantFormValues;
                if (dirtyFields[k]) {
                    acc[k] = values[k] as any;
                }
                return acc;
            }, {} as Partial<RestaurantFormValues>);

            // Capture logo change if it got bypassed by RHF
            if (values.logo !== (restaurant?.logo?.toString() || '')) {
                updatedValues.logo = values.logo;
            }

            if (Object.keys(updatedValues).length === 0) {
                toast.info('No changes detected');
                onClose();
                return;
            }

            await updateRestaurant.mutateAsync({
                id: restaurant.id,
                ...updatedValues,
            });
            toast.success('Restaurant updated successfully');
            if (onSuccess) onSuccess();
            onClose();
        } catch (error) {
            console.error('Error updating restaurant:', error);
            toast.error('Failed to update restaurant');
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="sm:max-w-xl">
                <SheetHeader className="mb-6">
                    <SheetTitle>Edit Restaurant Details</SheetTitle>
                    <SheetDescription>
                        Update restaurant information, contact details, and status.
                    </SheetDescription>
                </SheetHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col h-[calc(100vh-120px)]">
                        <ScrollArea className="flex-1 pr-4">
                            <div className="space-y-6 pb-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="name"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Restaurant Name</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter restaurant name" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="email"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email Address</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="email@example.com" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="+250..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="location"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Location</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="City, Street" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="lat"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Latitude</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="-1.9..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="long"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Longitude</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="30.0..." {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="tin"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>TIN Number</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Enter TIN" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="ussd"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>USSD Code</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="*123#" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <FormField
                                    control={form.control}
                                    name="logo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Restaurant Logo</FormLabel>
                                            <div className="space-y-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative h-20 w-20 border rounded-lg bg-muted/50 overflow-hidden group">
                                                        {field.value ? (
                                                            <img
                                                                src={field.value}
                                                                alt="Logo preview"
                                                                className="h-full w-full object-cover"
                                                            />
                                                        ) : (
                                                            <div className="h-full w-full flex items-center justify-center">
                                                                <ImageIcon className="h-8 w-8 text-muted-foreground" />
                                                            </div>
                                                        )}
                                                        {isUploading && (
                                                            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                                                <Loader2 className="h-6 w-6 animate-spin text-white" />
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="flex-1 space-y-2">
                                                        <div className="flex gap-2">
                                                            <FormControl>
                                                                <Input placeholder="Logo URL" {...field} className="flex-1" />
                                                            </FormControl>
                                                            <Button
                                                                type="button"
                                                                variant="outline"
                                                                onClick={() => fileInputRef.current?.click()}
                                                                disabled={isUploading}
                                                            >
                                                                <Upload className="h-4 w-4 mr-2" />
                                                                Upload
                                                            </Button>
                                                            <input
                                                                ref={fileInputRef}
                                                                type="file"
                                                                accept="image/*"
                                                                onChange={handleFileUpload}
                                                                className="hidden"
                                                            />
                                                        </div>
                                                        {isUploading && (
                                                            <div className="space-y-1">
                                                                <div className="flex items-center justify-between text-xs">
                                                                    <span>Uploading... {Math.round(uploadProgress)}%</span>
                                                                    <button
                                                                        type="button"
                                                                        onClick={handleCancelUpload}
                                                                        className="text-destructive hover:underline"
                                                                    >
                                                                        Cancel
                                                                    </button>
                                                                </div>
                                                                <div className="w-full bg-muted rounded-full h-1.5">
                                                                    <div
                                                                        className="bg-primary h-1.5 rounded-full transition-all duration-300"
                                                                        style={{ width: `${uploadProgress}%` }}
                                                                    />
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="relatedTo"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Related To</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Organization / Brand" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="profile"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Profile Description</FormLabel>
                                            <FormControl>
                                                <Textarea
                                                    placeholder="Enter restaurant profile description..."
                                                    className="min-h-[100px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <div className="flex flex-col gap-4 border rounded-md p-4 bg-muted/30">
                                    <h4 className="text-sm font-semibold">Status & Verification</h4>
                                    <div className="flex items-center justify-between">
                                        <FormField
                                            control={form.control}
                                            name="is_active"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background w-[48%]">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Active</FormLabel>
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
                                        <FormField
                                            control={form.control}
                                            name="verified"
                                            render={({ field }) => (
                                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 bg-background w-[48%]">
                                                    <div className="space-y-0.5">
                                                        <FormLabel>Verified</FormLabel>
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
                            </div>
                        </ScrollArea>

                        <SheetFooter className="pt-6 border-t mt-auto">
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={updateRestaurant.isPending || isUploading}>
                                {updateRestaurant.isPending ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </Button>
                        </SheetFooter>
                    </form>
                </Form>
            </SheetContent>
        </Sheet>
    );
};

export default EditRestaurantDrawer;
