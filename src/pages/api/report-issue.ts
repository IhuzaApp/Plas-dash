import type { NextApiRequest, NextApiResponse } from 'next';
import { logErrorToSlack } from '@/lib/slackErrorReporter';

const HASURA_GRAPHQL_URL = process.env.HASURA_GRAPHQL_URL || '';
const HASURA_GRAPHQL_ADMIN_SECRET = process.env.HASURA_GRAPHQL_ADMIN_SECRET || '';

const VERIFY_USER_QUERY = `
  query VerifyUser($email: String!, $sharedId: String!) {
    orgEmployees(where: {
      _and: [
        { email: { _eq: $email } },
        { employeeID: { _eq: $sharedId } }
      ]
    }) {
      id
      fullnames
      roleType
    }
    ProjectUsers(where: {
      _and: [
        { email: { _eq: $email } },
        { MembershipId: { _cast: { String: { _eq: $sharedId } } } }
      ]
    }) {
      id
      username
      role
    }
  }
`;

// Helper for when MembershipId is numeric
const VERIFY_PROJECT_USER_BY_NUMERIC_ID = `
  query VerifyProjectUser($email: String!, $sharedId: Int!) {
    ProjectUsers(where: {
      _and: [
        { email: { _eq: $email } },
        { MembershipId: { _eq: $sharedId } }
      ]
    }) {
      id
      username
      role
    }
  }
`;

const INSERT_TICKET_MUTATION = `
  mutation InsertTicket($category: String, $description: String, $priority: String, $projectUser_id: uuid, $user_id: uuid, $status: String, $subject: String) {
    insert_tickets(objects: {
      category: $category, 
      description: $description, 
      priority: $priority, 
      projectUser_id: $projectUser_id, 
      user_id: $user_id, 
      status: $status, 
      subject: $subject
    }) {
      affected_rows
    }
  }
`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { email, sharedId, description } = req.body;

  if (!email || !sharedId) {
    return res.status(400).json({ error: 'Email and ID are required' });
  }

  try {
    let foundUser: { id: string; name: string; type: 'project_user' | 'employee' } | null = null;

    // 1. Verify Account
    if (HASURA_GRAPHQL_URL && HASURA_GRAPHQL_ADMIN_SECRET) {
      // Try with string first
      const response = await fetch(HASURA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET,
        },
        body: JSON.stringify({
          query: VERIFY_USER_QUERY,
          variables: { email, sharedId },
        }),
      });

      const data = await response.json();

      if (data.data?.orgEmployees?.[0]) {
        const emp = data.data.orgEmployees[0];
        foundUser = { id: emp.id, name: emp.fullnames, type: 'employee' };
      } else if (data.data?.ProjectUsers?.[0]) {
        const pu = data.data.ProjectUsers[0];
        foundUser = { id: pu.id, name: pu.username, type: 'project_user' };
      } else {
        // Try numeric ID for project user if it looks like a number
        const numericId = parseInt(sharedId);
        if (!isNaN(numericId)) {
          const resNum = await fetch(HASURA_GRAPHQL_URL, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET,
            },
            body: JSON.stringify({
              query: VERIFY_PROJECT_USER_BY_NUMERIC_ID,
              variables: { email, sharedId: numericId },
            }),
          });
          const dataNum = await resNum.json();
          if (dataNum.data?.ProjectUsers?.[0]) {
            const pu = dataNum.data.ProjectUsers[0];
            foundUser = { id: pu.id, name: pu.username, type: 'project_user' };
          }
        }
      }
    }

    if (!foundUser) {
      return res.status(404).json({ error: 'Account not found. Please check your Email and ID.' });
    }

    // 2. Log to Slack
    await logErrorToSlack(
      'Login Support (Verified)',
      new Error(`Verified user support request: ${foundUser.name}`),
      {
        type: foundUser.type,
        email,
        sharedId,
        description,
        userId: foundUser.id,
        timestamp: new Date().toISOString(),
      }
    );

    // 3. Create Ticket
    if (HASURA_GRAPHQL_URL && HASURA_GRAPHQL_ADMIN_SECRET) {
      const variables: any = {
        category: 'Login Issue',
        description: `Verified Login Support Request: ${description}\n\nEmail: ${email}\nShared ID: ${sharedId}`,
        priority: 'High',
        status: 'Open',
        subject: `[Support] Can't Sign In: ${foundUser.name}`,
      };

      if (foundUser.type === 'project_user') {
        variables.projectUser_id = foundUser.id;
      } else {
        variables.user_id = foundUser.id;
      }

      await fetch(HASURA_GRAPHQL_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-hasura-admin-secret': HASURA_GRAPHQL_ADMIN_SECRET,
        },
        body: JSON.stringify({
          query: INSERT_TICKET_MUTATION,
          variables,
        }),
      });
    }

    return res.status(200).json({ success: true, name: foundUser.name });
  } catch (error: any) {
    console.error('Error reporting issue:', error);
    return res.status(500).json({ error: 'An error occurred while processing your request.' });
  }
}
