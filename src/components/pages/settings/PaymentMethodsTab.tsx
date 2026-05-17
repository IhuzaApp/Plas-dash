import React from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CreditCard, Smartphone, Landmark, Shield, Edit } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaymentMethodsTabProps {
  profileData: any;
  paymentMethods: any[];
  selectedPayoutType: 'momo' | 'bank';
  setSelectedPayoutType: (type: 'momo' | 'bank') => void;
  isEditingPayout: boolean;
  setIsEditingPayout: (editing: boolean) => void;
  isSavingPayout: boolean;
  payoutForm: any;
  setPayoutForm: React.Dispatch<React.SetStateAction<any>>;
  handleSavePayoutMethod: () => Promise<void>;
  maskAccountNumber: (number: string) => string;
}

const PaymentMethodsTab: React.FC<PaymentMethodsTabProps> = ({
  profileData,
  paymentMethods,
  selectedPayoutType,
  setSelectedPayoutType,
  isEditingPayout,
  setIsEditingPayout,
  isSavingPayout,
  payoutForm,
  setPayoutForm,
  handleSavePayoutMethod,
  maskAccountNumber,
}) => {
  return (
    <Card className="border-none shadow-xl bg-gradient-to-br from-background to-muted/20 rounded-3xl overflow-hidden">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-primary/10">
              <CreditCard className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle>Payout Management</CardTitle>
              <CardDescription>Configure and manage your payout destinations.</CardDescription>
            </div>
          </div>
          {profileData?.display_role === 'storeAdministrator' && (
            <Badge
              variant="outline"
              className="rounded-lg bg-yellow-500/10 text-yellow-600 border-yellow-500/20 gap-1"
            >
              <Shield className="h-3 w-3" />
              View Only
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-8">
        {/* Existing Methods Table */}
        {paymentMethods.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
              Registered Payout Methods
            </h3>
            <div className="rounded-2xl border border-muted-foreground/10 overflow-hidden bg-background">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Method</th>
                    <th className="px-4 py-3 font-semibold">Account Name</th>
                    <th className="px-4 py-3 font-semibold">Account Number</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-muted-foreground/10">
                  {paymentMethods.map(pm => (
                    <tr key={pm.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          {pm.method === 'momo' ? (
                            <Smartphone className="h-4 w-4 text-primary" />
                          ) : (
                            <Landmark className="h-4 w-4 text-primary" />
                          )}
                          <span className="capitalize">
                            {pm.method === 'momo' ? 'Mobile Money' : 'Bank Transfer'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-medium">{pm.names}</td>
                      <td className="px-4 py-4 font-mono text-xs">
                        {maskAccountNumber(pm.number)}
                      </td>
                      <td className="px-4 py-4 text-center">
                        {pm.is_default ? (
                          <Badge className="bg-primary/10 text-primary border-none">Default</Badge>
                        ) : (
                          <span className="text-[10px] text-muted-foreground">Secondary</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {profileData?.display_role === 'globalAdmin' && (
          <div className="space-y-6">
            <div className="h-px bg-muted-foreground/10" />

            <div className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                Add New Payout Method
              </h3>
              <div className="flex gap-4 p-1 bg-muted rounded-2xl w-fit">
                <button
                  onClick={() => {
                    if (!isEditingPayout) return;
                    setSelectedPayoutType('momo');
                  }}
                  disabled={!isEditingPayout}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all',
                    selectedPayoutType === 'momo'
                      ? 'bg-background shadow-md text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    !isEditingPayout && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Smartphone className="h-4 w-4" />
                  Mobile Money
                </button>
                <button
                  onClick={() => {
                    if (!isEditingPayout) return;
                    setSelectedPayoutType('bank');
                  }}
                  disabled={!isEditingPayout}
                  className={cn(
                    'flex items-center gap-2 px-6 py-2 rounded-xl text-sm font-medium transition-all',
                    selectedPayoutType === 'bank'
                      ? 'bg-background shadow-md text-primary'
                      : 'text-muted-foreground hover:text-foreground',
                    !isEditingPayout && 'opacity-50 cursor-not-allowed'
                  )}
                >
                  <Landmark className="h-4 w-4" />
                  Bank Account
                </button>
              </div>

              {selectedPayoutType === 'momo' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="momo-provider">Network Provider</Label>
                    <Select
                      value={payoutForm.provider}
                      onValueChange={v => setPayoutForm((prev: any) => ({ ...prev, provider: v }))}
                      disabled={!isEditingPayout}
                    >
                      <SelectTrigger
                        id="momo-provider"
                        className="rounded-xl border-muted-foreground/20"
                      >
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                        <SelectItem value="airtel">Airtel Money</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="momo-number">Phone Number</Label>
                    <Input
                      id="momo-number"
                      placeholder="e.g. 078XXXXXXX"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.number}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, number: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="momo-name">Account Name</Label>
                    <Input
                      id="momo-name"
                      placeholder="Full name as it appears on account"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.names}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, names: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-top-2 duration-300">
                  <div className="space-y-2">
                    <Label htmlFor="bank-name">Bank Name</Label>
                    <Input
                      id="bank-name"
                      placeholder="Enter bank name"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.bankName}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, bankName: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-account">Account Number</Label>
                    <Input
                      id="bank-account"
                      placeholder="Enter account number"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.number}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, number: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-branch">Branch Name</Label>
                    <Input
                      id="bank-branch"
                      placeholder="Enter branch name"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.bankBranch}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, bankBranch: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="bank-swift">SWIFT / BIC Code</Label>
                    <Input
                      id="bank-swift"
                      placeholder="Enter SWIFT code"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.bankSwift}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, bankSwift: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="bank-holder">Account Holder Name</Label>
                    <Input
                      id="bank-holder"
                      placeholder="Full name as it appears on bank statement"
                      className="rounded-xl border-muted-foreground/20"
                      value={payoutForm.names}
                      onChange={e =>
                        setPayoutForm((prev: any) => ({ ...prev, names: e.target.value }))
                      }
                      readOnly={!isEditingPayout}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
      {profileData?.display_role === 'globalAdmin' && (
        <CardFooter className="border-t bg-zinc-50/50 dark:bg-zinc-900/50 pt-6 flex justify-between items-center">
          {!isEditingPayout ? (
            <Button
              onClick={() => setIsEditingPayout(true)}
              variant="outline"
              className="rounded-xl px-8 border-primary text-primary hover:bg-primary/10 transition-colors gap-2"
            >
              <Edit className="h-4 w-4" />
              Modify Payout Method
            </Button>
          ) : (
            <div className="flex gap-3">
              <Button
                onClick={handleSavePayoutMethod}
                className="rounded-xl px-8 shadow-lg shadow-primary/20"
                disabled={isSavingPayout}
              >
                {isSavingPayout ? 'Saving...' : payoutForm.id ? 'Update Method' : 'Add Method'}
              </Button>
              {payoutForm.id && (
                <Button
                  onClick={() => setIsEditingPayout(false)}
                  variant="ghost"
                  className="rounded-xl px-6"
                >
                  Cancel
                </Button>
              )}
            </div>
          )}
        </CardFooter>
      )}
    </Card>
  );
};

export default PaymentMethodsTab;
