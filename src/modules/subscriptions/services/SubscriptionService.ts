import { hasuraClient } from '@/lib/hasuraClient';
import { gql } from 'graphql-request';

const GET_BASIC_PLAN = gql`
  query GetBasicPlan {
    plans(where: {name: {_ilike: "Basic"}}, limit: 1) {
      id
      name
    }
  }
`;

const INSERT_SHOP_SUBSCRIPTION = gql`
  mutation InsertShopSubscription($object: shop_subscriptions_insert_input!) {
    insert_shop_subscriptions_one(object: $object) {
      id
      plan_id
      shop_id
      status
      start_date
    }
  }
`;

const GET_SHOP_PLAN_AI_LIMIT = gql`
  query GetShopPlanAiLimit($shop_id: uuid!) {
    shop_subscriptions(where: {shop_id: {_eq: $shop_id}, status: {_eq: "active"}}, limit: 1) {
      plan {
        name
        ai_request_limit
        reel_limit
      }
    }
  }
`;

const GET_AI_USAGE_CURRENT_MONTH = gql`
  query GetAiUsageCurrentMonth($shop_id: uuid!, $month: Int!, $year: Int!) {
    ai_usage(where: {shop_id: {_eq: $shop_id}, month: {_eq: $month}, year: {_eq: $year}}, limit: 1) {
      id
      request_count
    }
  }
`;

const INCREMENT_AI_USAGE = gql`
  mutation IncrementAiUsage($id: uuid!) {
    update_ai_usage_by_pk(pk_columns: {id: $id}, _inc: {request_count: 1}) {
      id
      request_count
    }
  }
`;

const INSERT_AI_USAGE = gql`
  mutation InsertAiUsage($shop_id: uuid!, $month: Int!, $year: Int!) {
    insert_ai_usage_one(object: {shop_id: $shop_id, month: $month, year: $year, request_count: 1}) {
      id
      request_count
    }
  }
`;

const GET_REEL_USAGE_CURRENT_MONTH = gql`
  query GetReelUsageCurrentMonth($shop_id: uuid!, $month: Int!, $year: Int!) {
    reel_usage(where: {shop_id: {_eq: $shop_id}, month: {_eq: $month}, year: {_eq: $year}}, limit: 1) {
      id
      upload_count
    }
  }
`;

const INCREMENT_REEL_USAGE = gql`
  mutation IncrementReelUsage($id: uuid!) {
    update_reel_usage_by_pk(pk_columns: {id: $id}, _inc: {upload_count: 1}) {
      id
      upload_count
    }
  }
`;

const INSERT_REEL_USAGE = gql`
  mutation InsertReelUsage($shop_id: uuid!, $month: Int!, $year: Int!) {
    insert_reel_usage_one(object: {shop_id: $shop_id, month: $month, year: $year, upload_count: 1}) {
      id
      upload_count
    }
  }
`;

export class SubscriptionService {
    /**
     * Plans:
     * Manage subscription tiers (e.g., Free, Pro, Enterprise)
     */
    async getPlans() {
        throw new Error('Not implemented');
    }

    /**
     * Modules:
     * Manage application features/modules available for subscription (e.g., POS, Inventory, Analytics)
     */
    async getModules() {
        throw new Error('Not implemented');
    }

    /**
     * Plan Modules:
     * Link modules to specific plans (which plan gets which modules)
     */
    async getPlanModules(planId: string) {
        throw new Error('Not implemented');
    }

    /**
     * Shop Subscriptions:
     * Manage active subscriptions for shops/businesses
     */
    async getShopSubscription(shopId: string) {
        throw new Error('Not implemented');
    }

    /**
     * AI Usage:
     * Check if a shop can make an AI request based on their plan limits,
     * and increment the usage counter if allowed.
     */
    async checkAiUsageLimit(shopId: string): Promise<boolean> {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        try {
            // 1. Get the shop's active plan and its AI limit
            const planData = await hasuraClient.request<any>(GET_SHOP_PLAN_AI_LIMIT, { shop_id: shopId });
            const activeSubscription = planData.shop_subscriptions?.[0];

            if (!activeSubscription || !activeSubscription.plan) {
                console.error(`Shop ${shopId} does not have an active subscription.`);
                throw new Error("This feature requires an active subscription. Please upgrade your plan.");
            }

            const plan = activeSubscription.plan;
            const planName = plan.name?.toLowerCase() || '';
            let limit = plan.ai_request_limit;

            // Hardcoded fallback limits based on plan name if db column is null
            if (limit === null || limit === undefined) {
                if (planName.includes('basic')) limit = 5;
                else if (planName.includes('business')) limit = 100;
                // 'pro' or others considered unlimited if null
            }

            // 2. Get current month's usage
            const usageData = await hasuraClient.request<any>(GET_AI_USAGE_CURRENT_MONTH, {
                shop_id: shopId,
                month: currentMonth,
                year: currentYear
            });
            const currentUsageRecord = usageData.ai_usage?.[0];
            const currentCount = currentUsageRecord?.request_count || 0;

            // 3. Compare with limit
            if (limit !== null && limit !== undefined && currentCount >= limit && !planName.includes('pro')) {
                throw new Error("AI request limit reached. Upgrade your plan.");
            }

            // 4. Increment or Insert usage
            if (currentUsageRecord) {
                // Increment existing record
                await hasuraClient.request(INCREMENT_AI_USAGE, { id: currentUsageRecord.id });
            } else {
                // Insert new record for the month (starts count at 1)
                await hasuraClient.request(INSERT_AI_USAGE, {
                    shop_id: shopId,
                    month: currentMonth,
                    year: currentYear
                });
            }

            return true;
        } catch (error: any) {
            if (error.message === "AI request limit reached. Upgrade your plan." ||
                error.message === "This feature requires an active subscription. Please upgrade your plan.") {
                throw error; // Re-throw expected business logic errors
            }
            console.error('Error tracking AI usage:', error);
            throw new Error('Failed to track AI usage');
        }
    }

