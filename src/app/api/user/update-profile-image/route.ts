import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { UPDATE_PROJECT_USER_PROFILE_IMAGE, UPDATE_USER_PROFILE_IMAGE, UPDATE_EMPLOYEE_PROFILE_IMAGE } from '@/lib/graphql/mutations';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  const userId = (session as any)?.user?.id;
  const userType = (session as any)?.user?.type;

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { profileImage } = await request.json();
    if (!profileImage) {
      return NextResponse.json({ error: 'Profile image is required' }, { status: 400 });
    }

    if (!hasuraClient) throw new Error('Hasura client not initialized');

    if (userType === 'project_user') {
      await hasuraClient.request(UPDATE_PROJECT_USER_PROFILE_IMAGE, { id: userId, profile: profileImage });
    } else if (userType === 'employee') {
      await hasuraClient.request(UPDATE_EMPLOYEE_PROFILE_IMAGE, { id: userId, profile_photo: profileImage });
    } else {
      await hasuraClient.request(UPDATE_USER_PROFILE_IMAGE, { id: userId, profile_picture: profileImage });
    }

    return NextResponse.json({ success: true, profileImage });
  } catch (error: any) {
    console.error('Error updating profile image:', error);
    return NextResponse.json({ error: 'Failed to update profile image', details: error.message }, { status: 500 });
  }
}
