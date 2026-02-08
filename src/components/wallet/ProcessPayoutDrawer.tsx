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
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Loader2, CheckCircle2, XCircle, ImageIcon, Eye } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
        status === 'approved'
          ? 'Withdrawal approved successfully.'
          : 'Withdrawal rejected.'
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
      <Drawer>
        <DrawerTrigger asChild>{children}</DrawerTrigger>
        <DrawerContent className="max-h-[85vh]">
          <div className="mx-auto w-full max-w-2xl">
            <DrawerHeader>
              <DrawerTitle>Process Payouts</DrawerTitle>
              <DrawerDescription>
                Pending withdrawal requests. Approve or reject each request.
              </DrawerDescription>
            </DrawerHeader>

            <div className="px-4 pb-2">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : requests.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  No pending withdrawal requests.
                </div>
              ) : (
                <ScrollArea className="h-[55vh] pr-2">
                  <div className="space-y-3">
                    {requests.map((req: any) => {
                      const wallet = Array.isArray(req.Wallets)
                        ? req.Wallets[0]
                        : req.Wallets;
                      const user = wallet?.User;
                      const busy = actionId === req.id;

                      return (
                        <div
                          key={req.id}
                          className="rounded-lg border p-4 space-y-3"
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
                                <div className="font-medium truncate">
                                  {user?.name ?? 'Unknown'}
                                </div>
                                <div className="text-xs text-muted-foreground truncate">
                                  {user?.email ?? '—'}
                                  {user?.phone ? ` · ${user.phone}` : ''}
                                </div>
                              </div>
                            </div>
                            <Badge className="bg-yellow-100 text-yellow-800 shrink-0">
                              Pending
                            </Badge>
                          </div>

                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                            <div>
                              <span className="text-muted-foreground">Amount</span>
                              <div className="font-semibold">
                                {formatCurrency(String(req.amount))}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Phone</span>
                              <div>{req.phoneNumber || '—'}</div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Wallet balance</span>
                              <div>
                                {wallet
                                  ? formatCurrency(wallet.available_balance || '0')
                                  : '—'}
                              </div>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Requested</span>
                              <div>
                                {req.created_at
                                  ? formatDistanceToNow(new Date(req.created_at), {
                                      addSuffix: true,
                                    })
                                  : '—'}
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1">
                            <div>
                              {req.verification_image && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() =>
                                    handleViewProof(req.verification_image)
                                  }
                                  className="text-muted-foreground"
                                >
                                  <Eye className="h-4 w-4 mr-1" /> View proof
                                </Button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                disabled={busy}
                                onClick={() => handleAction(req.id, 'rejected')}
                              >
                                {busy && actionId === req.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <XCircle className="h-4 w-4 mr-1" />
                                )}
                                Reject
                              </Button>
                              <Button
                                size="sm"
                                className="bg-green-600 hover:bg-green-700 text-white"
                                disabled={busy}
                                onClick={() => handleAction(req.id, 'approved')}
                              >
                                {busy && actionId === req.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                                ) : (
                                  <CheckCircle2 className="h-4 w-4 mr-1" />
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

            <DrawerFooter>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>

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
