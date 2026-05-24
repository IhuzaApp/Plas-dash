import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Clock,
  CheckCircle,
  Trash,
  RotateCcw,
  User,
  Timer,
  FileText,
  ShoppingBag,
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import { formatCurrencyWithConfig } from '@/lib/utils';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface PendingCheckout {
  id: string;
  items: CartItem[];
  timestamp: Date;
  customerName?: string;
  status: 'pending' | 'processing';
  total: number;
}

interface PendingCheckoutsTabProps {
  pendingCheckouts: PendingCheckout[];
  onViewDetails: (id: string) => void;
  onCompleteCheckout: (id: string) => void;
  onDeleteCheckout: (id: string) => void;
  onLoadCheckout: (id: string) => void;
  hasDeleteAction: boolean;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'pending':
      return (
        <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400 border-none px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
          <Clock className="mr-1.5 h-3 w-3" /> Pending
        </Badge>
      );
    case 'processing':
      return (
        <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400 border-none px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider">
          <RotateCcw className="mr-1.5 h-3 w-3 animate-spin-slow" /> Processing
        </Badge>
      );
    default:
      return null;
  }
};

export const PendingCheckoutsTab: React.FC<PendingCheckoutsTabProps> = ({
  pendingCheckouts,
  onViewDetails,
  onCompleteCheckout,
  onDeleteCheckout,
  onLoadCheckout,
  hasDeleteAction,
}) => {
  const { data: systemConfig } = useSystemConfig();

  const getTimeRemaining = (timestamp: Date) => {
    const now = new Date();
    const checkoutTime = new Date(timestamp);
    const hoursDiff = (now.getTime() - checkoutTime.getTime()) / (1000 * 60 * 60);
    const hoursRemaining = Math.max(0, 24 - hoursDiff);

    if (hoursRemaining < 1) {
      const minutesRemaining = Math.floor(hoursRemaining * 60);
      return `${minutesRemaining}m remaining`;
    } else {
      return `${Math.floor(hoursRemaining)}h remaining`;
    }
  };

  return (
    <Card className="border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md shadow-lg min-h-[500px] flex flex-col">
      <CardHeader className="border-b border-slate-100 dark:border-slate-900 pb-5 shrink-0">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg font-black text-slate-800 dark:text-slate-100 tracking-tight">
            <FileText className="h-5 w-5 text-primary" />
            Pending Checkouts
            <Badge className="ml-2 bg-primary/10 text-primary border-none text-[10px] font-extrabold px-2 py-0.5">
              {pendingCheckouts.length} Active
            </Badge>
          </CardTitle>
          <p className="text-xs font-bold text-slate-400 hidden sm:block">
            Manage paused and drafted orders
          </p>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-6">
        {pendingCheckouts.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
            <div className="h-20 w-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
              <ShoppingBag className="h-10 w-10 opacity-30" />
            </div>
            <div className="text-center">
              <p className="font-extrabold text-sm text-slate-600 dark:text-slate-300">
                No pending checkouts
              </p>
              <p className="text-xs mt-1 max-w-[200px] mx-auto">
                Paused transactions will appear here for you to resume later.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {pendingCheckouts.map(checkout => (
              <div
                key={checkout.id}
                className="group flex flex-col bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 hover:border-primary/30"
              >
                {/* Card Header Section */}
                <div className="bg-slate-50/80 dark:bg-slate-900/50 p-4 border-b border-slate-100 dark:border-slate-800/80 flex justify-between items-start">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <h3 className="font-black text-sm text-slate-800 dark:text-slate-100 font-mono tracking-tight">
                        #{checkout.id}
                      </h3>
                      {getStatusBadge(checkout.status)}
                    </div>
                    <div className="flex items-center text-[11px] text-slate-400 font-semibold uppercase tracking-wider">
                      <Clock className="h-3 w-3 mr-1.5 opacity-70" />
                      {new Date(checkout.timestamp).toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-black text-primary tracking-tight">
                      {formatCurrencyWithConfig(checkout.total, systemConfig)}
                    </div>
                    <div className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                      {checkout.items.length} {checkout.items.length === 1 ? 'Item' : 'Items'}
                    </div>
                  </div>
                </div>

                {/* Body Section */}
                <div className="p-4 flex-1 flex flex-col justify-center space-y-4">
                  {checkout.customerName ? (
                    <div className="flex items-center text-sm font-bold text-slate-700 dark:text-slate-200">
                      <div className="h-8 w-8 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center mr-3">
                        <User className="h-4 w-4" />
                      </div>
                      {checkout.customerName}
                    </div>
                  ) : (
                    <div className="flex items-center text-sm font-bold text-slate-400 italic">
                      <div className="h-8 w-8 rounded-full bg-slate-100 dark:bg-slate-800/50 text-slate-400 flex items-center justify-center mr-3">
                        <User className="h-4 w-4 opacity-50" />
                      </div>
                      Walk-in Customer
                    </div>
                  )}

                  <div className="flex items-center">
                    <Badge
                      variant="outline"
                      className={`border-none px-3 py-1.5 text-[10px] uppercase tracking-wider font-extrabold flex items-center gap-1.5 rounded-lg ${
                        checkout.status === 'pending'
                          ? 'bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400'
                          : 'bg-slate-50 text-slate-500 dark:bg-slate-900 dark:text-slate-400'
                      }`}
                    >
                      <Timer className="h-3.5 w-3.5" />
                      {getTimeRemaining(checkout.timestamp)}
                    </Badge>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="p-3 bg-slate-50/50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:flex sm:flex-row gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewDetails(checkout.id)}
                    className="text-[11px] font-bold h-9 w-full sm:flex-1 bg-white dark:bg-slate-950"
                  >
                    View Details
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onLoadCheckout(checkout.id)}
                    className="text-[11px] font-bold h-9 w-full sm:flex-1 bg-white dark:bg-slate-950 text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-900/50 dark:hover:bg-blue-900/20"
                  >
                    <RotateCcw className="h-3.5 w-3.5 mr-1.5" /> Load
                  </Button>
                  {hasDeleteAction && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-[11px] font-bold h-9 w-full sm:flex-1 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950 border-red-200 dark:border-red-900 bg-white dark:bg-slate-950"
                      onClick={() => onDeleteCheckout(checkout.id)}
                    >
                      <Trash className="h-3.5 w-3.5 mr-1.5" /> Delete
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onCompleteCheckout(checkout.id)}
                    className="text-[11px] font-bold h-9 w-full sm:flex-1 bg-primary hover:bg-primary/90 text-white shadow-md shadow-primary/20"
                  >
                    <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Pay Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
