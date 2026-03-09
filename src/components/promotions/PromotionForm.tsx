import React from 'react';
import { useWatch, UseFormReturn } from 'react-hook-form';
import { format } from 'date-fns';
import { CalendarIcon, RefreshCw, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { PromotionFormValues, generatePromotionCode } from './schema';
import { SystemConfig } from '@/hooks/useSystemConfig';

interface PromotionFormProps {
  form: UseFormReturn<PromotionFormValues>;
  onSubmit: (values: PromotionFormValues) => void;
  isPending: boolean;
  isProjectUser: boolean;
  influencers: any[];
  shops: any[];
  restaurants: any[];
  onCancel: () => void;
  systemConfig?: SystemConfig;
}

export const PromotionForm: React.FC<PromotionFormProps> = ({
  form,
  onSubmit,
  isPending,
  isProjectUser,
  influencers,
  shops,
  restaurants,
  onCancel,
  systemConfig,
}) => {
  const watchPromotionType = useWatch({ control: form.control, name: 'promotion_type' });
  const watchAppliesTo = useWatch({ control: form.control, name: 'applies_to_type' });
  const watchAll = form.watch();

  const handleGenerateCode = () => {
    form.setValue('code', generatePromotionCode());
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-6">
        <Form {...form}>
          <form id="promo-form" onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* 1. Promotion Information */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-primary">1. Promotion Information</h3>
              <div className="bg-muted/30 p-4 rounded-xl space-y-4 border">
                {/* Business/Influencer Assignment */}
                {isProjectUser && (
                  <div className="space-y-4 pb-4 border-b">
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
                              <div className="flex items-center space-x-2">
                                <RadioGroupItem value="none" id="none" />
                                <Label htmlFor="none">None (Influencer Promotion)</Label>
                              </div>
                            </RadioGroup>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {watchAll.business_type !== 'none' ? (
                      <FormField
                        control={form.control}
                        name="business_id"
                        render={({ field }) => (
                          <FormItem className="animate-in fade-in slide-in-from-top-1">
                            <FormLabel>
                              Select{' '}
                              {watchAll.business_type === 'restaurant' ? 'Restaurant' : 'Shop'}
                            </FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder={`Select ${watchAll.business_type}`} />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {watchAll.business_type === 'restaurant'
                                  ? restaurants?.map(r => (
                                      <SelectItem key={r.id} value={r.id}>
                                        {r.name}
                                      </SelectItem>
                                    ))
                                  : shops?.map(s => (
                                      <SelectItem key={s.id} value={s.id}>
                                        {s.name}
                                      </SelectItem>
                                    ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <div className="space-y-4 animate-in fade-in slide-in-from-top-1">
                        <FormField
                          control={form.control}
                          name="promotion_scope"
                          render={({ field }) => (
                            <FormItem className="space-y-3">
                              <FormLabel>Promotion Applies To</FormLabel>
                              <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select target scope" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="restaurant">Restaurant</SelectItem>
                                  <SelectItem value="shop">Shop</SelectItem>
                                  <SelectItem value="reel">Reel</SelectItem>
                                  <SelectItem value="all_orders">All Orders</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="influencer_id"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Influencer</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                  <FormControl>
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select influencer" />
                                    </SelectTrigger>
                                  </FormControl>
                                  <SelectContent>
                                    <SelectItem value="none">None (Generic)</SelectItem>
                                    {influencers?.map(influencer => (
                                      <SelectItem key={influencer.id} value={influencer.id}>
                                        {influencer.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="influencer_code"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Influencer Code</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder="e.g. KIM20"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="customer_discount_percent"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Extra Customer Discount (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="5"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="earning_per_order"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Earning Per Purchase</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    placeholder="100.00"
                                    {...field}
                                    value={field.value ?? ''}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Promotion Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g. Summer Sale 2026"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {watchAll.business_type !== 'none' && (
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
                          <FormDescription>
                            Choose the type of promotion you want to create.
                          </FormDescription>
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
                              <Input
                                placeholder="e.g. SUMMER20"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              onClick={handleGenerateCode}
                            >
                              <RefreshCw className="h-4 w-4" />
                            </Button>
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}

                <div
                  className={cn(
                    'grid gap-4 pt-4 border-t',
                    watchAll.business_type === 'none' ? 'grid-cols-1' : 'grid-cols-2'
                  )}
                >
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
                  {watchAll.business_type !== 'none' && (
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
                  )}
                </div>
              </div>
            </div>

            {/* 2. Discount Details (Dynamic) */}
            {watchAll.business_type !== 'none' && (
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
                            <Input
                              type="number"
                              min="1"
                              max="100"
                              placeholder="20"
                              {...field}
                              value={field.value ?? ''}
                            />
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
                            <Input
                              type="number"
                              min="1"
                              placeholder="5000"
                              {...field}
                              value={field.value ?? ''}
                            />
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
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                {...field}
                                value={field.value ?? ''}
                              />
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
                              <Input
                                type="number"
                                min="1"
                                placeholder="1"
                                {...field}
                                value={field.value ?? ''}
                              />
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

                  {['rush_hour', 'flash_sale', 'bundle'].includes(watchPromotionType as string) && (
                    <FormField
                      control={form.control}
                      name="discount_value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Special Offer Value/Description</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Describe the offer"
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

            {/* 3. Applies To */}
            {watchAll.business_type !== 'none' && (
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
                            <Input
                              placeholder="Type to search product ID or name..."
                              {...field}
                              value={field.value ?? ''}
                            />
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
                            <Input
                              placeholder="Enter category ID..."
                              {...field}
                              value={field.value ?? ''}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              </div>
            )}

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
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value instanceof Date ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
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
                            <Button
                              variant="outline"
                              className={cn(
                                'pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value instanceof Date ? (
                                format(field.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {watchAll.business_type !== 'none' && (
                  <>
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
                      Use time if the promotion only applies during certain hours (for example rush
                      hour).
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* 5. Purchase Conditions */}
            {watchAll.business_type !== 'none' && (
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-primary">5. Purchase Conditions</h3>
                <div className="bg-muted/30 p-4 rounded-xl border space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <FormField
                      control={form.control}
                      name="min_purchase_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Min. Purchase</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="0.00"
                              {...field}
                              value={field.value ?? ''}
                            />
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
                            <Input
                              type="number"
                              placeholder="1"
                              {...field}
                              value={field.value ?? ''}
                            />
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
                            <Input
                              type="number"
                              placeholder="100"
                              {...field}
                              value={field.value ?? ''}
                            />
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
                  <div className="text-sm text-muted-foreground">
                    Set limits to control how often this promotion can be used.
                  </div>
                </div>
              </div>
            )}
          </form>
        </Form>
      </div>

      {/* Live Preview & Footer */}
      <div className="border-t bg-background p-4 sm:p-6 space-y-4 mt-auto">
        <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 text-sm flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-primary">Live Preview</span>
            {watchAll.status === 'active' && (
              <span className="bg-green-100 text-green-800 px-2 py-0.5 rounded text-xs font-medium">
                Active
              </span>
            )}
            {watchAll.status === 'scheduled' && (
              <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-medium">
                Scheduled
              </span>
            )}
            {watchAll.status === 'disabled' && (
              <span className="bg-gray-100 text-gray-800 px-2 py-0.5 rounded text-xs font-medium">
                Disabled
              </span>
            )}
            {watchAll.business_type === 'none' && (
              <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded text-xs font-medium">
                Influencer
              </span>
            )}
          </div>
          <div>
            <span className="font-medium text-base block">
              {watchAll.name || 'Unnamed Promotion'}
            </span>
            <span className="text-muted-foreground mt-1 block">
              {watchPromotionType === 'percentage' && watchAll.discount_value
                ? `${watchAll.discount_value}% OFF `
                : ''}
              {watchPromotionType === 'fixed' && watchAll.discount_value
                ? `${watchAll.discount_value} OFF `
                : ''}
              {watchPromotionType === 'bogo' && watchAll.buy_quantity && watchAll.get_quantity
                ? `Buy ${watchAll.buy_quantity} Get ${watchAll.get_quantity} `
                : ''}
              {['rush_hour', 'flash_sale', 'bundle'].includes(watchPromotionType as string) &&
              watchAll.discount_value
                ? `${watchAll.discount_value} `
                : ''}
              {watchAll.code ? (
                <span className="font-mono bg-primary/10 px-1 rounded mx-1">{watchAll.code}</span>
              ) : (
                ''
              )}
            </span>
            <span className="text-muted-foreground text-xs block mt-1">
              Applies to {watchAppliesTo?.replace('_', ' ')}
              {watchAll.usage_limit ? ` • Limited to ${watchAll.usage_limit} uses` : ''}
            </span>
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" form="promo-form" className="flex-1" disabled={isPending}>
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Promotion
          </Button>
        </div>
      </div>
    </div>
  );
};
