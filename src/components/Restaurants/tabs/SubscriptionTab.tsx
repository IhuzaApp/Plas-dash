'use client';

import React from 'react';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MODULE_DESCRIPTIONS } from '@/lib/privileges/moduleDescriptions';
import { PrivilegeKey } from '@/types/privileges';

interface SubscriptionTabProps {
    subscriptions: any[] | any;
}

const SubscriptionTab: React.FC<SubscriptionTabProps> = ({ subscriptions }) => {
    // Normalize subscriptions to always be an array
    const subscriptionList = Array.isArray(subscriptions)
        ? subscriptions
        : subscriptions
            ? [subscriptions]
            : [];

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
                {subscriptionList.length > 0 ? (
                    subscriptionList.map((sub: any) => (
                        <div key={sub.id} className="space-y-6 border rounded-lg p-6">
                            <div className="flex items-center justify-between border-b pb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary/10 p-2 rounded-full">
                                        <Calendar className="h-6 w-6 text-primary" />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-xl">{sub.plan?.name} Plan</h4>
                                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                                            <span className="capitalize">{sub.billing_cycle}</span> billing cycle
                                        </p>
                                    </div>
                                </div>
                                <Badge
                                    variant={sub.status === 'active' ? 'default' : 'secondary'}
                                    className={`px-3 py-1 text-xs font-semibold uppercase tracking-wider ${sub.status === 'active' ? 'bg-green-500 hover:bg-green-600' : ''}`}
                                >
                                    {sub.status}
                                </Badge>
                            </div>

                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 py-2">
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Start Date</p>
                                    <p className="text-sm font-medium">{formatDateTime(sub.start_date)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">End Date</p>
                                    <p className="text-sm font-medium">{formatDateTime(sub.end_date)}</p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">AI Limit</p>
                                    <p className="text-sm font-medium">
                                        {sub.plan?.ai_request_limit === "-1" ? 'Unlimited' : `${sub.plan?.ai_request_limit || 0} req/mo`}
                                    </p>
                                </div>
                                <div className="space-y-1">
                                    <p className="text-xs text-muted-foreground uppercase font-semibold">Reel Limit</p>
                                    <p className="text-sm font-medium">
                                        {sub.plan?.reel_limit === "-1" ? 'Unlimited' : `${sub.plan?.reel_limit || 0} uploads/mo`}
                                    </p>
                                </div>
                            </div>

                            {sub.plan?.plan_modules?.length > 0 && (
                                <div className="space-y-4">
                                    <div className="flex items-center gap-2 border-b pb-2">
                                        <p className="text-sm font-bold text-foreground">Enabled Modules</p>
                                        <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                                            {sub.plan.plan_modules.length}
                                        </Badge>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                        {sub.plan.plan_modules.map((m: any) => {
                                            const moduleInfo = MODULE_DESCRIPTIONS[m.module?.slug as PrivilegeKey];
                                            return (
                                                <div
                                                    key={m.id}
                                                    className="flex flex-col p-3 rounded-lg border bg-muted/30 hover:bg-muted/50 transition-colors"
                                                >
                                                    <span className="font-bold text-sm text-primary">
                                                        {m.module?.name}
                                                    </span>
                                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                                        {moduleInfo?.description || m.module?.description || 'No description available'}
                                                    </p>
                                                </div>
                                            );
                                        })}
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
