'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Phone, Check, Smartphone, Loader2, Copy } from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';
import QRCode from 'qrcode';

interface MomoPaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentConfirmed: () => void;
  total: number;
  transactionId: string;
}

export default function MomoPaymentDialog({
  isOpen,
  onClose,
  onPaymentConfirmed,
  total,
  transactionId,
}: MomoPaymentDialogProps) {
  const { data: systemConfig } = useSystemConfig();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Generate USSD code for MOMO payment
  const generateUssdCode = () => {
    // Format: *182*8*1*0000*amount#
    const amount = Math.round(total); // Remove decimals for USSD
    return `*182*8*1*1426640*${amount}#`;
  };

  const ussdCode = generateUssdCode();

  // Generate QR code when component mounts or USSD code changes
  useEffect(() => {
    if (isOpen && ussdCode) {
      // Use tel: protocol with URL encoding to ensure complete USSD code is dialed
      const telUrl = `tel:${encodeURIComponent(ussdCode)}`;
      QRCode.toDataURL(telUrl, {
        width: 250,
        margin: 2,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
        errorCorrectionLevel: 'M',
      })
        .then(url => {
          setQrCodeDataUrl(url);
        })
        .catch(err => {
          console.error('Error generating QR code:', err);
        });
    }
  }, [isOpen, ussdCode]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(ussdCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy: ', err);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md rounded-3xl border-0 p-6 shadow-2xl bg-white dark:bg-slate-900">
        <DialogHeader className="pb-2 text-center">
          <div className="mx-auto w-12 h-12 bg-amber-500/10 text-amber-500 rounded-full flex items-center justify-center mb-3">
            <Smartphone className="h-6 w-6 animate-pulse" />
          </div>
          <DialogTitle className="text-xl font-black text-slate-900 dark:text-white">
            Mobile Money Pay
          </DialogTitle>
          <p className="text-xs font-semibold text-slate-400">
            Scan QR code or dial the USSD below to complete payment
          </p>
        </DialogHeader>

        <div className="space-y-5 pt-2">
          {/* Amount Card */}
          <div className="bg-gradient-to-br from-amber-500 to-yellow-500 text-white rounded-2xl p-5 text-center shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full blur-xl translate-x-8 -translate-y-8"></div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-white/80 mb-1">
              Amount Due
            </div>
            <div className="text-3xl font-black tracking-tight">
              {formatCurrencyWithConfig(total, systemConfig)}
            </div>
            <div className="text-[10px] font-mono text-white/70 mt-1">
              Ref: {transactionId}
            </div>
          </div>

          {/* QR Code Section */}
          <div className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 relative">
            {qrCodeDataUrl ? (
              <div className="space-y-3 flex flex-col items-center">
                <div className="relative p-3 bg-white dark:bg-white rounded-xl shadow-sm border border-slate-100">
                  {/* Viewfinder Corners */}
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-amber-500 rounded-tl-lg"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-amber-500 rounded-tr-lg"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-amber-500 rounded-bl-lg"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-amber-500 rounded-br-lg"></div>

                  <img
                    src={qrCodeDataUrl}
                    alt="MOMO Payment QR Code"
                    className="w-40 h-40 object-contain"
                  />
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">
                  Scan QR with your MoMo App
                </span>
              </div>
            ) : (
              <div className="py-10 flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 text-amber-500 animate-spin" />
                <span className="text-xs text-slate-400 font-semibold">Generating QR Code...</span>
              </div>
            )}
          </div>

          {/* USSD Code Section */}
          <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl border border-slate-100 dark:border-slate-800/80 p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <Phone className="h-4 w-4 text-amber-500" />
                <span className="text-xs font-bold">Or dial USSD Code:</span>
              </div>
              <Badge className="bg-amber-500/10 text-amber-600 dark:text-amber-400 border-0 text-[10px] font-bold px-2 py-0.5 rounded-full">
                MTN MoMo
              </Badge>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2.5 rounded-xl text-center font-mono font-bold text-base text-slate-850 dark:text-slate-200 tracking-wider">
                {ussdCode}
              </div>
              <Button
                type="button"
                onClick={copyToClipboard}
                size="icon"
                className="h-[42px] w-[42px] shrink-0 rounded-xl bg-amber-500 hover:bg-amber-600 text-white shadow-md border-0"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Awaiting network validation message */}
          <div className="flex items-center justify-center gap-2 py-1 text-[11px] text-slate-400 font-bold">
            <Loader2 className="h-3.5 w-3.5 text-amber-500 animate-spin" />
            <span>Waiting for payment confirmation...</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
