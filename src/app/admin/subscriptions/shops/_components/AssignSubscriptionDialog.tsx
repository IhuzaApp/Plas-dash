'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { addMonths, addYears, format } from 'date-fns';
import { apiGet, apiPost } from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

// ─── Types ────────────────────────────────────────────────────────────────────

type EntityType = 'shop' | 'restaurant' | 'business';

interface Plan {
  id: string;
  name: string;
  price_monthly: number;
  price_yearly: number;
}

interface Shop {
  id: string;
  name: string;
  business_id?: string;
}

interface Restaurant {
  id: string;
  name: string;
  email?: string;
  business_id?: string;
}

interface BusinessAccount {
  id: string;
  business_name: string;
  business_email?: string;
}

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  entity_type: z.enum(['shop', 'restaurant', 'business']),
  entity_id: z.string().min(1, 'Please select an entity'),
  plan_id: z.string().min(1, 'Please select a plan'),
  billing_cycle: z.enum(['monthly', 'yearly']),
  start_date: z.string().min(1, 'Start date is required'),
});

type FormValues = z.infer<typeof schema>;

// ─── Props ────────────────────────────────────────────────────────────────────

interface AssignSubscriptionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function AssignSubscriptionDialog({ open, onOpenChange }: AssignSubscriptionDialogProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const today = new Date().toISOString().split('T')[0];

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      entity_type: 'shop',
      entity_id: '',
      plan_id: '',
      billing_cycle: 'monthly',
      start_date: today,
    },
  });

  const entityType = form.watch('entity_type') as EntityType;
  const billingCycle = form.watch('billing_cycle');

  // Reset entity_id whenever entity_type changes
  useEffect(() => {
    form.setValue('entity_id', '');
  }, [entityType, form]);

  // Reset the entire form when dialog opens
  useEffect(() => {
    if (open) {
      form.reset({
        entity_type: 'shop',
        entity_id: '',
        plan_id: '',
        billing_cycle: 'monthly',
        start_date: today,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // ─── Data fetching ────────────────────────────────────────────────────────

  const { data: businessData, isLoading: businessLoading } = useQuery<{
    business_accounts: BusinessAccount[];
  }>({
    queryKey: ['business-accounts'],
    queryFn: () =>
      apiGet<{ business_accounts: BusinessAccount[] }>('/api/queries/business-accounts'),
    enabled: open && entityType === 'business',
  });

  const { data: plansData, isLoading: plansLoading } = useQuery<{ plans: Plan[] }>({
    queryKey: ['plans'],
    queryFn: () => apiGet<{ plans: Plan[] }>('/api/queries/plans'),
    enabled: open,
  });

  const { data: shopsData, isLoading: shopsLoading } = useQuery<{ shops: Shop[] }>({
    queryKey: ['shops'],
    queryFn: () => apiGet<{ shops: Shop[] }>('/api/queries/shops'),
    enabled: open && entityType === 'shop',
  });

  const { data: restaurantsData, isLoading: restaurantsLoading } = useQuery<{
    restaurants: Restaurant[];
  }>({
    queryKey: ['restaurants'],
    queryFn: () => apiGet<{ restaurants: Restaurant[] }>('/api/queries/restaurants'),
    enabled: open && entityType === 'restaurant',
  });

  // ─── Entity list state ────────────────────────────────────────────────────

  const isEntityLoading =
    (entityType === 'shop' && shopsLoading) ||
    (entityType === 'restaurant' && restaurantsLoading) ||
    (entityType === 'business' && businessLoading);

  const entityOptions: { value: string; label: string }[] = (() => {
    if (entityType === 'shop') {
      return (shopsData?.shops ?? []).map(s => ({ value: s.id, label: s.name }));
    }
    if (entityType === 'restaurant') {
      return (restaurantsData?.restaurants ?? []).map(r => ({
        value: r.id,
        label: r.name + (r.email ? ` — ${r.email}` : ''),
      }));
    }
    if (entityType === 'business') {
      return (businessData?.business_accounts ?? []).map(b => ({
        value: b.id,
        label: b.business_name + (b.business_email ? ` — ${b.business_email}` : ''),
      }));
    }
    return [];
  })();

  // ─── Plan price preview ───────────────────────────────────────────────────

  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const selectedPlan = plansData?.plans.find(p => p.id === selectedPlanId);
  const pricePreview = selectedPlan
    ? billingCycle === 'monthly'
      ? `RWF ${selectedPlan.price_monthly.toLocaleString()} / mo`
      : `RWF ${selectedPlan.price_yearly.toLocaleString()} / yr`
    : null;

  // ─── Mutation ─────────────────────────────────────────────────────────────

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload: Record<string, string | null> = {
        plan_id: values.plan_id,
        billing_cycle: values.billing_cycle,
        start_date: values.start_date,
        status: 'active',
        shop_id: null,
        restaurant_id: null,
        business_id: null,
      };

      if (values.entity_type === 'shop') {
        payload.shop_id = values.entity_id;
      } else if (values.entity_type === 'restaurant') {
        payload.restaurant_id = values.entity_id;
      } else if (values.entity_type === 'business') {
        payload.business_id = values.entity_id;
      }

      return apiPost('/api/mutations/shop-subscriptions', payload);
    },
    onSuccess: () => {
      toast({
        title: 'Subscription assigned',
        description: 'The subscription has been successfully assigned.',
      });
      queryClient.invalidateQueries({ queryKey: ['shop-subscriptions'] });
      onOpenChange(false);
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to assign subscription',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const onSubmit = (values: FormValues) => {
    mutation.mutate(values);
  };

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Assign Subscription</DialogTitle>
          <DialogDescription>
            Assign a subscription plan to a shop, restaurant, or business account.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-2">
            {/* Entity Type / Subscription Level */}
            <FormField
              control={form.control}
              name="entity_type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Level</FormLabel>
                  <Select
                    onValueChange={val => {
                      field.onChange(val);
                      form.setValue('entity_id', '');
                    }}
                    value={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="shop">Specific Shop</SelectItem>
                      <SelectItem value="restaurant">Specific Restaurant</SelectItem>
                      <SelectItem value="business">Business Account (Whole Org)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Entity selection */}
            <FormField
              control={form.control}
              name="entity_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {entityType === 'shop' && 'Target Shop'}
                    {entityType === 'restaurant' && 'Target Restaurant'}
                    {entityType === 'business' && 'Target Business Account'}
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    value={field.value}
                    disabled={isEntityLoading || entityOptions.length === 0}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            isEntityLoading
                              ? 'Loading…'
                              : entityOptions.length === 0
                                ? 'No entities found'
                                : 'Select one…'
                          }
                        />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {entityOptions.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Plan */}
            <FormField
              control={form.control}
              name="plan_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subscription Plan</FormLabel>
                  <Select
                    onValueChange={val => {
                      field.onChange(val);
                      setSelectedPlanId(val);
                    }}
                    value={field.value}
                    disabled={plansLoading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={plansLoading ? 'Loading…' : 'Select a plan…'} />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {(plansData?.plans ?? []).map(plan => (
                        <SelectItem key={plan.id} value={plan.id}>
                          {plan.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {pricePreview && (
                    <div className="mt-1 space-y-1">
                      <p className="text-xs text-muted-foreground">{pricePreview}</p>
                      {selectedPlan?.name?.toLowerCase().includes('basic') ? (
                        <p className="text-[10px] text-muted-foreground italic">
                          Basic plan starts immediately.
                        </p>
                      ) : (
                        <p className="text-[10px] text-primary font-medium">
                          Includes 14-day free trial before first billing.
                        </p>
                      )}
                    </div>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Billing Cycle + Start Date */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="billing_cycle"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Billing Cycle</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="start_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start Date</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={mutation.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending ? 'Assigning…' : 'Assign Subscription'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
