'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Phone, QrCode, Copy, Check } from 'lucide-react';
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
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF',
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
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">Mobile Money Payment</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Amount */}
          <Card className="border-2 border-black">
            <CardContent className="p-6 text-center">
              <div className="text-base text-gray-600 mb-2">Amount to Pay</div>
              <div className="text-3xl font-bold text-black">
                {formatCurrencyWithConfig(total, systemConfig)}
              </div>
              <div className="text-sm text-gray-500 mt-1">Transaction ID: {transactionId}</div>
            </CardContent>
          </Card>

          {/* QR Code Section */}
          <div className="text-center">
            <div className="bg-gray-100 p-6 rounded-lg border-2 border-dashed border-gray-300">
              {qrCodeDataUrl ? (
                <div className="space-y-4">
                  <img
                    src={qrCodeDataUrl}
                    alt="MOMO Payment QR Code"
                    className="mx-auto w-40 h-40"
                  />
                  <p className="text-sm text-gray-600">
                    Scan QR code - phone will open dialer with complete USSD code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <QrCode className="h-40 w-40 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">Generating QR code...</p>
                </div>
              )}
            </div>
          </div>

          {/* USSD Code */}
          <Card className="bg-gray-50 border-gray-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-black" />
                  <span className="text-sm font-medium text-black">USSD Code:</span>
                </div>
                <Badge variant="secondary" className="bg-gray-100 text-black text-sm px-2 py-1">
                  MOMO
                </Badge>
              </div>

              <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                <div className="font-mono text-lg text-center text-black font-bold">{ussdCode}</div>
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Footer Note */}
          <div className="text-center text-xs text-gray-500">Review payment details above</div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
