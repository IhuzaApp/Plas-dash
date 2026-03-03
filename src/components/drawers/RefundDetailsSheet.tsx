import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { format } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useQueryClient, useMutation } from '@tanstack/react-query';
import { hasuraRequest } from '@/lib/hasura';
import { UPDATE_REFUND_STATUS } from '@/lib/graphql/mutations';
import { toast } from 'sonner';
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Search,
  User,
  ShoppingCart,
  Package,
  CreditCard,
  MapPin,
  Clock,
  Tag,
} from 'lucide-react';
import { useSystemConfig } from '@/hooks/useHasuraApi';
import type { Refund } from '@/hooks/useGraphql';
import { apiPost } from '@/lib/api';

interface RefundDetailsSheetProps {
  refund: Refund | null;
  open: boolean;
  onClose: () => void;
}

interface UpdateRefundResponse {
  update_Refunds_by_pk: { id: string; status: string; update_on: string };
}

// ─── helpers ──────────────────────────────────────────────────────────────────

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
  in_review: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300',
};

const Row = ({ label, value }: { label: string; value?: React.ReactNode }) =>
  value !== undefined && value !== null && value !== '' ? (
    <div className="flex items-start justify-between gap-4 py-1.5">
      <span className="text-sm text-muted-foreground shrink-0">{label}</span>
      <span className="text-sm font-medium text-right">{value}</span>
    </div>
  ) : null;

// ─── component ────────────────────────────────────────────────────────────────

