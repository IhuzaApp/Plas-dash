import React, { useState, useEffect, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card } from '@/components/ui/card';
import { Search, Filter, Plus, Loader2, RefreshCw, CalendarIcon, X, Tag, ChevronDown, ChevronRight, Store, Utensils, Info } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useCreatePromotion, useUpdatePromotion } from '@/hooks/useHasuraApi';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';

interface Promotion {
  id: string;
  name: string;
  code?: string;
  promotion_type: string;
  discount_type: string;
  discount_value: string;
  buy_quantity?: string;
  get_quantity?: string;
  applies_to_type: string;
  applies_to_id?: string;
  restaurant_id?: string;
  shop_id?: string;
  Restaurant?: {
    name: string;
    is_active: boolean;
    phone: string;
    profile: string;
    tin: string;
    ussd: string;
  };
  Shop?: {
    name: string;
    description: string;
    category_id: string;
    created_at: string;
    logo: string;
    longitude: string;
    latitude: string;
    image: string;
    phone: string;
    relatedTo: string;
    ssd: string;
    tin: string;
  };
  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  min_purchase_amount: string;
  usage_per_customer?: number;
  usage_limit?: number;
  priority: number;
  status: 'active' | 'scheduled' | 'disabled';
  is_stackable: boolean;
  created_at: string;
  update_on: string;
}

const DEFAULT_FORM_VALUES: PromotionFormValues = {
  name: '',
  code: '',
  promotion_type: 'percentage',
  discount_value: '',
  buy_quantity: '',
  get_quantity: '',
  applies_to_type: 'entire_store',
  applies_to_id: '',
  business_type: 'restaurant',
  business_id: '',
  start_date: new Date(),
  end_date: addDays(new Date(), 7),
  start_time: '',
  end_time: '',
  min_purchase_amount: '',
  usage_per_customer: '10',
  usage_limit: '10',
  priority: '10',
  is_stackable: false,
  status: 'active',
};

const generatePromotionCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const promotionFormSchema = z.object({
  name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
  code: z.string().optional(),
  promotion_type: z.enum([
    'percentage',
    'fixed',
    'bogo',
    'rush_hour',
    'flash_sale',
    'bundle'
  ], { required_error: 'Promotion type is required.' }),
  discount_value: z.string().optional(),
  buy_quantity: z.string().optional(),
  get_quantity: z.string().optional(),
  applies_to_type: z.enum(['specific_product', 'category', 'entire_store'], {
    required_error: 'Please select what this applies to.',
  }),
  applies_to_id: z.string().optional(),
  business_type: z.enum(['restaurant', 'shop']).default('restaurant'),
  business_id: z.string().min(1, { message: 'Please select a business.' }),
  start_date: z.date({ required_error: 'Start date is required.' }),
  end_date: z.date({ required_error: 'End date is required.' }),
  start_time: z.string().optional(),
  end_time: z.string().optional(),
  min_purchase_amount: z.string().optional(),
  usage_per_customer: z.string().optional(),
  usage_limit: z.string().optional(),
  priority: z.string().default('10'),
  is_stackable: z.boolean().default(false),
  status: z.enum(['active', 'scheduled', 'disabled']).default('active'),
})
  .refine(data => {
    if (data.promotion_type === 'percentage' && (!data.discount_value || isNaN(Number(data.discount_value)) || Number(data.discount_value) <= 0 || Number(data.discount_value) > 100)) {
      return false;
    }
    if (data.promotion_type === 'fixed' && (!data.discount_value || isNaN(Number(data.discount_value)) || Number(data.discount_value) <= 0)) {
      return false;
    }
    if (data.promotion_type === 'bogo' && (!data.buy_quantity || !data.get_quantity)) {
      return false;
    }
    return true;
  }, {
    message: "Invalid discount details for the selected promotion type",
    path: ["discount_value"],
  });

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

