import React from 'react';
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { CheckCircle2, Clock } from 'lucide-react';
import { format } from 'date-fns';

interface ReferralRecord {
    id: string;
    name: string | null;
    email: string | null;
    phone: string | null;
    referralCode: string;
    phoneVerified: boolean;
    status: string;
    created_at: string;
    deviceFingerprint: string | null;
    user_id: string;
    User?: {
        name: string | null;
        email: string | null;
        phone: string | null;
        gender: string | null;
        is_active: boolean;
        is_guest: boolean;
        profile_picture: string | null;
    };
    stats?: {
        ordersCount: number;
        totalAmount: string;
        earnings: string;
        orders?: Array<{
            id: string;
            OrderID: string;
            total: string;
            status: string;
            created_at: string;
            sellingTotal: string;
        }>;
    };
}

interface ReviewReferralDrawerProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    referral: ReferralRecord | null;
    onApprove: () => void;
    isProcessing: boolean;
}

export const ReviewReferralDrawer: React.FC<ReviewReferralDrawerProps> = ({
    isOpen,
    onOpenChange,
    referral,
    onApprove,
    isProcessing
}) => {
    if (!referral) return null;

    return (
        <Sheet open={isOpen} onOpenChange={onOpenChange}>
            <SheetContent className="sm:max-w-3xl overflow-y-auto">
                <SheetHeader>
                    <SheetTitle>Referral Details & Orders</SheetTitle>
                    <SheetDescription>
                        {referral.status?.toLowerCase() === 'active' || referral.status?.toLowerCase() === 'approved'
                            ? 'View detailed performance metrics and order history for this referral.'
                            : 'Review user information and manually approve the referral.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    <div className="space-y-4">
                        <div className="flex items-center gap-4">
                            {referral.User?.profile_picture && (
                                <img
                                    src={referral.User.profile_picture}
                                    alt="Profile"
                                    className="w-12 h-12 rounded-full object-cover border"
                                />
                            )}
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">User Information</h4>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Full Name</p>
                                <p className="text-sm font-medium">{referral.name || referral.User?.name || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Email Address</p>
                                <p className="text-sm font-medium">{referral.email || referral.User?.email || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Phone Number</p>
                                <p className="text-sm font-medium">{referral.phone || referral.User?.phone || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Gender</p>
                                <p className="text-sm font-medium uppercase">{referral.User?.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Account Status</p>
                                <Badge variant="outline" className={referral.User?.is_active ? 'text-green-600' : 'text-red-600'}>
                                    {referral.User?.is_active ? 'Active' : 'Inactive'}
                                </Badge>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Role / Guest</p>
                                <p className="text-sm font-medium">
                                    {referral.User?.is_guest ? 'Guest User' : 'Registered User'}
                                </p>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">System Metadata</h4>
                        <div className="space-y-3">
                            <div>
                                <p className="text-xs text-muted-foreground">Device Fingerprint</p>
                                <p className="text-xs font-mono bg-muted p-2 rounded mt-1 break-all">
                                    {referral.deviceFingerprint || 'No fingerprint available'}
                                </p>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-xs text-muted-foreground">Referral Code</p>
                                    <Badge variant="outline" className="mt-1">{referral.referralCode}</Badge>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Signup Date</p>
                                    <p className="text-sm mt-1">{format(new Date(referral.created_at), 'MMM dd, yyyy HH:mm')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <Separator />

                    <div className="space-y-4">
                        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Current Status</h4>
                        <div className="flex items-center gap-4">
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">Status</p>
                                <Badge
                                    variant="outline"
                                    className={referral.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700'}
                                >
                                    {referral.status}
                                </Badge>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs text-muted-foreground mb-1">Verification</p>
                                {referral.phoneVerified ? (
                                    <span className="text-xs text-green-600 font-medium flex items-center gap-1">
                                        <CheckCircle2 className="w-3 h-3" /> Verified
                                    </span>
                                ) : (
                                    <span className="text-xs text-yellow-600 font-medium flex items-center gap-1">
                                        <Clock className="w-3 h-3" /> Unverified
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    {(referral.status?.toLowerCase() === 'active' || referral.status?.toLowerCase() === 'approved') && (
                        <div className="space-y-4">
                            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Associated Orders</h4>

                            {!referral.stats ? (
                                <div className="p-4 border rounded-lg bg-muted/20 text-center text-sm text-muted-foreground">
                                    Loading performance stats...
                                </div>
                            ) : (
                                <div className="border rounded-lg overflow-hidden">
                                    <table className="w-full text-sm text-left">
                                        <thead className="bg-muted text-muted-foreground">
                                            <tr>
                                                <th className="px-4 py-2 font-medium">Order ID</th>
                                                <th className="px-4 py-2 font-medium text-right">Selling</th>
                                                <th className="px-4 py-2 font-medium text-right">Earning (0.75%)</th>
                                                <th className="px-4 py-2 font-medium">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {referral.stats.orders && referral.stats.orders.length > 0 ? (
                                                referral.stats.orders.map((order) => {
                                                    const selling = parseFloat(order.sellingTotal);
                                                    const cost = parseFloat(order.total);
                                                    const earning = (selling - cost) * 0.0075;
                                                    return (
                                                        <tr key={order.id}>
                                                            <td className="px-4 py-2 font-mono text-xs">{order.OrderID}</td>
                                                            <td className="px-4 py-2 text-right">RWF {selling.toLocaleString()}</td>
                                                            <td className="px-4 py-2 text-right text-green-600 font-medium">RWF {earning.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</td>
                                                            <td className="px-4 py-2">
                                                                <Badge variant="outline" className="text-[10px] py-0 h-5">
                                                                    {order.status}
                                                                </Badge>
                                                            </td>
                                                        </tr>
                                                    );
                                                })
                                            ) : (
                                                <tr>
                                                    <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground italic">
                                                        No orders found for this referral code.
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="pt-6 flex gap-3">
                        <Button
                            className="flex-1"
                            onClick={onApprove}
                            disabled={isProcessing || referral.status === 'active'}
                        >
                            {isProcessing ? 'Processing...' : 'Approve Referral'}
                        </Button>
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => onOpenChange(false)}
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </SheetContent>
        </Sheet>
    );
};
