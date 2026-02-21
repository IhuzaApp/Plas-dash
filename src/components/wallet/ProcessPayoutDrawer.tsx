import React, { useState } from 'react';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, XCircle, ImageIcon, Eye } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { usePendingWithdrawRequests, useSystemConfig } from '@/hooks/useHasuraApi';
import { format, formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

interface ProcessPayoutDrawerProps {
  children: React.ReactNode;
}

const ProcessPayoutDrawer = ({ children }: ProcessPayoutDrawerProps) => {
  const { data, isLoading, refetch } = usePendingWithdrawRequests();
  const { data: systemConfig } = useSystemConfig();
  const requests = data?.withDraweRequest ?? [];
  const [actionId, setActionId] = useState<string | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);

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

  const handleAction = async (id: string, status: 'approved' | 'rejected') => {
    setActionId(id);
    try {
      const res = await fetch('/api/mutations/update-withdraw-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        throw new Error(result.error || 'Failed to update');
      }
      toast.success(
        status === 'approved' ? 'Withdrawal approved successfully.' : 'Withdrawal rejected.'
      );
      refetch();
    } catch (err: any) {
      toast.error(err.message || 'Action failed.');
    } finally {
      setActionId(null);
    }
  };

  const handleViewProof = (img: string | null) => {
    if (img) {
      setProofImage(img);
      setProofOpen(true);
    }
  };

  return (
    <>
      <Sheet>
        <SheetTrigger asChild>{children}</SheetTrigger>
        <SheetContent side="right" className="sm:max-w-[600px] flex flex-col h-full p-0">
          <SheetHeader className="p-6 border-b">
            <SheetTitle>Process Payouts</SheetTitle>
            <SheetDescription>
              Pending withdrawal requests. Approve or reject each request.
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 min-h-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : requests.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No pending withdrawal requests.
              </div>
            ) : (
              <ScrollArea className="h-full">
                <div className="p-6 space-y-4">
                  {requests.map((req: any) => {
                    const wallet = Array.isArray(req.Wallets) ? req.Wallets[0] : req.Wallets;
                    const user = wallet?.User;
                    const busy = actionId === req.id;

                    return (
                      <div
                        key={req.id}
                        className="rounded-lg border p-4 space-y-3 bg-card shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-3 min-w-0">
                            {user?.profile_picture ? (
                              <img
                                src={user.profile_picture}
                                alt=""
                                className="h-10 w-10 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-xs font-medium shrink-0">
                                {(user?.name ?? '?')[0]}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="font-medium truncate">{user?.name ?? 'Unknown'}</div>
                              <div className="text-xs text-muted-foreground truncate">
                                {user?.email ?? '—'}
                                {user?.phone ? ` · ${user.phone}` : ''}
                              </div>
                            </div>
                          </div>
                          <Badge className="bg-yellow-100 text-yellow-800 shrink-0 border-yellow-200">
                            Pending
                          </Badge>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm bg-muted/30 p-3 rounded-md">
                          <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                              Amount
                            </span>
                            <div className="font-semibold text-lg">
                              {formatCurrency(String(req.amount))}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                              Phone
                            </span>
                            <div className="font-medium">{req.phoneNumber || '—'}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                              Wallet Balance
                            </span>
                            <div className="font-medium">
                              {wallet ? formatCurrency(wallet.available_balance || '0') : '—'}
                            </div>
                          </div>
                          <div>
                            <span className="text-muted-foreground block text-xs uppercase tracking-wider">
                              Requested
                            </span>
                            <div className="font-medium">
                              {req.created_at
                                ? formatDistanceToNow(new Date(req.created_at), {
                                    addSuffix: true,
                                  })
                                : '—'}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between gap-2 pt-2 border-t">
                          <div>
                            {req.verification_image && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewProof(req.verification_image)}
                                className="text-primary hover:text-primary hover:bg-primary/10 h-8 font-medium"
                              >
                                <Eye className="h-4 w-4 mr-1.5" /> View proof
                              </Button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-red-500 hover:text-white hover:bg-red-500 h-8"
                              disabled={busy}
                              onClick={() => handleAction(req.id, 'rejected')}
                            >
                              {busy && actionId === req.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <XCircle className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Reject
                            </Button>
                            <Button
                              size="sm"
                              className="bg-green-600 hover:bg-green-700 text-white h-8"
                              disabled={busy}
                              onClick={() => handleAction(req.id, 'approved')}
                            >
                              {busy && actionId === req.id ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" />
                              ) : (
                                <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                              )}
                              Approve
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </div>

          <SheetFooter className="p-6 border-t">
            <SheetClose asChild>
              <Button variant="outline" className="w-full">
                Close
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Verification proof</DialogTitle>
          </DialogHeader>
          {proofImage && (
            <img
              src={proofImage}
              alt="Verification"
              className="w-full rounded-md object-contain max-h-[60vh]"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ProcessPayoutDrawer;
