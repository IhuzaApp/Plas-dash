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
     * Track and manage AI feature usage limits per subscription
     */
    async getAiUsage(shopId: string) {
        throw new Error('Not implemented');
    }

    /**
     * Reel Usage:
     * Track and manage Reel feature usage limits per subscription
     */
    async getReelUsage(shopId: string) {
        throw new Error('Not implemented');
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