const Promotions = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };
  const queryClient = useQueryClient();
  const { hasAction, session } = usePrivilege();
  const { orgEmployee } = useCurrentOrgEmployee();
  const createPromotionMutation = useCreatePromotion();
  const updatePromotionMutation = useUpdatePromotion();

  const { data, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () =>
      apiGet<{ promotions: Promotion[] }>('/api/queries/promotions').then(r => r.promotions),
  });

  const { data: shopsData } = useQuery({
    queryKey: ['shops'],
    queryFn: () => apiGet<{ shops: any[] }>('/api/queries/shops').then(r => r.shops),
    enabled: !!session?.isProjectUser,
  });

  const { data: restaurantsData } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () => apiGet<{ restaurants: any[] }>('/api/queries/restaurants').then(r => r.restaurants),
    enabled: !!session?.isProjectUser,
  });

  const filteredPromotions = useMemo(() => {
    if (!data || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase().trim();
    return data.filter(promotion => {
      return (
        promotion.name.toLowerCase().includes(query) ||
        promotion.code?.toLowerCase().includes(query) ||
        promotion.status.toLowerCase().includes(query) ||
        promotion.discount?.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const watchPromotionType = useWatch({ control: form.control, name: 'promotion_type' });
  const watchAppliesTo = useWatch({ control: form.control, name: 'applies_to_type' });
  const watchAll = form.watch();

  const onSubmit = async (values: PromotionFormValues) => {
    try {
      const payload: any = {
        name: values.name,
        code: values.code || "",
        promotion_type: values.promotion_type,
        applies_to_type: values.applies_to_type,
        applies_to_id: values.applies_to_id || undefined,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        start_time: values.start_time || undefined,
        end_time: values.end_time || undefined,
        min_purchase_amount: values.min_purchase_amount || "",
        usage_per_customer: values.usage_per_customer ? parseInt(values.usage_per_customer) : 10,
        usage_limit: values.usage_limit ? parseInt(values.usage_limit) : 10,
        priority: parseInt(values.priority) || 10,
        status: values.status,
        discount_type: values.promotion_type,
        discount_value: "",
        buy_quantity: "",
        restaurant_id: values.business_type === 'restaurant' ? values.business_id : null,
        shop_id: values.business_type === 'shop' ? values.business_id : null,
      };

      if (values.promotion_type === 'percentage' || values.promotion_type === 'fixed') {
        payload.discount_value = values.discount_value || "";
      } else if (values.promotion_type === 'bogo') {
        payload.buy_quantity = values.buy_quantity || "";
        payload.discount_value = `Buy ${values.buy_quantity} Get ${values.get_quantity}`;
      } else {
        payload.discount_value = values.discount_value || 'Special Offer';
      }

      if (selectedPromotion) {
        await updatePromotionMutation.mutateAsync({
          id: selectedPromotion.id,
          ...payload
        });
        toast.success('Promotion updated successfully');
      } else {
        await createPromotionMutation.mutateAsync(payload);
        toast.success('Promotion created successfully');
      }

      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      setIsDrawerOpen(false);
      form.reset(DEFAULT_FORM_VALUES);
      setSelectedPromotion(null);
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Failed to save promotion');
    }
  };

  const handleCreate = () => {
    setSelectedPromotion(null);
    const businessId = session?.isProjectUser ? '' : (session?.shop_id || orgEmployee?.restaurant_id || '');
    const businessType = session?.isProjectUser ? 'restaurant' : (session?.shop_id ? 'shop' : 'restaurant');

    form.reset({
      ...DEFAULT_FORM_VALUES,
      business_id: businessId,
      business_type: businessType,
    });
    setIsDrawerOpen(true);
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    form.reset({
      name: promotion.name,
      code: promotion.code || '',
      promotion_type: promotion.promotion_type as any,
      discount_value: promotion.discount_value,
      buy_quantity: promotion.buy_quantity || '',
      get_quantity: promotion.discount_value?.includes('Get ') ? promotion.discount_value.split('Get ')[1] : '',
      applies_to_type: promotion.applies_to_type as any,
      applies_to_id: promotion.applies_to_id || '',
      start_date: new Date(promotion.start_date),
      end_date: new Date(promotion.end_date),
      start_time: promotion.start_time || '',
      end_time: promotion.end_time || '',
      min_purchase_amount: promotion.min_purchase_amount,
      usage_per_customer: promotion.usage_per_customer?.toString() || '10',
      usage_limit: promotion.usage_limit?.toString() || '10',
      priority: promotion.priority.toString(),
      is_stackable: promotion.is_stackable,
      status: promotion.status as any,
      business_type: promotion.restaurant_id ? 'restaurant' : 'shop',
      business_id: (promotion.restaurant_id || promotion.shop_id) || '',
    });
    setIsDrawerOpen(true);
  };

  const handleGenerateCode = () => {
    form.setValue('code', generatePromotionCode());
  };

  return (
    <AdminLayout>
      <PageHeader
        title="Promotions"
        description="Manage discounts, offers and promotional campaigns."
        actions={
          <div className="flex gap-2">
            {hasAction('promotions', 'create_promotions') && (
              <Button className="gap-2" onClick={handleCreate}>
                <Plus className="h-4 w-4" /> Create Promotion
              </Button>
            )}
          </div>
        }
      />

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search promotions by name, code, status, or discount..."
              className="pl-8"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 h-5 w-5 p-0"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <Button variant="outline" className="flex items-center gap-2">
            <Filter className="h-4 w-4" /> Filter
          </Button>
        </div>

        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                {session?.isProjectUser && <TableHead className="w-[40px]"></TableHead>}
                <TableHead>Promotion</TableHead>
                <TableHead>Shop/Restaurant</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Benefit</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Limits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={session?.isProjectUser ? 9 : 8} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPromotions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={session?.isProjectUser ? 9 : 8} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Tag className="h-8 w-8 text-muted-foreground/50" />
                      <p>No promotions found</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions?.map(promotion => (
                  <React.Fragment key={promotion.id}>
                    <TableRow className={cn(
                      "group transition-colors",
                      expandedRows.has(promotion.id) && "bg-muted/50 border-b-0"
                    )}>
                      {session?.isProjectUser && (
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                            onClick={() => toggleRow(promotion.id)}
                          >
                            {expandedRows.has(promotion.id) ? (
                              <ChevronDown className="h-4 w-4" />
                            ) : (
                              <ChevronRight className="h-4 w-4" />
                            )}
                          </Button>
                        </TableCell>
                      )}
                      <TableCell className="font-medium">{promotion.name}</TableCell>
                      <TableCell className="text-xs">
                        <div className="flex items-center gap-2">
                          {promotion.Restaurant ? (
                            <Utensils className="h-3 w-3 text-orange-500" />
                          ) : promotion.Shop ? (
                            <Store className="h-3 w-3 text-blue-500" />
                          ) : null}
                          {promotion.Restaurant?.name || promotion.Shop?.name || 'Multi-store'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                          {promotion.code || '-'}
                        </span>
                      </TableCell>
                      <TableCell>
                        {promotion.promotion_type === 'percentage' ? `${promotion.discount_value}%` :
                          promotion.promotion_type === 'fixed' ? `Ksh ${promotion.discount_value}` :
                            promotion.promotion_type === 'bogo' ? 'BOGO' :
                              promotion.discount_value || 'Special'}
                      </TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(promotion.start_date), "MMM d")} - {format(new Date(promotion.end_date), "MMM d")}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        Limit: {promotion.usage_limit || '∞'}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                            promotion.status === 'active' ? 'bg-green-100 text-green-800' :
                              promotion.status === 'scheduled' ? 'bg-blue-100 text-blue-800' :
                                'bg-gray-100 text-gray-800'
                          )}
                        >
                          {promotion.status}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(promotion)}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    </TableRow>

                    {/* Expanded Content */}
                    {expandedRows.has(promotion.id) && (
                      <TableRow className="bg-muted/30 border-t-0 hover:bg-muted/30">
                        <TableCell colSpan={9} className="p-0">
                          <div className="px-12 py-6 border-l-2 border-primary/20 ml-6 mb-4 animate-in fade-in slide-in-from-top-2 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                              {/* Business Details */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                  {promotion.Restaurant ? <Utensils className="h-4 w-4" /> : <Store className="h-4 w-4" />}
                                  {promotion.Restaurant ? 'Restaurant Details' : 'Shop Details'}
                                </div>
                                <div className="space-y-3 bg-background rounded-lg p-4 border shadow-sm">
                                  {promotion.Shop?.logo && (
                                    <img src={promotion.Shop.logo} alt="Logo" className="h-12 w-12 rounded-lg object-cover mb-2 border" />
                                  )}
                                  <div className="space-y-1">
                                    <p className="text-sm font-medium">{promotion.Restaurant?.name || promotion.Shop?.name}</p>
                                    <p className="text-xs text-muted-foreground">{promotion.Shop?.description || 'No description available'}</p>
                                  </div>
                                  <div className="pt-2 space-y-2 border-t text-xs">
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Phone:</span>
                                      <span>{promotion.Restaurant?.phone || promotion.Shop?.phone || 'N/A'}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">TIN:</span>
                                      <span>{promotion.Restaurant?.tin || promotion.Shop?.tin || 'N/A'}</span>
                                    </div>
                                    {promotion.Shop?.ssd && (
                                      <div className="flex justify-between">
                                        <span className="text-muted-foreground">SSD:</span>
                                        <span>{promotion.Shop.ssd}</span>
                                      </div>
                                    )}
                                    <div className="flex justify-between">
                                      <span className="text-muted-foreground">Status:</span>
                                      <span className={cn(
                                        "capitalize",
                                        (promotion.Restaurant?.is_active ?? true) ? "text-green-600" : "text-red-600"
                                      )}>
                                        {(promotion.Restaurant?.is_active ?? true) ? 'Active' : 'Inactive'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Promotion Configuration */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                  <Info className="h-4 w-4" />
                                  Promotion Config
                                </div>
                                <div className="space-y-3 bg-background rounded-lg p-4 border shadow-sm text-xs">
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Type:</span>
                                    <span className="capitalize">{promotion.promotion_type.replace('_', ' ')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Applies To:</span>
                                    <span className="capitalize">{promotion.applies_to_type.replace('_', ' ')}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Min. Purchase:</span>
                                    <span>Ksh {promotion.min_purchase_amount || '0'}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Priority:</span>
                                    <span>{promotion.priority}</span>
                                  </div>
                                  <div className="flex justify-between">
                                    <span className="text-muted-foreground">Stackable:</span>
                                    <span>{promotion.is_stackable ? 'Yes' : 'No'}</span>
                                  </div>
                                  <div className="flex justify-between pt-2 border-t">
                                    <span className="text-muted-foreground">Created:</span>
                                    <span>{format(new Date(promotion.created_at), "MMM d, yyyy HH:mm")}</span>
                                  </div>
                                </div>
                              </div>

                              {/* Usage Statistics (Placeholder) */}
                              <div className="space-y-4">
                                <div className="flex items-center gap-2 text-sm font-semibold text-primary">
                                  <RefreshCw className="h-4 w-4" />
                                  Usage Limits
                                </div>
                                <div className="space-y-4 bg-background rounded-lg p-4 border shadow-sm">
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                      <span className="text-xs text-muted-foreground font-medium">Customer Usage Limit</span>
                                      <span className="text-sm font-bold">{promotion.usage_per_customer || '10'}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-primary h-full" style={{ width: '40%' }}></div>
                                    </div>
                                  </div>
                                  <div className="space-y-2">
                                    <div className="flex justify-between items-end">
                                      <span className="text-xs text-muted-foreground font-medium">Total Promotion Limit</span>
                                      <span className="text-sm font-bold">{promotion.usage_limit || '10'}</span>
                                    </div>
                                    <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                                      <div className="bg-orange-500 h-full" style={{ width: '15%' }}></div>
                                    </div>
                                  </div>
                                  <p className="text-[10px] text-muted-foreground italic">
                                    * Real-time usage tracking is currently being processed.
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[100vw] sm:max-w-xl flex flex-col p-0 h-full">
          <SheetHeader className="p-6 pb-2 border-b">
            <SheetTitle>
              {selectedPromotion ? 'Edit Promotion' : 'Create Promotion'}
            </SheetTitle>
            <SheetDescription>
              Set up a new discount or special offer.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form id="promo-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">

                {/* 0. Business Assignment (Visible only for Project Users/Admins) */}
                {session?.isProjectUser && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-semibold text-primary">0. Business Assignment</h3>
                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
                      <FormField
                        control={form.control}
                        name="business_type"
                        render={({ field }) => (
                          <FormItem className="space-y-3">
                            <FormLabel>Business Type</FormLabel>
                            <FormControl>
                              <RadioGroup
                                onValueChange={field.onChange}
                                defaultValue={field.value}
                                className="flex gap-4"
                              >
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="restaurant" id="restaurant" />
                                  <Label htmlFor="restaurant">Restaurant</Label>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <RadioGroupItem value="shop" id="shop" />
                                  <Label htmlFor="shop">Shop</Label>
                                </div>
                              </RadioGroup>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="business_id"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Select {watchAll.business_type === 'restaurant' ? 'Restaurant' : 'Shop'}</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${watchAll.business_type}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchAll.business_type === 'restaurant' ? (
                                  restaurantsData?.map(r => (
                                    <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                  ))
                                ) : (
                                  shopsData?.map(s => (
                                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                  ))
                                )}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                {/* 1. Promotion Information */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">1. Promotion Information</h3>
                  <div className="bg-muted/30 p-4 rounded-xl space-y-4 border">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Promotion Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g. Summer Sale 2026" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="promotion_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promotion Type *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="percentage">Percentage Discount</SelectItem>
                                <SelectItem value="fixed">Fixed Amount Discount</SelectItem>
                                <SelectItem value="bogo">Buy One Get One</SelectItem>
                                <SelectItem value="rush_hour">Rush Hour Promotion</SelectItem>
                                <SelectItem value="flash_sale">Flash Sale</SelectItem>
                                <SelectItem value="bundle">Bundle Offer</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormDescription>Choose the type of promotion you want to create.</FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="code"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promo Code (Optional)</FormLabel>
                            <div className="flex gap-2">
                              <FormControl>
                                <Input placeholder="e.g. SUMMER20" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <Button type="button" variant="outline" size="icon" onClick={handleGenerateCode}>
                                <RefreshCw className="h-4 w-4" />
                              </Button>
                            </div>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </div>

                {/* 2. Discount Details (Dynamic) */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">2. Discount Details</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border animate-in fade-in slide-in-from-bottom-2">
                    {watchPromotionType === 'percentage' && (
                      <FormField
                        control={form.control}
                        name="discount_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Percentage (%) *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="100" placeholder="20" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchPromotionType === 'fixed' && (
                      <FormField
                        control={form.control}
                        name="discount_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Discount Amount *</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" placeholder="5000" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchPromotionType === 'bogo' && (
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="buy_quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Buy Quantity *</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="1" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="get_quantity"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Get Quantity *</FormLabel>
                              <FormControl>
                                <Input type="number" min="1" placeholder="1" {...field} value={field.value ?? ''} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <div className="col-span-2 text-sm text-muted-foreground mt-1">
                          Buy 1 get 1 free means customers receive 1 free item for every 1 purchased.
                        </div>
                      </div>
                    )}

                    {['rush_hour', 'flash_sale', 'bundle'].includes(watchPromotionType) && (
                      <FormField
                        control={form.control}
                        name="discount_value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Special Offer Value/Description</FormLabel>
                            <FormControl>
                              <Input placeholder="Describe the offer" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* 3. Applies To */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">3. Applies To</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                    <FormField
                      control={form.control}
                      name="applies_to_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Apply Promotion To</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select target" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="entire_store">Entire Store</SelectItem>
                              <SelectItem value="category">Specific Category</SelectItem>
                              <SelectItem value="specific_product">Specific Product</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchAppliesTo === 'specific_product' && (
                      <FormField
                        control={form.control}
                        name="applies_to_id"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in">
                            <FormLabel>Select Product</FormLabel>
                            <FormControl>
                              <Input placeholder="Type to search product ID or name..." {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {watchAppliesTo === 'category' && (
                      <FormField
                        control={form.control}
                        name="applies_to_id"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in">
                            <FormLabel>Select Category</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter category ID..." {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                {/* 4. Promotion Schedule */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">4. Promotion Schedule</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="start_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Start Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_date"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>End Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="start_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Start Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="end_time"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>End Time (Optional)</FormLabel>
                          <FormControl>
                            <Input type="time" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-2 text-sm text-muted-foreground">
                      Use time if the promotion only applies during certain hours (for example rush hour).
                    </div>
                  </div>
                </div>

                {/* 5. Purchase Conditions */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">5. Purchase Conditions</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="min_purchase_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. Purchase</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="0.00" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usage_per_customer"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Per Customer</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="1" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="usage_limit"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Total Usage Limit</FormLabel>
                          <FormControl>
                            <Input type="number" placeholder="100" {...field} value={field.value ?? ''} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="col-span-full text-sm text-muted-foreground">
                      Set limits to control how often this promotion can be used.
                    </div>
                  </div>
                </div>

                {/* 6. Advanced Settings */}
                <div className="space-y-4">
                  <h3 className="text-sm font-semibold text-primary">6. Advanced Settings</h3>
                  <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Promotion Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Active</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="disabled">Disabled</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Priority Level</FormLabel>
                            <FormControl>
                              <Input type="number" {...field} value={field.value ?? ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={form.control}
                      name="is_stackable"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center justify-between rounded-lg border bg-background p-3">
                          <div className="space-y-0.5">
                            <FormLabel>Allow Combination</FormLabel>
                            <FormDescription>Can be combined with other promotions.</FormDescription>
                          </div>
                          <FormControl>
                            <Switch checked={field.value} onCheckedChange={field.onChange} />
                          </FormControl>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

              </form>
            </Form>
          </div>

          {/* Live Preview & Footer */}
          <div className="border-t bg-background p-4 sm:p-6 space-y-4 mt-auto">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-primary">Live Preview</span>
                {watchAll.status === 'active' && <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">Active</span>}
                {watchAll.status === 'scheduled' && <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">Scheduled</span>}
                {watchAll.status === 'disabled' && <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">Disabled</span>}
              </div>
              <div>
                <span className="font-medium text-base block">{watchAll.name || 'Unnamed Promotion'}</span>
                <span className="text-muted-foreground mt-1 block">
                  {watchPromotionType === 'percentage' && watchAll.discount_value ? `${watchAll.discount_value}% OFF ` : ''}
                  {watchPromotionType === 'fixed' && watchAll.discount_value ? `${watchAll.discount_value} OFF ` : ''}
                  {watchPromotionType === 'bogo' && watchAll.buy_quantity && watchAll.get_quantity ? `Buy ${watchAll.buy_quantity} Get ${watchAll.get_quantity} ` : ''}
                  {['rush_hour', 'flash_sale', 'bundle'].includes(watchPromotionType) && watchAll.discount_value ? `${watchAll.discount_value} ` : ''}
                  {watchAll.code ? <span className="font-mono bg-primary/10 px-1 rounded mx-1">{watchAll.code}</span> : ''}
                </span>
                <span className="text-muted-foreground text-xs block mt-1">
                  Applies to {watchAppliesTo.replace('_', ' ')}
                  {watchAll.usage_limit ? ` • Limited to ${watchAll.usage_limit} uses` : ''}
                </span>
              </div>
            </div>

            <div className="flex gap-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsDrawerOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" form="promo-form" className="flex-1" disabled={createPromotionMutation.isPending}>
                {createPromotionMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Promotion
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default Promotions;
