'use client';

import React, { useState, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import {
  AlertCircle,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Loader2,
  ChevronRight,
  Phone,
  Wallet,
  User,
  Building2,
  ShieldCheck,
} from 'lucide-react';
import { toast } from 'sonner';
import { useSystemConfig } from '@/hooks/useHasuraApi';

// ─── Types ───────────────────────────────────────────────────────────────────

export interface WithdrawRequestData {
  kind: 'withdraw';
  id: string;
  amount: string;
  status: string;
  phoneNumber: string;
  created_at: string;
  shopper_id?: string;
  shopperWallet_id?: string;
  business_id?: string;
  businessWallet_id?: string;
  shoppers?: {
    full_name: string;
    phone_number: string;
    profile_photo?: string;
    User?: {
      Wallets?: { id: string; available_balance: string; reserved_balance: string }[];
    };
  };
  business_wallets?: { amount: string };
  business_accounts?: {
    business_name: string;
    business_phone: string;
    business_email: string;
    account_type: string;
  };
}

export interface PayoutData {
  kind: 'payout';
  id: string;
  amount: string;
  status: string;
  created_at: string;
  user_id: string;
  wallet_id: string;
  Wallets?: {
    id: string;
    available_balance: string;
    reserved_balance: string;
    shopper_id: string;
    User?: {
      name: string;
      email: string;
      phone: string;
      profile_picture?: string;
    };
    Wallet_Transactions?: {
      id: string;
      amount: string;
      type: string;
      status: string;
      description?: string;
      created_at: string;
    }[];
  };
}

export type RequestItem = WithdrawRequestData | PayoutData;

interface Props {
  open: boolean;
  onClose: () => void;
  item: RequestItem | null;
  session: { TwoAuth_enabled?: boolean; email?: string } | null;
  onSuccess: () => void;
}

type Step = 'review' | 'twofa' | 'otp' | 'confirm';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatAmt(value: string | number, currency = 'RWF') {
  const num = parseFloat(String(value));
  if (isNaN(num)) return String(value);
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
}

// ─── Component ───────────────────────────────────────────────────────────────

const WithdrawRequestApprovalDialog = ({ open, onClose, item, session, onSuccess }: Props) => {
  const { data: configData } = useSystemConfig();
  const cfg = configData?.System_configuratioins?.[0];
  const currency = cfg?.currency ?? 'RWF';
  const withdrawChargesPct = parseFloat(String(cfg?.withDrawCharges ?? '0'));

  const [step, setStep] = useState<Step>('review');
  const [otpCode, setOtpCode] = useState('');
  const [generatedOtp, setGeneratedOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejectLoading, setRejectLoading] = useState(false);

  // ── Derived display values ────────────────────────────────────────────────
  const isWithdraw = item?.kind === 'withdraw';
  const isPayout = item?.kind === 'payout';

  const isBusiness = isWithdraw && !!(item as WithdrawRequestData).business_id;
  const amount = parseFloat(item?.amount ?? '0');
  const fee = isBusiness ? (amount * withdrawChargesPct) / 100 : 0;
  const netPayout = amount - fee;

  let name = 'Unknown';
  let phone = '—';
  let walletBalance = 0;

  if (isWithdraw) {
    const wd = item as WithdrawRequestData;
    name = isBusiness
      ? (wd.business_accounts?.business_name ?? 'Business')
      : (wd.shoppers?.full_name ?? 'Unknown Shopper');
    phone =
      wd.phoneNumber ||
      (isBusiness ? wd.business_accounts?.business_phone : wd.shoppers?.phone_number) ||
      '—';
    walletBalance = isBusiness
      ? parseFloat(wd.business_wallets?.amount ?? '0')
      : parseFloat(wd.shoppers?.User?.Wallets?.[0]?.available_balance ?? '0');
  } else if (isPayout) {
    const po = item as PayoutData;
    name = po.Wallets?.User?.name ?? 'Unknown User';
    phone = po.Wallets?.User?.phone ?? '—';
    walletBalance = parseFloat(po.Wallets?.available_balance ?? '0');
  }

  // ── Reset on close ────────────────────────────────────────────────────────
  const handleClose = useCallback(() => {
    setStep('review');
    setOtpCode('');
    setGeneratedOtp('');
    setLoading(false);
    setRejectLoading(false);
    onClose();
  }, [onClose]);

  // ── Reject ────────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!item) return;
    setRejectLoading(true);
    try {
      const endpoint = isPayout
        ? '/api/mutations/approve-payout'
        : '/api/mutations/approve-withdraw-request';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action: 'rejected' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Rejection failed');
      toast.success(isPayout ? 'Payout rejected.' : 'Withdraw request rejected.');
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setRejectLoading(false);
    }
  };

  // ── Proceed from review ───────────────────────────────────────────────────
  const handleProceedFromReview = () => {
    if (!session?.TwoAuth_enabled) {
      setStep('twofa');
    } else {
      handleSendOtp();
    }
  };

  // ── Send OTP (simulated) ──────────────────────────────────────────────────
  const handleSendOtp = () => {
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(code);
    setStep('otp');
    toast.info(`OTP code: ${code}`, {
      description: 'In production this would be sent via SMS to your registered number.',
      duration: 60000,
    });
  };

  // ── Verify OTP ────────────────────────────────────────────────────────────
  const handleVerifyOtp = () => {
    if (otpCode.trim() === generatedOtp) {
      setStep('confirm');
    } else {
      toast.error('Invalid OTP. Please try again.');
    }
  };

  // ── Confirm approval ──────────────────────────────────────────────────────
  const handleConfirmApprove = async () => {
    if (!item) return;
    setLoading(true);
    try {
      const endpoint = isPayout
        ? '/api/mutations/approve-payout'
        : '/api/mutations/approve-withdraw-request';
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: item.id, action: 'approved' }),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || 'Approval failed');
      toast.success(isPayout ? 'Payout approved!' : 'Withdraw request approved!');
      onSuccess();
      handleClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setLoading(false);
    }
  };

  if (!item) return null;

  const insufficient = walletBalance < amount;
  const typeLabel = isPayout ? 'Payout' : isBusiness ? 'Business Withdrawal' : 'Shopper Withdrawal';

  return (
    <Dialog open={open} onOpenChange={open => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        {/* ── STEP 1: REVIEW ──────────────────────────────────────────────── */}
        {step === 'review' && (
          <>
            <DialogHeader>
              <DialogTitle>Review {typeLabel}</DialogTitle>
              <DialogDescription>
                Review the details before approving or rejecting.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              {/* Requester card */}
              <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                  {isBusiness ? (
                    <Building2 className="h-5 w-5 text-primary" />
                  ) : (
                    <User className="h-5 w-5 text-primary" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{name}</div>
                  <div className="flex items-center gap-1 text-sm text-muted-foreground">
                    <Phone className="h-3 w-3 shrink-0" />
                    Sending to: <strong className="text-foreground ml-1">{phone}</strong>
                  </div>
                </div>
                <Badge variant="secondary" className="capitalize shrink-0">
                  {typeLabel}
                </Badge>
              </div>

              {/* Amount breakdown */}
              <div className="rounded-lg border p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Requested Amount</span>
                  <span className="font-semibold text-lg">{formatAmt(amount, currency)}</span>
                </div>
                {isBusiness && withdrawChargesPct > 0 && (
                  <>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        Withdraw Charge ({withdrawChargesPct}%)
                      </span>
                      <span className="text-red-500">− {formatAmt(fee, currency)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center font-semibold">
                      <span>Net Payout</span>
                      <span className="text-green-600">{formatAmt(netPayout, currency)}</span>
                    </div>
                  </>
                )}
                <Separator />
                <div className="flex justify-between items-center text-sm">
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <Wallet className="h-3.5 w-3.5" />
                    Current Wallet Balance
                  </span>
                  <span className={insufficient ? 'text-red-500 font-medium' : 'font-medium'}>
                    {formatAmt(walletBalance, currency)}
                  </span>
                </div>
                {insufficient && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-md p-2">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    Insufficient balance – cannot approve this request.
                  </div>
                )}
              </div>

              {/* Payout transaction history */}
              {isPayout && (item as PayoutData).Wallets?.Wallet_Transactions?.length ? (
                <div className="rounded-lg border p-3 space-y-2">
                  <p className="text-xs font-medium uppercase text-muted-foreground tracking-wider">
                    Recent Transactions
                  </p>
                  <div className="space-y-1 max-h-32 overflow-y-auto">
                    {(item as PayoutData).Wallets!.Wallet_Transactions!.slice(0, 5).map(tx => (
                      <div
                        key={tx.id}
                        className="flex justify-between text-xs py-1 border-b last:border-0"
                      >
                        <span className="text-muted-foreground capitalize">{tx.type}</span>
                        <span className={tx.type === 'credit' ? 'text-green-600' : 'text-red-600'}>
                          {formatAmt(tx.amount, currency)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                className="text-red-500 hover:bg-red-50 border-red-200"
                onClick={handleReject}
                disabled={rejectLoading}
              >
                {rejectLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1" />
                ) : (
                  <XCircle className="h-4 w-4 mr-1" />
                )}
                Reject
              </Button>
              <Button onClick={handleProceedFromReview} disabled={insufficient}>
                Proceed to Confirm <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP 2: 2FA GATE ────────────────────────────────────────────── */}
        {step === 'twofa' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-amber-600">
                <ShieldAlert className="h-5 w-5" />
                Two-Factor Authentication Required
              </DialogTitle>
              <DialogDescription>You must enable 2FA before approving payouts.</DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 text-sm text-amber-900 space-y-2">
                <p className="font-medium">Your account does not have 2FA enabled.</p>
                <p>
                  Enable Two-Factor Authentication in your account settings, then return to approve
                  this request.
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleClose}>
                Close
              </Button>
              <Button asChild>
                <a href="/project-users" target="_blank" rel="noreferrer">
                  <ShieldCheck className="h-4 w-4 mr-1" /> Go to Settings
                </a>
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP 3: OTP ─────────────────────────────────────────────────── */}
        {step === 'otp' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Enter OTP to Confirm
              </DialogTitle>
              <DialogDescription>
                Check the notification for your one-time code and enter it below.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
                <strong>Note:</strong> OTP shown in the toast (development mode). In production this
                would arrive via SMS.
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">6-Digit OTP Code</label>
                <Input
                  placeholder="000000"
                  maxLength={6}
                  value={otpCode}
                  onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                />
              </div>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('review')}>
                Back
              </Button>
              <Button onClick={handleVerifyOtp} disabled={otpCode.length !== 6}>
                Verify OTP <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </DialogFooter>
          </>
        )}

        {/* ── STEP 4: CONFIRM ─────────────────────────────────────────────── */}
        {step === 'confirm' && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600">
                <CheckCircle2 className="h-5 w-5" />
                Confirm Transfer
              </DialogTitle>
              <DialogDescription>
                Final confirmation before the transfer is processed.
              </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-4">
              <div className="rounded-lg border p-4 space-y-3 bg-muted/30">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recipient</span>
                  <span className="font-medium">{name}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Sending to</span>
                  <span className="font-medium">{phone}</span>
                </div>
                <Separator />
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Requested Amount</span>
                  <span>{formatAmt(amount, currency)}</span>
                </div>
                {isBusiness && fee > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Fee ({withdrawChargesPct}%)</span>
                    <span className="text-red-500">− {formatAmt(fee, currency)}</span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>Net Payout</span>
                  <span className="text-green-600">
                    {formatAmt(isBusiness ? netPayout : amount, currency)}
                  </span>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">
                Confirming will immediately deduct this amount from the wallet.
              </p>
            </div>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => setStep('otp')}>
                Back
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={handleConfirmApprove}
                disabled={loading}
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-1.5" />
                ) : (
                  <CheckCircle2 className="h-4 w-4 mr-1.5" />
                )}
                Confirm Transfer
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawRequestApprovalDialog;
