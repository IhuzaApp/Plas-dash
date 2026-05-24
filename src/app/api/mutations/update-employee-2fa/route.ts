import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { UPDATE_ORG_EMPLOYEE_AUTH_SETTINGS } from '@/lib/graphql/mutations';

export async function POST(request: Request) {
  try {
    const { id, enabled } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!hasuraClient) {
      return NextResponse.json({ error: 'Hasura client not initialized' }, { status: 500 });
    }

    // For orgEmployees, we use multAuthEnabled
    const data = await hasuraClient.request(UPDATE_ORG_EMPLOYEE_AUTH_SETTINGS, {
      id,
      multAuthEnabled: enabled,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating employee 2FA:', error);
    return NextResponse.json({ error: error.message || 'Failed to update 2FA' }, { status: 500 });
  }
}
