import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface TransactionDetailsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: any;
  formatCurrency: (amount: string) => string;
}

const getTypeBadge = (type: string) => {
  const typeLower = type.toLowerCase();
  switch (typeLower) {
    case 'reserve':
      return 'bg-blue-100 text-blue-800';
    case 'earnings':
      return 'bg-green-100 text-green-800';
    case 'payment':
      return 'bg-purple-100 text-purple-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getStatusBadge = (status: string) => {
  const statusLower = status.toLowerCase();
  switch (statusLower) {
    case 'completed':
    case 'success':
      return 'bg-green-100 text-green-800';
    case 'pending':
      return 'bg-yellow-100 text-yellow-800';
    case 'failed':
      return 'bg-red-100 text-red-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const TransactionDetailsDialog: React.FC<TransactionDetailsDialogProps> = ({
  isOpen,
  onClose,
  transaction,
  formatCurrency,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Transaction ID:</div>
            <div className="col-span-3">#{transaction.id}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Date:</div>
            <div className="col-span-3">{format(new Date(transaction.created_at), 'PPpp')}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Amount:</div>
            <div className="col-span-3">{formatCurrency(transaction.amount)}</div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Type:</div>
            <div className="col-span-3">
              <Badge className={getTypeBadge(transaction.type)}>{transaction.type}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Status:</div>
            <div className="col-span-3">
              <Badge className={getStatusBadge(transaction.status)}>{transaction.status}</Badge>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Wallet:</div>
            <div className="col-span-3">
              Wallet #{transaction.wallet_id}
              <div className="text-sm text-muted-foreground">
                Balance: {formatCurrency(transaction.Wallet?.available_balance || '0')}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="font-semibold">Wallet Owner:</div>
            <div className="col-span-3">
              {transaction.Wallet?.User ? (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    {transaction.Wallet.User.profile_picture && (
                      <img
                        src={transaction.Wallet.User.profile_picture}
                        alt="Profile"
                        className="w-6 h-6 rounded-full"
                      />
                    )}
                    <span>{transaction.Wallet.User.name}</span>
                    {!transaction.Wallet.User.is_active && (
                      <Badge variant="outline" className="text-red-500">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Email: {transaction.Wallet.User.email}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Phone: {transaction.Wallet.User.phone}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Gender: {transaction.Wallet.User.gender}
                  </div>
                </div>
              ) : (
                'N/A'
              )}
            </div>
          </div>
          {transaction.Order && (
            <>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-semibold">Related Order:</div>
                <div className="col-span-3">#{transaction.Order.OrderID}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="font-semibold">Order Status:</div>
                <div className="col-span-3">
                  <Badge>{transaction.Order.status}</Badge>
                </div>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailsDialog; 