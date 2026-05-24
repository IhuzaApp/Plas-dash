import { NextResponse } from 'next/server';
import { sendTwoFactorEnabledEmail, sendTwoFactorCodeEmail } from '@/lib/SMS/resend';

export async function POST(request: Request) {
  try {
    console.log('DEBUG: Received 2FA email request');
    const body = await request.json();
    console.log('DEBUG: Request body:', body);
    const { type, to, customerName, code } = body;

    if (!to || !type) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    let result;

    if (type === 'enabled') {
      result = await sendTwoFactorEnabledEmail({ to, customerName });
    } else if (type === 'code') {
      if (!code) {
        return NextResponse.json({ error: 'Missing code for 2FA' }, { status: 400 });
      }
      result = await sendTwoFactorCodeEmail({ to, customerName, code });
    } else {
      return NextResponse.json({ error: 'Invalid email type' }, { status: 400 });
    }

    if (result && result.data && result.data.id) {
      console.log('DEBUG: Email sent successfully, ID:', result.data.id);
      return NextResponse.json({ success: true, id: result.data.id });
    } else {
      console.error('DEBUG: Email sending failed. Data:', result?.data, 'Error:', result?.error);
      return NextResponse.json({ error: result?.error || 'Failed to send email' }, { status: 500 });
    }
  } catch (error: any) {
    console.error('Error in send-2fa API route:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
