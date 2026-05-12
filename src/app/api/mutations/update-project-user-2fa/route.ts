import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { UPDATE_PROJECT_USER_2FA } from '@/lib/graphql/mutations';

export async function POST(request: Request) {
  try {
    const { id, enabled } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const data = await hasuraClient.request(UPDATE_PROJECT_USER_2FA, {
      id,
      enabled,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating project user 2FA:', error);
    return NextResponse.json({ error: error.message || 'Failed to update 2FA' }, { status: 500 });
  }
}