    /**
     * Reel Usage:
     * Check if a shop can upload a Reel based on their plan limits,
     * and increment the usage counter if allowed.
     */
    async checkReelUsageLimit(shopId: string): Promise<boolean> {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1; // 1-12
        const currentYear = currentDate.getFullYear();

        try {
            // 1. Get the shop's active plan and its Reel limit
            // Note: we're reusing the query that gets the plan since it now includes reel_limit
            const planData = await hasuraClient.request<any>(GET_SHOP_PLAN_AI_LIMIT, { shop_id: shopId });
            const activeSubscription = planData.shop_subscriptions?.[0];

            if (!activeSubscription || !activeSubscription.plan) {
                console.error(`Shop ${shopId} does not have an active subscription.`);
                throw new Error("This feature requires an active subscription. Please upgrade your plan.");
            }

            const plan = activeSubscription.plan;
            const planName = plan.name?.toLowerCase() || '';
            let limit = plan.reel_limit;

            // Hardcoded fallback limits based on plan name if db column is null
            if (limit === null || limit === undefined) {
                if (planName.includes('basic')) limit = 0;
                else if (planName.includes('business')) limit = 5;
                else if (planName.includes('pro')) limit = 20;
            }

            // 2. Compare with limit straight away if limit is 0
            if (limit === 0) {
                throw new Error("You have reached your monthly reel upload limit.");
            }

            // 3. Get current month's usage
            const usageData = await hasuraClient.request<any>(GET_REEL_USAGE_CURRENT_MONTH, {
                shop_id: shopId,
                month: currentMonth,
                year: currentYear
            });
            const currentUsageRecord = usageData.reel_usage?.[0];
            const currentCount = currentUsageRecord?.upload_count || 0;

            // 4. Compare with limit
            if (limit !== null && limit !== undefined && currentCount >= limit) {
                // Notice the custom error message expected by the user prompt
                throw new Error("You have reached your monthly reel upload limit.");
            }

            // 5. Increment or Insert usage
            if (currentUsageRecord) {
                // Increment existing record
                await hasuraClient.request(INCREMENT_REEL_USAGE, { id: currentUsageRecord.id });
            } else {
                // Insert new record for the month (starts count at 1)
                await hasuraClient.request(INSERT_REEL_USAGE, {
                    shop_id: shopId,
                    month: currentMonth,
                    year: currentYear
                });
            }

            return true;
        } catch (error: any) {
            if (error.message === "You have reached your monthly reel upload limit." ||
                error.message === "This feature requires an active subscription. Please upgrade your plan.") {
                throw error;
            }
            console.error('Error tracking Reel usage:', error);
            throw new Error('Failed to track Reel usage');
        }
    }

    /**
     * Assigns the "Basic" subscription plan to a newly created shop.
     * @param shopId The ID of the newly created shop.
     * @returns The created shop subscription record, or null if the Basic plan was not found.
     */
    async assignBasicPlanToNewShop(shopId: string) {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        try {
            // 1. Find the Basic plan
            const planData = await hasuraClient.request<{ plans: { id: string, name: string }[] }>(GET_BASIC_PLAN);
            const basicPlan = planData.plans[0];

            if (!basicPlan) {
                console.error('Basic plan not found. Cannot assign subscription to new shop:', shopId);
                return null;
            }

            // 2. Insert a record into shop_subscriptions
            const currentDate = new Date().toISOString();

            const subscriptionObject = {
                shop_id: shopId,
                plan_id: basicPlan.id,
                status: 'active',
                billing_cycle: 'monthly',
                start_date: currentDate,
                end_date: null
            };

            const result = await hasuraClient.request<{ insert_shop_subscriptions_one: any }>(
                INSERT_SHOP_SUBSCRIPTION,
                { object: subscriptionObject }
            );

            return result.insert_shop_subscriptions_one;
        } catch (error) {
            console.error('Error assigning basic plan to new shop:', error);
            throw new Error(`Failed to assign basic plan to shop ${shopId}`);
        }
    }
}
