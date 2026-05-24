import { NextResponse } from 'next/server';
import { hasuraClient } from '@/lib/hasuraClient';
import { UPDATE_PROJECT_USER_AUTH_SETTINGS } from '@/lib/graphql/mutations';

export async function POST(request: Request) {
  try {
    const { id, secret } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    if (!hasuraClient) {
      return NextResponse.json({ error: 'Hasura client not initialized' }, { status: 500 });
    }

    const data = await hasuraClient.request(UPDATE_PROJECT_USER_AUTH_SETTINGS, {
      id,
      twoFactorSecrets: secret,
      TwoAuth_enabled: !!secret,
    });

    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error('Error updating project user 2FA secret:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update 2FA secret' },
      { status: 500 }
    );
  }
}