const RefundDetailsSheet: React.FC<RefundDetailsSheetProps> = ({ refund, open, onClose }) => {
  const queryClient = useQueryClient();
  const { data: systemConfig } = useSystemConfig();

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(num);
  };

  const { mutate: updateStatus, isPending: isUpdating } = useMutation<
    UpdateRefundResponse,
    Error,
    { id: string; status: string }
  >({
    mutationFn: ({ id, status }) =>
      hasuraRequest(UPDATE_REFUND_STATUS, { id, status, update_on: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', 'all-refunds'] });
      toast.success('Refund status updated successfully');
      onClose();
    },
    onError: err => toast.error('Failed to update refund status: ' + err.message),
  });

  const { mutate: approveRefund, isPending: isApproving } = useMutation({
    mutationFn: async (variables: { refund_id: string; user_id: string }) => {
      return apiPost('/api/mutations/approve-refund', variables);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api', 'all-refunds'] });
      toast.success('Refund approved and wallet updated');
      onClose();
    },
    onError: (err: any) => toast.error(err.message || 'Failed to approve refund'),
  });

  if (!refund) return null;

  const isPending = refund.status.toLowerCase() === 'pending';
  const isInReview = refund.status.toLowerCase() === 'in_review';
  const statusStyle = STATUS_STYLES[refund.status.toLowerCase()] ?? STATUS_STYLES.pending;
  const order = refund.Order;
  const user = refund.User;
  const buyer = order?.orderedBy;
  const isBusy = isUpdating || isApproving;

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto sm:max-w-2xl">
        <SheetHeader>
          <SheetTitle>Refund Details</SheetTitle>
          <SheetDescription>
            Full details for refund request &nbsp;
            <span className="font-mono text-xs">{refund.id.slice(0, 8)}…</span>
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-5">
          {/* ── Status banner ─────────────────────────────────────────────── */}
          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Refund Status</p>
              <Badge className={statusStyle}>{refund.status}</Badge>
            </div>
            <div className="space-y-0.5 text-right">
              <p className="text-xs text-muted-foreground">Amount Requested</p>
              <p className="text-2xl font-bold">{formatCurrency(refund.amount)}</p>
            </div>
          </div>

          {/* ── Refund basics ─────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm flex items-center gap-2">
                <Tag className="h-4 w-4" /> Refund Information
              </CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4 divide-y divide-border">
              <Row
                label="Refund ID"
                value={<span className="font-mono text-xs">{refund.id}</span>}
              />
              <Row
                label="Order ID"
                value={<span className="font-mono text-xs">{refund.order_id}</span>}
              />
              <Row
                label="Payment"
                value={
                  <Badge variant={refund.paid ? 'default' : 'outline'}>
                    {refund.paid ? 'Paid' : 'Unpaid'}
                  </Badge>
                }
              />
              <Row label="Generated By" value={refund.generated_by} />
              <Row
                label="Created"
                value={format(new Date(refund.created_at), 'MMM dd, yyyy HH:mm')}
              />
              {refund.update_on && (
                <Row
                  label="Last Updated"
                  value={format(new Date(refund.update_on), 'MMM dd, yyyy HH:mm')}
                />
              )}
            </CardContent>
          </Card>

          {/* ── Reason ────────────────────────────────────────────────────── */}
          <Card>
            <CardHeader className="pb-2 pt-4 px-4">
              <CardTitle className="text-sm">Refund Reason</CardTitle>
            </CardHeader>
            <CardContent className="px-4 pb-4">
              <p className="text-sm text-muted-foreground leading-relaxed">{refund.reason}</p>
            </CardContent>
          </Card>

          {/* ── Requester (User who requested refund) ─────────────────────── */}
          {user && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <User className="h-4 w-4" /> Refund Requester
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 divide-y divide-border">
                <Row label="Name" value={user.name} />
                <Row label="Email" value={user.email} />
                <Row label="Phone" value={user.phone} />
                <Row label="Gender" value={user.gender ?? '—'} />
              </CardContent>
            </Card>
          )}

          {/* ── Order details ─────────────────────────────────────────────── */}
          {order && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <ShoppingCart className="h-4 w-4" /> Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 divide-y divide-border">
                <Row
                  label="Order ID"
                  value={<span className="font-mono text-xs">{order.id}</span>}
                />
                <Row
                  label="Status"
                  value={
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_STYLES[order.status?.toLowerCase()] ?? STATUS_STYLES.pending
                      }`}
                    >
                      {order.status}
                    </span>
                  }
                />
                <Row label="Total" value={formatCurrency(order.total)} />
                <Row label="Delivery Fee" value={formatCurrency(order.delivery_fee)} />
                <Row label="Service Fee" value={formatCurrency(order.service_fee)} />
                {parseFloat(order.discount) > 0 && (
                  <Row label="Discount" value={formatCurrency(order.discount)} />
                )}
                {order.voucher_code && (
                  <Row
                    label="Voucher"
                    value={<span className="font-mono text-xs">{order.voucher_code}</span>}
                  />
                )}
                {order.delivery_notes && (
                  <Row label="Delivery Notes" value={order.delivery_notes} />
                )}
                {order.delivery_time && (
                  <Row
                    label="Delivered At"
                    value={format(new Date(order.delivery_time), 'MMM dd, yyyy HH:mm')}
                  />
                )}
                <Row
                  label="Order Created"
                  value={format(new Date(order.created_at), 'MMM dd, yyyy HH:mm')}
                />
                {order.updated_at && (
                  <Row
                    label="Order Updated"
                    value={format(new Date(order.updated_at), 'MMM dd, yyyy HH:mm')}
                  />
                )}
              </CardContent>
            </Card>
          )}

          {/* ── Customer (orderedBy) ───────────────────────────────────────── */}
          {buyer && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Customer (Order Placed By)
                </CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4 divide-y divide-border">
                <Row label="Name" value={buyer.name} />
                <Row label="Email" value={buyer.email} />
                <Row label="Phone" value={buyer.phone} />
                <Row label="Gender" value={buyer.gender ?? '—'} />
                <Row label="Account Type" value={buyer.is_guest ? 'Guest' : 'Registered'} />
                <Row label="Active" value={buyer.is_active ? 'Yes' : 'No'} />
                <Row
                  label="Member Since"
                  value={format(new Date(buyer.created_at), 'MMM dd, yyyy')}
                />
              </CardContent>
            </Card>
          )}

          {/* ── Delivery photo ────────────────────────────────────────────── */}
          {order?.delivery_photo_url && (
            <Card>
              <CardHeader className="pb-2 pt-4 px-4">
                <CardTitle className="text-sm">Delivery Photo</CardTitle>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <img
                  src={order.delivery_photo_url}
                  alt="Delivery photo"
                  className="w-full rounded-lg object-cover max-h-56"
                />
              </CardContent>
            </Card>
          )}

          {/* ── Actions ───────────────────────────────────────────────────── */}
          {(isPending || isInReview) && (
            <>
              <Separator />
              <div className="flex gap-3 justify-end pb-4">
                {isPending && (
                  <Button
                    size="sm"
                    onClick={() => updateStatus({ id: refund.id, status: 'in_review' })}
                    disabled={isBusy}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Start Review
                  </Button>
                )}
                {isInReview && (
                  <>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-red-600 hover:text-red-700 border-red-200"
                      onClick={() => updateStatus({ id: refund.id, status: 'rejected' })}
                      disabled={isBusy}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <XCircle className="h-4 w-4 mr-2" />
                      )}
                      Reject
                    </Button>
                    <Button
                      size="sm"
                      className="bg-green-600 hover:bg-green-700"
                      onClick={() =>
                        approveRefund({ refund_id: refund.id, user_id: refund.user_id })
                      }
                      disabled={isBusy}
                    >
                      {isApproving ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      ) : (
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                      )}
                      Approve
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RefundDetailsSheet;
