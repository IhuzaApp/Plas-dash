import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Wallet, Clock, Eye, Check, X, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

interface ShopperWalletTabProps {
  wallet: any;
  totalEarnings: number;
  formatCurrency: (amount: string) => string;
  withdrawRequests?: any[];
  pendingWithdrawAmount?: number;
  withdrawRequestsCount?: number;
  onApproveWithdraw?: (id: string) => Promise<void>;
  onRejectWithdraw?: (id: string) => Promise<void>;
}

const ShopperWalletTab: React.FC<ShopperWalletTabProps> = ({
  wallet,
  totalEarnings,
  formatCurrency,
  withdrawRequests = [],
  pendingWithdrawAmount = 0,
  withdrawRequestsCount = 0,
  onApproveWithdraw,
  onRejectWithdraw,
}) => {
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofOpen, setProofOpen] = useState(false);
  const [actionId, setActionId] = useState<string | null>(null);

  const handleViewProof = (verification_image: string | null) => {
    if (verification_image) setProofImage(verification_image);
    else setProofImage(null);
    setProofOpen(true);
  };

  const handleApprove = async (id: string) => {
    if (!onApproveWithdraw) return;
    setActionId(id);
    try {
      await onApproveWithdraw(id);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!onRejectWithdraw) return;
    setActionId(id);
    try {
      await onRejectWithdraw(id);
    } finally {
      setActionId(null);
    }
  };

  const walletBalance = wallet
    ? `${formatCurrency(wallet.available_balance || '0')} available, ${formatCurrency(wallet.reserved_balance || '0')} reserved`
    : '—';

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(wallet?.available_balance || '0')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Reserved Balance</CardTitle>
            <Wallet className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(wallet?.reserved_balance || '0')}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Earnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(totalEarnings.toString())}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Withdraw</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(String(pendingWithdrawAmount))}</div>
            <p className="text-xs text-muted-foreground">{withdrawRequestsCount} pending request(s)</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Withdraw requests</CardTitle>
          <p className="text-sm text-muted-foreground">Wallet: {walletBalance}</p>
        </CardHeader>
        <CardContent>
          {withdrawRequests.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No withdraw requests.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Wallet balance</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawRequests.map((req: any) => {
                  const raw = req.Wallets ?? req.Wallet ?? req.wallets ?? req.wallet;
                  const w = Array.isArray(raw) ? raw[0] : raw;
                  const available = w ? formatCurrency(w.available_balance || '0') : '—';
                  const reserved = w ? formatCurrency(w.reserved_balance || '0') : '—';
                  const isPending = (req.status || '').toLowerCase() === 'pending';
                  const busy = actionId === req.id;
                  return (
                    <TableRow key={req.id}>
                      <TableCell className="font-medium">{formatCurrency(String(req.amount))}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            isPending ? 'secondary' : (req.status || '').toLowerCase() === 'approved' ? 'default' : 'destructive'
                          }
                          className="capitalize"
                        >
                          {req.status || '—'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {req.update_at
                          ? format(new Date(req.update_at), 'MMM d, yyyy HH:mm')
                          : req.created_at
                            ? format(new Date(req.created_at), 'MMM d, yyyy HH:mm')
                            : '—'}
                      </TableCell>
                      <TableCell>{req.phoneNumber || '—'}</TableCell>
                      <TableCell className="text-xs">
                        {available} / {reserved}
                      </TableCell>
                      <TableCell className="text-right">
                        {req.verification_image && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="mr-1"
                            onClick={() => handleViewProof(req.verification_image)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        {isPending && onApproveWithdraw && (
                          <Button
                            variant="default"
                            size="sm"
                            className="mr-1"
                            disabled={busy}
                            onClick={() => handleApprove(req.id)}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          </Button>
                        )}
                        {isPending && onRejectWithdraw && (
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={busy}
                            onClick={() => handleReject(req.id)}
                          >
                            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={proofOpen} onOpenChange={setProofOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Proof / Verification image</DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-muted/30 rounded-lg p-4">
            {proofImage ? (
              typeof proofImage === 'string' && proofImage.startsWith('data:') ? (
                <img src={proofImage} alt="Verification" className="max-h-[70vh] max-w-full object-contain" />
              ) : (
                <img src={proofImage} alt="Verification" className="max-h-[70vh] max-w-full object-contain" />
              )
            ) : (
              <p className="text-muted-foreground">No image</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopperWalletTab;
