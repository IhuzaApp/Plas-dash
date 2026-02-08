import React, { useEffect, useRef } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
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
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Loader2, Upload, X } from 'lucide-react';

const IMAGE_PLACEHOLDER = '/placeholder.svg';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  barcode: z.string().optional(),
  sku: z.string().optional(),
  image: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export interface ProductNameRow {
  id: string;
  name: string;
  description?: string | null;
  barcode?: string | null;
  sku?: string | null;
  image?: string | null;
  create_at?: string;
}

interface ProductNameFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: FormData) => Promise<void>;
  initialValues?: ProductNameRow | null;
  isLoading?: boolean;
}

export function ProductNameFormDialog({
  open,
  onOpenChange,
  onSubmit,
  initialValues,
  isLoading = false,
}: ProductNameFormDialogProps) {
  const isEdit = !!initialValues;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      barcode: '',
      sku: '',
      image: '',
    },
  });

  useEffect(() => {
    if (open) {
      if (initialValues) {
        form.reset({
          name: initialValues.name ?? '',
          description: initialValues.description ?? '',
          barcode: initialValues.barcode ?? '',
          sku: initialValues.sku ?? '',
          image: initialValues.image ?? '',
        });
      } else {
        form.reset({
          name: '',
          description: '',
          barcode: '',
          sku: '',
          image: '',
        });
      }
    }
  }, [open, initialValues, form]);

  const handleSubmit = form.handleSubmit(async (data) => {
    await onSubmit({
      ...data,
      image: data.image && data.image.trim() !== '' ? data.image : undefined,
    });
    onOpenChange(false);
  });

  const imageValue = form.watch('image');
  const imagePreviewSrc =
    imageValue && imageValue.trim() !== ''
      ? imageValue
      : IMAGE_PLACEHOLDER;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      form.setValue('image', result);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleRemoveImage = () => {
    form.setValue('image', '');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Edit product name' : 'Add product name'}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name *</FormLabel>
                  <FormControl>
                    <Input placeholder="Product name" {...field} disabled={isLoading} />
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
                    <Textarea placeholder="Optional description" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <FormControl>
                    <Input placeholder="Barcode" {...field} disabled={isLoading} />
                  </FormControl>
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
                    <Input placeholder="SKU" {...field} disabled={isLoading} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Image</FormLabel>
                  <div className="space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="relative shrink-0">
                        <img
                          src={imagePreviewSrc}
                          alt="Product"
                          className="h-24 w-24 rounded-md border bg-muted object-cover"
                          onError={e => {
                            (e.target as HTMLImageElement).src = IMAGE_PLACEHOLDER;
                          }}
                        />
                        {(field.value ?? '').trim() !== '' && (
                          <Button
                            type="button"
                            variant="secondary"
                            size="icon"
                            className="absolute -right-2 -top-2 h-6 w-6 rounded-full"
                            onClick={handleRemoveImage}
                            disabled={isLoading}
                          >
                            <X className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                      <div className="flex flex-col gap-2 flex-1 min-w-0">
                        <div className="flex gap-2">
                          <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleImageFileChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="flex items-center gap-1.5 shrink-0"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isLoading}
                          >
                            <Upload className="h-4 w-4" /> Upload
                          </Button>
                        </div>
                        <FormControl>
                          <Input
                            placeholder="Or paste image URL (https://...)"
                            {...field}
                            disabled={isLoading}
                          />
                        </FormControl>
                      </div>
                    </div>
                  </div>
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
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {isEdit ? 'Save' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
