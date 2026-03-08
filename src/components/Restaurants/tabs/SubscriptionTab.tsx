'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface SubscriptionTabProps {
    subscriptions: any[];
}

const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ subscriptions }) => {
    const formatDateTime = (dateString: string) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'MMM d, yyyy HH:mm');
        } catch (e) {
            return dateString;
        }
    };

    return (
        <Card>
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2" /> Subscription Plans
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {subscriptions?.length > 0 ? (
                    subscriptions.map((sub: any) => (
                        <div key={sub.id} className="space-y-4 border rounded-lg p-4">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-primary" />
                                    <div>
                                        <h4 className="font-bold text-lg">{sub.plan?.name} Plan</h4>
                                        <p className="text-sm text-muted-foreground">Billing: {sub.billing_cycle}</p>
                                    </div>
                                </div>
                                <Badge variant={sub.status === 'active' ? 'default' : 'destructive'} className="h-6">
                                    {sub.status.toUpperCase()}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 py-2">
                                <div>
                                    <p className="text-xs text-muted-foreground">Start Date</p>
                                    <p className="text-sm font-medium">{formatDateTime(sub.start_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">End Date</p>
                                    <p className="text-sm font-medium">{formatDateTime(sub.end_date)}</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">AI Limit</p>
                                    <p className="text-sm font-medium">{sub.plan?.ai_request_limit || 0} req/mo</p>
                                </div>
                                <div>
                                    <p className="text-xs text-muted-foreground">Reel Limit</p>
                                    <p className="text-sm font-medium">{sub.plan?.reel_limit || 0} uploads/mo</p>
                                </div>
                            </div>

                            {sub.plan?.plan_modules?.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase">Enabled Modules</p>
                                    <div className="flex flex-wrap gap-2">
                                        {sub.plan.plan_modules.map((m: any) => (
                                            <Badge key={m.id} variant="secondary" className="bg-primary/10 text-primary border-none">
                                                {m.module?.name}
                                            </Badge>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))
                ) : (
                    <div className="flex flex-col items-center justify-center h-32 border border-dashed rounded-lg">
                        <p className="text-muted-foreground">No active subscription found.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default SubscriptionTab;
