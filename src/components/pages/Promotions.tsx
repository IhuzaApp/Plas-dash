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
import { Search, Filter, Plus, Loader2, RefreshCw, CalendarIcon, X } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { GET_PROMOTIONS, CREATE_PROMOTION, UPDATE_PROMOTION } from '@/lib/graphql/queries';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetClose,
} from '@/components/ui/sheet';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { format, addDays } from 'date-fns';
import { DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { usePrivilege } from '@/hooks/usePrivilege';

interface Promotion {
  id: string;
  name: string;
  code: string;
  discount: string;
  period: string;
  status: string;
  usage: string;
  current_usage?: number;
  created_at: string;
  update_on: string;
}

interface PromotionsResponse {
  promotions: Promotion[];
}

const DISCOUNT_OPTIONS = [
  { value: '5%', label: '5% off' },
  { value: '10%', label: '10% off' },
  { value: '15%', label: '15% off' },
  { value: '20%', label: '20% off' },
  { value: '25%', label: '25% off' },
  { value: '30%', label: '30% off' },
  { value: '40%', label: '40% off' },
  { value: '50%', label: '50% off' },
];

const USAGE_LIMIT_OPTIONS = [
  { value: '5', label: '0/5 uses' },
  { value: '10', label: '0/10 uses' },
  { value: '25', label: '0/25 uses' },
  { value: '50', label: '0/50 uses' },
  { value: '100', label: '0/100 uses' },
  { value: '200', label: '0/200 uses' },
  { value: '500', label: '0/500 uses' },
  { value: '1000', label: '0/1000 uses' },
];

const generatePromotionCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};

const promotionFormSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.',
  }),
  code: z.string().min(4, {
    message: 'Code must be at least 4 characters.',
  }),
  discount: z.string().min(1, {
    message: 'Discount is required.',
  }),
  period: z.string().min(1, {
    message: 'Period is required.',
  }),
  usage: z.string().min(1, {
    message: 'Usage limit is required.',
  }),
  status: z.string().min(1, {
    message: 'Status is required.',
  }),
});

type PromotionFormValues = z.infer<typeof promotionFormSchema>;

