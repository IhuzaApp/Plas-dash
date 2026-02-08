import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import {
  sendSupportTicketToSlack,
  sendRequestEnableStoreToSlack,
  type SupportTicketPayload,
} from '@/lib/slackSupportNotifier';
import { logErrorToSlack } from '@/lib/slackErrorReporter';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const ADD_TICKET_REQUEST = gql`
  mutation AddTicketRequest(
    $priority: String = ""
    $status: String = ""
    $subject: String = ""
    $user_id: uuid = ""
    $category: String = ""
  ) {
    insert_tickets(
      objects: {
        priority: $priority
        status: $status
        subject: $subject
        user_id: $user_id
        category: $category
      }
    ) {
      affected_rows
      returning {
        ticket_num
      }
    }
  }
`;

type Body =
  | {
      requestType?: 'order';
      orderId: string;
      orderDisplayId?: string;
      orderType: 'regular' | 'reel' | 'restaurant' | 'business';
      storeName?: string;
      status?: string;
      message: string;
    }
  | {
      requestType: 'enable_store';
      storeId: string;
      storeName: string;
      message?: string;
      businessAccountId?: string;
    };

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  let body: Body | undefined;
  try {
    body = (await request.json()) as Body;
    if (body.requestType === 'enable_store') {
      const { storeId, storeName, message, businessAccountId } = body;
      if (!storeId || !storeName?.trim()) {
        return NextResponse.json(
          { error: 'Missing required fields: storeId, storeName' },
          { status: 400 }
        );
      }
      await sendRequestEnableStoreToSlack({
        storeId,
        storeName: storeName.trim(),
        message: typeof message === 'string' ? message.trim() : undefined,
        userEmail: session.user?.email ?? undefined,
        userName: session.user?.name ?? undefined,
        userPhone: session.user?.phone ?? undefined,
        userId: session.user?.id,
        businessAccountId: businessAccountId || undefined,
      });
      return NextResponse.json({ success: true });
    }
    if (!('orderId' in body) || !('orderType' in body)) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, orderType, message' },
        { status: 400 }
      );
    }
    const { orderId, orderDisplayId, orderType, storeName, status, message } = body;
    if (!orderId || !orderType || typeof message !== 'string') {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, orderType, message' },
        { status: 400 }
      );
    }
    const displayId = orderDisplayId ?? orderId;
    const subject = `Order issue #${displayId}`;
    let ticketNum: number | undefined;
    if (hasuraClient) {
      const result = await hasuraClient.request<{
        insert_tickets: {
          affected_rows: number;
          returning: Array<{ ticket_num: number }>;
        };
      }>(ADD_TICKET_REQUEST, {
        priority: 'critical',
        status: 'open',
        subject,
        user_id: session.user?.id ?? '',
        category: 'Customer',
      });
      ticketNum = result?.insert_tickets?.returning?.[0]?.ticket_num;
    }
    const slackPayload: SupportTicketPayload = {
      orderId,
      orderDisplayId: displayId,
      orderType,
      storeName,
      status,
      message: message.trim().slice(0, 2000),
      userEmail: session.user?.email ?? undefined,
      userName: session.user?.name ?? undefined,
      userPhone: session.user?.phone ?? undefined,
      ticketNum,
    };
    await sendSupportTicketToSlack(slackPayload);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Support ticket error:', err);
    await logErrorToSlack('api/support-ticket', err as Error, {
      orderId: body && 'orderId' in body ? body.orderId : undefined,
      orderDisplayId: body && 'orderDisplayId' in body ? body.orderDisplayId : undefined,
      userId: session?.user?.id,
    });
    return NextResponse.json({ error: 'Failed to submit support ticket' }, { status: 500 });
  }
}
