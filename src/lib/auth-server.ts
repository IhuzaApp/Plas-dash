import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

export interface UserContext {
    userId: string;
    isProjectUser: boolean;
    shop_id: string | null;
    restaurant_id: string | null;
}

const GET_PROJECT_USER = gql`
  query GetProjectUser($id: uuid!) {
    ProjectUsers_by_pk(id: $id) {
      id
      role
    }
  }
`;

const GET_ORG_EMPLOYEE = gql`
  query GetOrgEmployee($id: uuid!) {
    orgEmployees_by_pk(id: $id) {
      id
      shop_id
      restaurant_id
    }
  }
`;

export async function getUserContext(req: Request): Promise<UserContext | null> {
    const session = await getServerSession(authOptions);
    let userId = (session as any)?.user?.id;

    if (!userId) {
        const authHeader = req.headers.get('authorization');
        if (authHeader && authHeader.startsWith('Bearer ')) {
            userId = authHeader.substring(7);
        }
    }

    if (!userId) return null;

    try {
        if (!hasuraClient) return null;

        // 1. Check if user is a ProjectUser (Admin/Superuser)
        const projectUserData = await hasuraClient.request<{ ProjectUsers_by_pk: any }>(
            GET_PROJECT_USER,
            { id: userId }
        );

        if (projectUserData.ProjectUsers_by_pk) {
            return {
                userId,
                isProjectUser: true,
                shop_id: null,
                restaurant_id: null,
            };
        }

        // 2. Check if user is an OrgEmployee (Staff)
        const employeeData = await hasuraClient.request<{ orgEmployees_by_pk: any }>(
            GET_ORG_EMPLOYEE,
            { id: userId }
        );

        if (employeeData.orgEmployees_by_pk) {
            return {
                userId,
                isProjectUser: false,
                shop_id: employeeData.orgEmployees_by_pk.shop_id,
                restaurant_id: employeeData.orgEmployees_by_pk.restaurant_id,
            };
        }

        // 3. Fallback: authenticated but not in either table (might be a standard customer)
        return {
            userId,
            isProjectUser: false,
            shop_id: null,
            restaurant_id: null,
        };
    } catch (error) {
        console.error('Error fetching user context:', error);
        return null;
    }
}