const Promotions = () => {
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [date, setDate] = useState<DateRange | undefined>();
  const [searchQuery, setSearchQuery] = useState('');
  const queryClient = useQueryClient();
  const { hasAction } = usePrivilege();

  const { data, isLoading } = useQuery({
    queryKey: ['promotions'],
    queryFn: async () => {
      const response = await hasuraRequest<PromotionsResponse>(GET_PROMOTIONS);
      return response.promotions;
    },
  });

  const filteredPromotions = useMemo(() => {
    if (!data || !searchQuery.trim()) return data;

    const query = searchQuery.toLowerCase().trim();
    return data.filter(promotion => {
      return (
        promotion.name.toLowerCase().includes(query) ||
        promotion.code.toLowerCase().includes(query) ||
        promotion.status.toLowerCase().includes(query) ||
        promotion.discount.toLowerCase().includes(query)
      );
    });
  }, [data, searchQuery]);

  const createMutation = useMutation({
    mutationFn: async (values: PromotionFormValues) => {
      const response = await hasuraRequest(CREATE_PROMOTION, values);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion created successfully');
      setIsDrawerOpen(false);
    },
    onError: error => {
      toast.error('Failed to create promotion');
      console.error('Create promotion error:', error);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (values: PromotionFormValues & { id: string }) => {
      const response = await hasuraRequest(UPDATE_PROMOTION, values);
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['promotions'] });
      toast.success('Promotion updated successfully');
      setIsDrawerOpen(false);
    },
    onError: error => {
      toast.error('Failed to update promotion');
      console.error('Update promotion error:', error);
    },
  });

  const form = useForm<PromotionFormValues>({
    resolver: zodResolver(promotionFormSchema),
    defaultValues: {
      name: '',
      code: '',
      discount: '',
      period: '',
      usage: '',
      status: 'active',
    },
  });

  const onSubmit = async (values: PromotionFormValues) => {
    if (selectedPromotion) {
      updateMutation.mutate({ ...values, id: selectedPromotion.id });
    } else {
      createMutation.mutate(values);
    }
  };

  const handleEdit = (promotion: Promotion) => {
    setSelectedPromotion(promotion);
    form.reset({
      name: promotion.name,
      code: promotion.code,
      discount: promotion.discount,
      period: promotion.period,
      usage: promotion.usage,
      status: promotion.status,
    });
    setIsDrawerOpen(true);
  };

  const handleCreate = () => {
    setSelectedPromotion(null);
    form.reset({
      name: '',
      code: '',
      discount: '',
      period: '',
      usage: '',
      status: 'active',
    });
    setIsDrawerOpen(true);
  };

  const handleGenerateCode = () => {
    const newCode = generatePromotionCode();
    form.setValue('code', newCode);
  };

  const formatUsageDisplay = (usage: string, currentUsage: number = 0) => {
    return `${currentUsage}/${usage}`;
  };

  const formatPeriod = (period: string) => {
    try {
      const [start, end] = period.split(' to ');
      return `${format(new Date(start), 'MMMM d, yyyy')} - ${format(new Date(end), 'MMMM d, yyyy')}`;
    } catch (e) {
      return period;
    }
  };

  const handleDateRangeChange = (newDate: DateRange | undefined) => {
    setDate(newDate);
    if (newDate?.from && newDate?.to) {
      const formattedDate = `${format(newDate.from, 'yyyy-MM-dd')} to ${format(newDate.to, 'yyyy-MM-dd')}`;
      form.setValue('period', formattedDate);
    }
  };

  const handleStatusChange = (value: string) => {
    form.setValue('status', value);

    if (value === 'active') {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day

      // Get current end date from form or use existing date state
      let endDate: Date | undefined;
      if (form.getValues('period')) {
        const [_, existingEnd] = form.getValues('period').split(' to ');
        endDate = new Date(existingEnd);
      } else if (date?.to) {
        endDate = date.to;
      }

      // If no end date is set, default to tomorrow
      if (!endDate) {
        endDate = addDays(today, 1);
      }

      const newDateRange = {
        from: today,
        to: endDate,
      };
      setDate(newDateRange);
      const formattedDate = `${format(today, 'yyyy-MM-dd')} to ${format(endDate, 'yyyy-MM-dd')}`;
      form.setValue('period', formattedDate);
    }
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
                <TableHead>Name</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Discount</TableHead>
                <TableHead>Period</TableHead>
                <TableHead>Usage</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex justify-center items-center">
                      <Loader2 className="h-6 w-6 animate-spin" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredPromotions?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Search className="h-8 w-8" />
                      <p>No promotions found</p>
                      {searchQuery && <p className="text-sm">Try adjusting your search query</p>}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredPromotions?.map(promotion => (
                  <TableRow key={promotion.id}>
                    <TableCell className="font-medium">{promotion.name}</TableCell>
                    <TableCell>
                      <span className="font-mono bg-muted px-2 py-1 rounded text-xs">
                        {promotion.code}
                      </span>
                    </TableCell>
                    <TableCell>{promotion.discount}</TableCell>
                    <TableCell>{formatPeriod(promotion.period)}</TableCell>
                    <TableCell>
                      {formatUsageDisplay(promotion.usage, promotion.current_usage)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          promotion.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : promotion.status === 'scheduled'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {promotion.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {hasAction('promotions', 'edit_promotions') && (
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(promotion)}>
                          Edit
                        </Button>
                      )}
                      {hasAction('promotions', 'delete_promotions') && (
                        <Button variant="ghost" size="sm">
                          Delete
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-[400px] sm:w-[540px]">
          <SheetHeader>
            <SheetTitle>{selectedPromotion ? 'Edit Promotion' : 'Create Promotion'}</SheetTitle>
            <SheetDescription>
              {selectedPromotion
                ? 'Update the promotion details below.'
                : 'Add a new promotion to your store.'}
            </SheetDescription>
          </SheetHeader>
          <div className="py-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter promotion name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code</FormLabel>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input placeholder="Enter promotion code" {...field} />
                        </FormControl>
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={handleGenerateCode}
                          title="Generate Code"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="discount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select discount percentage" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {DISCOUNT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
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
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select onValueChange={handleStatusChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="expired">Expired</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Period</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant="outline"
                              className={cn(
                                'w-full pl-3 text-left font-normal',
                                !field.value && 'text-muted-foreground'
                              )}
                            >
                              {field.value ? (
                                formatPeriod(field.value)
                              ) : (
                                <span>Pick a date range</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            initialFocus
                            mode="range"
                            defaultMonth={date?.from}
                            selected={date}
                            onSelect={handleDateRangeChange}
                            numberOfMonths={2}
                            disabled={date => date < new Date()}
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="usage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Usage Limit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select usage limit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {USAGE_LIMIT_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-4 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    className="flex-1"
                    onClick={() => setIsDrawerOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="flex-1"
                    disabled={createMutation.isPending || updateMutation.isPending}
                  >
                    {(createMutation.isPending || updateMutation.isPending) && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {selectedPromotion ? 'Update' : 'Create'}
                  </Button>
                </div>
              </form>
            </Form>
          </div>
        </SheetContent>
      </Sheet>
    </AdminLayout>
  );
};

export default Promotions;
