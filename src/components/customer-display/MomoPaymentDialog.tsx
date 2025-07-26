'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Phone, QrCode, Copy, Check } from "lucide-react";
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
      // Use a simple text format with clear instructions
      // This ensures the QR code is recognized as text and customer can copy/dial manually
      const qrText = `MOMO Payment Code:\n${ussdCode}\n\nDial this code to pay ${formatCurrencyWithConfig(total, systemConfig)}`;
      
      QRCode.toDataURL(qrText, {
        width: 200,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        },
        errorCorrectionLevel: 'M'
      })
      .then(url => {
        setQrCodeDataUrl(url);
      })
      .catch(err => {
        console.error('Error generating QR code:', err);
      });
    }
  }, [isOpen, ussdCode, total, systemConfig]);

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
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold">
            Mobile Money Payment
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Payment Amount */}
          <Card className="border-2 border-green-500">
            <CardContent className="p-6 text-center">
              <div className="text-sm text-gray-600 mb-2">Amount to Pay</div>
              <div className="text-3xl font-bold text-green-600">
                {formatCurrencyWithConfig(total, systemConfig)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                Transaction ID: {transactionId}
              </div>
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
                    className="mx-auto w-32 h-32"
                  />
                  <p className="text-sm text-gray-600">
                    Scan QR code to copy the USSD code
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <QrCode className="h-32 w-32 mx-auto text-gray-400" />
                  <p className="text-sm text-gray-600">
                    Generating QR code...
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* USSD Code */}
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Phone className="h-5 w-5 text-green-600" />
                  <span className="text-sm font-medium text-green-800">USSD Code:</span>
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800">
                  MOMO
                </Badge>
              </div>
              
              <div className="mt-3 p-3 bg-white rounded border border-green-300">
                <div className="font-mono text-lg text-center text-green-700 font-bold">
                  {ussdCode}
                </div>
              </div>

              <Button
                onClick={copyToClipboard}
                variant="outline"
                size="sm"
                className="w-full mt-3 border-green-300 text-green-700 hover:bg-green-50"
              >
                {copied ? (
                  <>
                    <Check className="h-4 w-4 mr-2" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="h-4 w-4 mr-2" />
                    Copy USSD Code
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Instructions */}
          <div className="space-y-3">
            <h4 className="font-semibold text-gray-800">How to Pay:</h4>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  1
                </div>
                <span>Scan the QR code to copy the USSD code, then dial it manually</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  2
                </div>
                <span>Enter your MOMO PIN when prompted</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  3
                </div>
                <span>Confirm the payment amount</span>
              </div>
              <div className="flex items-start gap-2">
                <div className="w-5 h-5 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs font-bold mt-0.5">
                  4
                </div>
                <span>Wait for payment confirmation SMS</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={copyToClipboard}
              variant="outline"
              className="w-full border-green-300 text-green-700 hover:bg-green-50"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </Button>
            <Button
              onClick={onPaymentConfirmed}
              className="w-full bg-green-600 hover:bg-green-700"
            >
              Payment Completed
            </Button>
          </div>

          {/* Footer Note */}
          <div className="text-center text-xs text-gray-500">
            Complete the payment to proceed
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 