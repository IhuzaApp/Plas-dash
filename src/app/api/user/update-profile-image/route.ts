import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import { UPDATE_PROJECT_USER_PROFILE_IMAGE, UPDATE_USER_PROFILE_IMAGE, UPDATE_EMPLOYEE_PROFILE_IMAGE } from '@/lib/graphql/mutations';

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;
  let userType = (session as any)?.user?.type;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
      // For Bearer tokens from localStorage, we might not have userType.
      // We'll need to determine it or handle multiple tables.
    }
  }

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // If userType is missing, we try to detect it
  if (!userType) {
    try {
      if (hasuraClient) {
        const pCheck = await hasuraClient.request<any>(gql`query checkP($id: uuid!) { ProjectUsers_by_pk(id: $id) { id } }`, { id: userId });
        if (pCheck.ProjectUsers_by_pk) userType = 'project_user';
        else {
          const eCheck = await hasuraClient.request<any>(gql`query checkE($id: uuid!) { orgEmployees_by_pk(id: $id) { id } }`, { id: userId });
          if (eCheck.orgEmployees_by_pk) userType = 'employee';
          else userType = 'user';
        }
      }
    } catch (e) {
      userType = 'user';
    }
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
