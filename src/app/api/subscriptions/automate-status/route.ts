import { NextResponse } from 'next/server';
import { SubscriptionService } from '@/modules/subscriptions/services/SubscriptionService';

export async function POST(req: Request) {
    // 1. Simple Security Check
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.CRON_SECRET || process.env.CLEANUP_API_TOKEN;

    // In development allow local requests, otherwise require token
    const isDevelopment = req.headers.get('host')?.includes('localhost') || req.headers.get('host')?.includes('127.0.0.1');

    if (expectedToken && !isDevelopment && authHeader !== `Bearer ${expectedToken}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const service = new SubscriptionService();
        const results = await service.processAutomatedStatusUpdates();

        return NextResponse.json({
            success: true,
            results,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Automation error:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 });
    }
}
