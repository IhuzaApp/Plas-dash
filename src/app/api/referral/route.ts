import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { GET_REFERRAL_WINDOW, GET_REFERRAL_ORDERS } from '@/lib/graphql/queries';

export async function GET(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userId = (session?.user as { id?: string } | undefined)?.id;

        // Fallback to Bearer token if session is not available
        if (!userId) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                userId = authHeader.substring(7);
            }
        }

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (!hasuraClient) {
            return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
        }

        // 1. Fetch Referral Window data
        const referralData = await hasuraClient.request<{ Referral_window: any[] }>(GET_REFERRAL_WINDOW);
        const referrals = referralData.Referral_window || [];

        if (referrals.length === 0) {
            return NextResponse.json({ Referral_window: [] });
        }

        // 2. Fetch all orders for these referral codes
        const referralCodes = referrals.map(r => r.referralCode).filter(Boolean);
        const ordersData = await hasuraClient.request<{ Orders: any[] }>(GET_REFERRAL_ORDERS, {
            referralCodes
        });
        const allOrders = ordersData.Orders || [];

        // 3. Aggregate stats for each referral
        const enrichedReferrals = referrals.map(referral => {
            const relatedOrders = allOrders.filter(o => o.voucher_code === referral.referralCode);

            let sellingTotal = 0; // Total based on final_price (what customer pays)
            let costTotal = 0;    // Total based on cost price (what we pay shop)
            let totalEarnings = 0;

            relatedOrders.forEach(order => {
                const orderCostTotal = parseFloat(order.total || '0');

                let orderSellingTotal = 0;
                (order.Order_Items || []).forEach((item: any) => {
                    const finalPrice = parseFloat(item.Product?.final_price || '0');
                    const qty = item.quantity || 0;
                    orderSellingTotal += (finalPrice * qty);
                });

                // Earnings: 1% * (SellingTotal - CostTotal)
                const earnings = (orderSellingTotal - orderCostTotal) * 0.01;

                sellingTotal += orderSellingTotal;
                costTotal += orderCostTotal;
                totalEarnings += earnings;
            });

            return {
                ...referral,
                stats: {
                    ordersCount: relatedOrders.length,
                    totalAmount: sellingTotal.toFixed(2),
                    earnings: totalEarnings.toFixed(2),
                    orders: relatedOrders.map(o => ({
                        id: o.id,
                        OrderID: o.OrderID,
                        total: o.total, // Cost total
                        status: o.status,
                        created_at: o.updated_at,
                        voucher_code: o.voucher_code,
                        sellingTotal: (o.Order_Items || []).reduce((sum: number, item: any) => {
                            return sum + (parseFloat(item.Product?.final_price || '0') * (item.quantity || 0));
                        }, 0).toFixed(2)
                    }))
                }
            };
        });

        return NextResponse.json({ Referral_window: enrichedReferrals });
    } catch (error: any) {
        console.error('Error fetching referral window data:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to fetch referral data' },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const session = await getServerSession(authOptions);
        let userIdauth = (session?.user as { id?: string } | undefined)?.id;

        // Fallback to Bearer token if session is not available
        if (!userIdauth) {
            const authHeader = req.headers.get('authorization');
            if (authHeader?.startsWith('Bearer ')) {
                userIdauth = authHeader.substring(7);
            }
        }

        if (!userIdauth) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id, status, phoneVerified } = await req.json();

        if (!id || status === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        if (!hasuraClient) {
            return NextResponse.json({ error: 'Database client not available' }, { status: 500 });
        }

        const { UPDATE_REFERRAL_WINDOW_STATUS } = await import('@/lib/graphql/mutations');

        const data = await hasuraClient.request(UPDATE_REFERRAL_WINDOW_STATUS, {
            id,
            status,
            phoneVerified: !!phoneVerified
        });

        return NextResponse.json(data);
    } catch (error: any) {
        console.error('Error updating referral window status:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to update referral status' },
            { status: 500 }
        );
    }
}
