import React, { useState } from 'react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard, DollarSign, Wallet } from 'lucide-react';
import { useWallets, useSystemConfig } from '@/hooks/useHasuraApi';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

const formSchema = z.object({
  userId: z.string({
    required_error: 'Please select a user',
  }),
  amount: z.string().refine(val => !isNaN(Number(val)) && Number(val) > 0, {
    message: 'Amount must be a positive number',
  }),
  paymentMethod: z.enum(['bank', 'card', 'wallet']),
  notes: z.string().optional(),
});

interface ProcessPayoutDrawerProps {
  children: React.ReactNode;
}

const ProcessPayoutDrawer = ({ children }: ProcessPayoutDrawerProps) => {
  const { data: walletsData, isLoading: isLoadingWallets } = useWallets();
  const { data: systemConfig } = useSystemConfig();
  const [selectedWallet, setSelectedWallet] = useState<any>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      userId: '',
      amount: '',
      paymentMethod: 'bank',
      notes: '',
    },
  });

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const handleUserChange = (userId: string) => {
    const wallet = walletsData?.Wallets.find((w: any) => w.User?.id === userId);
    setSelectedWallet(wallet);
    if (wallet) {
      form.setValue('amount', wallet.available_balance || '0');
    }
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
    // Here you would handle the payout processing
  }

  return (
    <Drawer>
      <DrawerTrigger asChild>{children}</DrawerTrigger>
      <DrawerContent>
        <div className="mx-auto w-full max-w-sm">
          <DrawerHeader>
            <DrawerTitle>Process Payouts</DrawerTitle>
            <DrawerDescription>
              Send payments to selected shoppers. Once processed, payments cannot be reversed.
            </DrawerDescription>
          </DrawerHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="p-4 space-y-6">
              <FormField
                control={form.control}
                name="userId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Select User</FormLabel>
                    <Select
                      onValueChange={value => {
                        field.onChange(value);
                        handleUserChange(value);
                      }}
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a user" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {walletsData?.Wallets.map(
                          (wallet: any) =>
                            wallet.User && (
                              <SelectItem key={wallet.User.id} value={wallet.User.id}>
                                <div className="flex items-center gap-2">
                                  {wallet.User.profile_picture && (
                                    <img
                                      src={wallet.User.profile_picture}
                                      alt="Profile"
                                      className="w-6 h-6 rounded-full"
                                    />
                                  )}
                                  <div>
                                    <div className="font-medium">{wallet.User.name}</div>
                                    <div className="text-sm text-muted-foreground">
                                      Balance: {formatCurrency(wallet.available_balance || '0')}
                                    </div>
                                  </div>
                                </div>
                              </SelectItem>
                            )
                        )}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Amount</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          {systemConfig?.System_configuratioins[0]?.currency || 'RWF'}
                        </span>
                        <Input placeholder="0.00" className="pl-16" {...field} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentMethod"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <FormLabel>Payment Method</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="bank" id="bank" />
                          <Label htmlFor="bank" className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            Bank Transfer
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="card" id="card" />
                          <Label htmlFor="card" className="flex items-center gap-2">
                            <CreditCard className="h-4 w-4" />
                            Credit Card
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="wallet" id="wallet" />
                          <Label htmlFor="wallet" className="flex items-center gap-2">
                            <Wallet className="h-4 w-4" />
                            Platform Wallet
                          </Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Add any additional information about this payout"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DrawerFooter className="px-0">
                <Button type="submit" className="w-full">
                  Process Payment
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full">
                    Cancel
                  </Button>
                </DrawerClose>
              </DrawerFooter>
            </form>
          </Form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ProcessPayoutDrawer;
