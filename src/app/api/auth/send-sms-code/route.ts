import { NextResponse } from 'next/server';
import { sendSMS } from '@/lib/SMS/pindo';

export async function POST(request: Request) {
  try {
    const { phone, code, type } = await request.json();

    if (!phone || !code) {
      return NextResponse.json({ error: 'Phone and code are required' }, { status: 400 });
    }

    const message = type === 'setup' 
      ? `Your Plas security setup code is: ${code}. Do not share this with anyone.`
      : `Your Plas verification code is: ${code}`;

    console.log(`DEBUG: Sending SMS to ${phone}: ${message}`);
    const result = await sendSMS(phone, message);

    if (result.error) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('SMS Send Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to send SMS' }, { status: 500 });
  }
}
