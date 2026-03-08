'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3 } from 'lucide-react';

interface UsageTabProps {
    aiUsage: any[];
    reelUsage: any[];
}

const UsageTab: React.FC<UsageTabProps> = ({ aiUsage, reelUsage }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-blue-500" /> AI Usage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {aiUsage?.length > 0 ? (
                            aiUsage.map((usage: any) => (
                                <div key={usage.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                                    <span>{usage.month}/{usage.year}</span>
                                    <span className="font-bold">{usage.request_count} requests</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No AI usage data available.</p>
                        )}
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                        <BarChart3 className="h-5 w-5 text-red-500" /> Reel Usage
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-2">
                        {reelUsage?.length > 0 ? (
                            reelUsage.map((usage: any) => (
                                <div key={usage.id} className="flex justify-between text-sm py-2 border-b last:border-0">
                                    <span>{usage.month}/{usage.year}</span>
                                    <span className="font-bold">{usage.upload_count} uploads</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">No Reel usage data available.</p>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default UsageTab;
