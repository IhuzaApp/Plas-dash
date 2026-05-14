import React, { useState, useMemo } from 'react';
import AdminLayout from '@/components/layout/AdminLayout';
import PageHeader from '@/components/layout/PageHeader';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet } from '@/lib/api';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { usePrivilege } from '@/hooks/usePrivilege';
import { useCreatePromotion, useUpdatePromotion } from '@/hooks/useHasuraApi';
import { useCurrentOrgEmployee } from '@/hooks/useCurrentOrgEmployee';
import { Promotion } from '@/components/promotions/types';
import {
  PromotionFormValues,
  promotionFormSchema,
  DEFAULT_FORM_VALUES,
} from '@/components/promotions/schema';
import { PromotionTable } from '@/components/promotions/PromotionTable';
import { PromotionForm } from '@/components/promotions/PromotionForm';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { PromotionFilters, PromotionFilterState } from '@/components/promotions/PromotionFilters';

const DEFAULT_FILTERS: PromotionFilterState = {
  searchQuery: '',
  fundedBy: 'all',
  freeDelivery: 'all',
  promoType: 'all',
};

const Promotions = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [filters, setFilters] = useState<PromotionFilterState>(DEFAULT_FILTERS);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const queryClient = useQueryClient();
  const { hasAction, session } = usePrivilege();
  const { orgEmployee } = useCurrentOrgEmployee();
  const createPromotionMutation = useCreatePromotion();
  const updatePromotionMutation = useUpdatePromotion();
  const { data: systemConfig } = useSystemConfig();

  const { data, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: () =>
      apiGet<{ promotions: Promotion[] }>('/api/queries/promotions').then(r => r.promotions),
  });

  const { data: influencersData } = useQuery({
    queryKey: ['influencers'],
    queryFn: () =>
      apiGet<{ influencers: any[] }>('/api/queries/influencers').then(r => r.influencers),
    enabled: !!session?.isProjectUser,
  });

  const { data: shopsData } = useQuery({
    queryKey: ['shops'],
    queryFn: () => apiGet<{ shops: any[] }>('/api/queries/shops').then(r => r.shops),
    enabled: !!session?.isProjectUser,
  });

  const { data: restaurantsData } = useQuery({
    queryKey: ['restaurants'],
    queryFn: () =>
      apiGet<{ restaurants: any[] }>('/api/queries/restaurants').then(r => r.restaurants),
    enabled: !!session?.isProjectUser,
  });

  const filteredPromotions = useMemo(() => {
    if (!data) return [];

    return data.filter(promotion => {
      // Text search
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase().trim();
        const matches =
          promotion.name.toLowerCase().includes(q) ||
          promotion.code?.toLowerCase().includes(q) ||
          promotion.status.toLowerCase().includes(q) ||
          (promotion.discount_value && promotion.discount_value.toLowerCase().includes(q));
        if (!matches) return false;
      }

      // Funded by filter
      if (filters.fundedBy !== 'all' && promotion.funded_by !== filters.fundedBy) {
        return false;
      }

      // Free delivery filter
      if (filters.freeDelivery === 'yes' && !promotion.free_delivery) return false;
      if (filters.freeDelivery === 'no' && promotion.free_delivery) return false;

      // Promo type filter
      if (filters.promoType === 'influencer' && !promotion.influencer_id) return false;
      if (
        filters.promoType === 'standard' &&
        promotion.influencer_id &&
        promotion.influencer_id !== 'none'
      )
        return false;

      return true;
    });
  }, [data, filters]);

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: DEFAULT_FORM_VALUES,
  });

  const toggleRow = (id: string) => {
    const newExpandedRows = new Set(expandedRows);
    if (newExpandedRows.has(id)) {
      newExpandedRows.delete(id);
    } else {
      newExpandedRows.add(id);
    }
    setExpandedRows(newExpandedRows);
  };

  const onSubmit = async (values: PromotionFormValues) => {
    try {
      const isInfluencerPromo = values.business_type === 'none';

      const payload: any = {
        name: values.name,
        code: isInfluencerPromo ? values.influencer_code : values.code || '',
        promotion_type: values.promotion_type,
        applies_to_type: values.applies_to_type,
        applies_to_id: values.applies_to_id || undefined,
        start_date: values.start_date.toISOString(),
        end_date: values.end_date.toISOString(),
        start_time: values.start_time || undefined,
        end_time: values.end_time || undefined,
        min_purchase_amount: values.min_purchase_amount || '',
        usage_per_customer: values.usage_per_customer ? parseInt(values.usage_per_customer) : 10,
        usage_limit: values.usage_limit ? parseInt(values.usage_limit) : 10,
        priority: parseInt(values.priority) || 10,
        status: values.status,
        discount_type: values.promotion_type,
        discount_value: '',
        buy_quantity: '',
        restaurant_id: values.business_type === 'restaurant' ? values.business_id : null,
        shop_id: values.business_type === 'shop' ? values.business_id : null,
        promotion_scope: values.promotion_scope,
        customer_discount_percent: values.customer_discount_percent
          ? parseInt(values.customer_discount_percent)
          : null,

        // 👤 INFLUENCER — only set when business_type = 'none'
        influencer_id: isInfluencerPromo
          ? values.influencer_id === 'none'
            ? null
            : values.influencer_id
          : null,
        influencer_code: isInfluencerPromo ? values.influencer_code || null : null,
        commission_type: isInfluencerPromo ? values.commission_type || null : null,
        commission_value:
          isInfluencerPromo && values.commission_value ? parseFloat(values.commission_value) : null,
        commission_cap:
          isInfluencerPromo && values.commission_cap ? parseFloat(values.commission_cap) : null,

        // 💰 ECONOMICS
        funded_by: values.funded_by,
        affects: values.affects,
        stacking_type: values.stacking_type,
        max_discount: values.max_discount ? parseFloat(values.max_discount) : null,
        min_order_value: values.min_order_value ? parseFloat(values.min_order_value) : null,

        // 🚚 DELIVERY
        free_delivery: values.free_delivery ?? false,
        delivery_paid_by: values.free_delivery ? values.delivery_paid_by || null : null,

        // 💰 BUDGET — budget_limit only; budget_used is NEVER sent (backend-managed)
        budget_limit: values.budget_limit ? parseFloat(values.budget_limit) : null,
      };

      // Influencer-only promotion overrides
      if (isInfluencerPromo) {
        payload.promotion_type = 'percentage';
        payload.applies_to_type = 'entire_store';
        payload.discount_value = '0';
        payload.priority = 0;
      } else {
        if (values.promotion_type === 'percentage' || values.promotion_type === 'fixed') {
          payload.discount_value = values.discount_value || '';
        } else if (values.promotion_type === 'bogo') {
          payload.buy_quantity = values.buy_quantity || '';
          payload.discount_value = `Buy ${values.buy_quantity} Get ${values.get_quantity}`;
        } else {
          payload.discount_value = values.discount_value || 'Special Offer';
        }
      }

      if (selectedPromotion) {
        await updatePromotionMutation.mutateAsync({
          id: selectedPromotion.id,
          ...payload,
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
    const businessId = session?.isProjectUser
      ? ''
      : session?.shop_id || orgEmployee?.restaurant_id || '';
    const businessType = session?.isProjectUser
      ? 'restaurant'
      : session?.shop_id
        ? 'shop'
        : 'restaurant';

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
      discount_value: promotion.discount_value?.toString() || '',
      buy_quantity: promotion.buy_quantity || '',
      get_quantity: promotion.discount_value?.toString().includes('Get ')
        ? promotion.discount_value.toString().split('Get ')[1]
        : '',
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
      business_type:
        promotion.restaurant_id || promotion.shop_id
          ? promotion.restaurant_id
            ? 'restaurant'
            : 'shop'
          : 'none',
      business_id: promotion.restaurant_id || promotion.shop_id || '',
      promotion_scope: promotion.promotion_scope || 'all_orders',
      customer_discount_percent: promotion.customer_discount_percent?.toString() || '',

      // 👤 Influencer
      influencer_id: promotion.influencer_id || 'none',
      influencer_code: promotion.influencer_code || '',
      commission_type: promotion.commission_type ?? 'fixed',
      commission_value: promotion.commission_value?.toString() || '',
      commission_cap: promotion.commission_cap?.toString() || '',

      // 💰 Economics — fallback defaults for old promotions
      funded_by: promotion.funded_by ?? 'platform',
      affects: promotion.affects ?? 'subtotal',
      stacking_type: promotion.stacking_type ?? 'exclusive',
      max_discount: promotion.max_discount?.toString() || '',
      min_order_value: promotion.min_order_value?.toString() || '',

      // 🚚 Delivery
      free_delivery: promotion.free_delivery ?? false,
      delivery_paid_by: promotion.delivery_paid_by ?? undefined,

      // 💰 Budget (budget_used is read-only — never mapped to form)
      budget_limit: promotion.budget_limit?.toString() || '',
    });
    setIsDrawerOpen(true);
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
        <PromotionFilters filters={filters} onFiltersChange={setFilters} />

        <PromotionTable
          promotions={filteredPromotions}
          isLoading={isLoading}
          expandedRows={expandedRows}
          onToggleRow={toggleRow}
          onEdit={handleEdit}
          isProjectUser={!!session?.isProjectUser}
          systemConfig={systemConfig}
        />
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[100vw] sm:max-w-xl flex flex-col p-0 h-full">
          <SheetHeader className="p-6 pb-2 border-b">
            <SheetTitle>{selectedPromotion ? 'Edit Promotion' : 'Create Promotion'}</SheetTitle>
            <SheetDescription>Set up a new discount or special offer.</SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto p-6">
            <PromotionForm
              form={form}
              onSubmit={onSubmit}
              isPending={createPromotionMutation.isPending || updatePromotionMutation.isPending}
              isProjectUser={!!session?.isProjectUser}
              influencers={influencersData || []}
              shops={shopsData || []}
              restaurants={restaurantsData || []}
              onCancel={() => setIsDrawerOpen(false)}
              systemConfig={systemConfig}
            />
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default Promotions;
