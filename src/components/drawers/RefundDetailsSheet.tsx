import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useQueryClient, useMutation } from "@tanstack/react-query";
import { hasuraRequest } from "@/lib/hasura";
import { UPDATE_REFUND_STATUS } from "@/lib/graphql/mutations";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, Search } from "lucide-react";
import { useSystemConfig } from "@/hooks/useHasuraApi";

interface RefundDetailsSheetProps {
  refund: {
    id: string;
    order_id: string;
    amount: string;
    reason: string;
    status: string;
    paid: boolean;
    created_at: string;
    generated_by: string;
    update_on: string;
  } | null;
  open: boolean;
  onClose: () => void;
}

interface UpdateRefundResponse {
  update_Refunds_by_pk: {
    id: string;
    status: string;
    update_on: string;
  };
}

const RefundDetailsSheet: React.FC<RefundDetailsSheetProps> = ({
  refund,
  open,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const { data: systemConfig } = useSystemConfig();

  const formatCurrency = (amount: string) => {
    const num = parseFloat(amount);
    const currency = systemConfig?.System_configuratioins[0]?.currency || 'RWF';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(num);
  };

  const { mutate: updateStatus, isPending: isUpdating } = useMutation<
    UpdateRefundResponse,
    Error,
    { id: string; status: string }
  >({
    mutationFn: async ({ id, status }) => {
      return hasuraRequest(UPDATE_REFUND_STATUS, {
        id,
        status,
        update_on: new Date().toISOString(),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["refunds"] });
      toast.success("Refund status updated successfully");
    },
    onError: (error) => {
      toast.error("Failed to update refund status: " + error.message);
    },
  });

  const handleUpdateStatus = (status: string) => {
    if (!refund) return;
    updateStatus({ id: refund.id, status });
  };

  if (!refund) return null;

  const isPending = refund.status.toLowerCase() === "pending";
  const isInReview = refund.status.toLowerCase() === "in_review";

  const getStatusBadgeStyle = (status: string) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "in_review":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Refund Details</SheetTitle>
          <SheetDescription>
            Refund request details and status information
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Basic Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Refund ID</span>
                <span className="font-medium">{refund.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Order ID</span>
                <span className="font-medium">{refund.order_id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Amount</span>
                <span className="font-medium">{formatCurrency(refund.amount)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created Date</span>
                <span className="font-medium">
                  {format(new Date(refund.created_at), 'MMM dd, yyyy HH:mm')}
                </span>
              </div>
              {refund.update_on && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Last Updated</span>
                  <span className="font-medium">
                    {format(new Date(refund.update_on), 'MMM dd, yyyy HH:mm')}
                  </span>
                </div>
              )}
            </div>
          </Card>

          {/* Status Information */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Status Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge className={getStatusBadgeStyle(refund.status)}>
                  {refund.status}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Payment Status</span>
                <Badge variant={refund.paid ? "default" : "outline"}>
                  {refund.paid ? "Paid" : "Pending"}
                </Badge>
              </div>
              {isPending && (
                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    size="sm"
                    onClick={() => handleUpdateStatus("in_review")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Start Review
                  </Button>
                </div>
              )}
              {isInReview && (
                <div className="flex gap-2 mt-4 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => handleUpdateStatus("rejected")}
                    disabled={isUpdating}
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
                    onClick={() => handleUpdateStatus("approved")}
                    disabled={isUpdating}
                  >
                    {isUpdating ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                    )}
                    Approve
                  </Button>
                </div>
              )}
            </div>
          </Card>

          {/* Reason */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Refund Reason</h3>
            <p className="text-muted-foreground">{refund.reason}</p>
          </Card>

          {/* Additional Details */}
          <Card className="p-4">
            <h3 className="font-medium mb-4">Additional Details</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Generated By</span>
                <span className="font-medium">{refund.generated_by}</span>
              </div>
            </div>
          </Card>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default RefundDetailsSheet; 