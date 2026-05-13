import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';
import bcrypt from 'bcryptjs';

const GET_USER_PASSWORD = gql`
  query GetUserPassword($id: uuid!) {
    Users_by_pk(id: $id) { id password_hash }
  }
`;

const GET_PROJECT_USER_PASSWORD = gql`
  query GetProjectUserPassword($id: uuid!) {
    ProjectUsers_by_pk(id: $id) { id password }
  }
`;

const GET_EMPLOYEE_PASSWORD = gql`
  query GetEmployeePassword($id: uuid!) {
    orgEmployees_by_pk(id: $id) { id password }
  }
`;

const UPDATE_USER_PASSWORD = gql`
  mutation UpdateUserPassword($id: uuid!, $password_hash: String!) {
    update_Users_by_pk(pk_columns: { id: $id }, _set: { password_hash: $password_hash, updated_at: "now()" }) { id }
  }
`;

const UPDATE_PROJECT_USER_PASSWORD = gql`
  mutation UpdateProjectUserPassword($id: uuid!, $password: String!) {
    update_ProjectUsers_by_pk(pk_columns: { id: $id }, _set: { password: $password, updated_at: "now()" }) { id }
  }
`;

const UPDATE_EMPLOYEE_PASSWORD = gql`
  mutation UpdateEmployeePassword($id: uuid!, $password: String!) {
    update_orgEmployees_by_pk(pk_columns: { id: $id }, _set: { password: $password, updated_at: "now()" }) { id }
  }
`;

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  let userId = (session as any)?.user?.id;
  let userType = (session as any)?.user?.type;

  if (!userId) {
    const authHeader = request.headers.get('authorization');
    if (authHeader?.startsWith('Bearer ')) {
      userId = authHeader.substring(7);
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

  const { currentPassword, newPassword } = await request.json();
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ message: 'Both current and new passwords are required' }, { status: 400 });
  }

  try {
    if (!hasuraClient) throw new Error('Hasura client not initialized');

    let existingPassword = '';
    let updateMutation = '';

    if (userType === 'project_user') {
      const data = await hasuraClient.request<any>(GET_PROJECT_USER_PASSWORD, { id: userId });
      existingPassword = data.ProjectUsers_by_pk?.password;
      updateMutation = UPDATE_PROJECT_USER_PASSWORD;
    } else if (userType === 'employee') {
      const data = await hasuraClient.request<any>(GET_EMPLOYEE_PASSWORD, { id: userId });
      existingPassword = data.orgEmployees_by_pk?.password;
      updateMutation = UPDATE_EMPLOYEE_PASSWORD;
    } else {
      const data = await hasuraClient.request<any>(GET_USER_PASSWORD, { id: userId });
      existingPassword = data.Users_by_pk?.password_hash;
      updateMutation = UPDATE_USER_PASSWORD;
    }

    if (!existingPassword) return NextResponse.json({ message: 'User not found' }, { status: 404 });

    // Verify current password
    const isMatch = existingPassword.startsWith('$2b$') 
      ? await bcrypt.compare(currentPassword, existingPassword)
      : currentPassword === existingPassword; // Simplified for non-bcrypt legacy

    if (!isMatch) return NextResponse.json({ message: 'Current password incorrect' }, { status: 401 });

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    
    // Update
    await hasuraClient.request(updateMutation, {
      id: userId,
      [userType === 'project_user' || userType === 'employee' ? 'password' : 'password_hash']: hashedPassword
    });

    return NextResponse.json({ message: 'Password updated successfully' });
  } catch (error: any) {
    console.error('Password update error:', error);
    return NextResponse.json({ message: 'Failed to update password', error: error.message }, { status: 500 });
  }
}
