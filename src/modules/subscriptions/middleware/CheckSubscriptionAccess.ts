import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]';
import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const CHECK_SUBSCRIPTION_ACCESS = gql`
  query CheckSubscriptionAccess($shop_id: uuid!, $module_slug: String!) {
    shop_subscriptions(where: { shop_id: { _eq: $shop_id }, status: { _eq: "active" } }, limit: 1) {
      id
      plan {
        id
        plan_modules(where: { module: { slug: { _eq: $module_slug } } }) {
          id
          module {
            id
            slug
          }
        }
      }
    }
  }
`;

/**
 * Middleware to protect API routes based on shop subscriptions and enabled modules.
 * @param req The Next.js request object
 * @param module_slug The unique string identifier for the requested module
 * @param getShopIdFn A function to extract the shop ID from the request or session context
 * @returns A NextResponse if access is denied, null if access is allowed
 */
export async function checkSubscriptionAccess(
  req: Request,
  module_slug: string,
  getShopIdFn: (req: Request, session: any) => Promise<string | null>
): Promise<NextResponse | null> {
  try {
    const session = await getServerSession(authOptions as any);

    // We expect the caller to figure out how to derive the shop_id from the current request/session
    const shop_id = await getShopIdFn(req, session);

    if (!shop_id) {
      return NextResponse.json(
        { error: 'Shop ID not provided or could not be determined' },
        { status: 400 }
      );
    }

    if (!hasuraClient) {
      console.error('Hasura client is not initialized in checkSubscriptionAccess');
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    // Query the database to see if this shop has an active subscription that includes the required module
    const data = await hasuraClient.request<{
      shop_subscriptions: {
        id: string;
        plan?: {
          id: string;
          plan_modules: {
            id: string;
            module?: {
              id: string;
              slug: string;
            };
          }[];
        };
      }[];
    }>(CHECK_SUBSCRIPTION_ACCESS, { shop_id, module_slug });

    const activeSubscription = data?.shop_subscriptions?.[0];

    if (!activeSubscription) {
      // Shop does not have an active subscription
      return NextResponse.json(
        { error: 'This feature requires an active subscription. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Check if the assigned plan contains the specific module requested
    const hasModuleAccess = activeSubscription.plan?.plan_modules?.some(
      pm => pm.module?.slug === module_slug
    );

    if (!hasModuleAccess) {
      return NextResponse.json(
        { error: 'This feature requires an active subscription. Please upgrade your plan.' },
        { status: 403 }
      );
    }

    // Access granted
    return null;
  } catch (error) {
    console.error(`Error checking subscription access for module ${module_slug}:`, error);
    return NextResponse.json({ error: 'Failed to verify subscription access' }, { status: 500 });
  }
}
