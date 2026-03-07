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
  query GetAiUsageCurrentMonth($where: ai_usage_bool_exp!) {
    ai_usage(where: $where, limit: 1) {
      id
      request_count
    }
  }
`;

const INSERT_AI_USAGE = gql`
  mutation InsertAiUsage($object: ai_usage_insert_input!) {
    insert_ai_usage_one(object: $object) {
      id
    }
  }
`;

const GET_REEL_USAGE_CURRENT_MONTH = gql`
  query GetReelUsageCurrentMonth($where: reel_usage_bool_exp!) {
    reel_usage(where: $where, limit: 1) {
      id
      upload_count
    }
  }
`;

const INSERT_REEL_USAGE = gql`
  mutation InsertReelUsage($object: reel_usage_insert_input!) {
    insert_reel_usage_one(object: $object) {
      id
    }
  }
`;

const GET_SUBSCRIPTIONS_FOR_AUTOMATION = gql`
  query GetSubscriptionsForAutomation {
    shop_subscriptions(where: { status: { _nin: ["expired", "canceled"] } }) {
      id
      status
      end_date
      billing_cycle
      plan_id
      shop_id
      restaurant_id
      business_id
      plan {
        name
        price_monthly
        price_yearly
      }
    }
  }
`;

const UPDATE_SUBSCRIPTION_STATUS = gql`
  mutation UpdateSubscriptionStatus($id: uuid!, $status: String!) {
    update_shop_subscriptions_by_pk(pk_columns: { id: $id }, _set: { status: $status }) {
      id
      status
    }
  }
`;

const CREATE_INVOICE = gql`
  mutation CreateInvoice($object: subscription_invoices_insert_input!) {
    insert_subscription_invoices_one(object: $object) {
      id
      invoice_number
    }
  }
`;

const UPDATE_SHOP_SUBSCRIPTION = gql`
  mutation UpdateShopSubscription($id: uuid!, $object: shop_subscriptions_set_input!) {
    update_shop_subscriptions_by_pk(pk_columns: { id: $id }, _set: $object) {
      id
      plan_id
      status
      start_date
      end_date
    }
  }
`;

export class SubscriptionService {
    /**
     * Helper to generate a unique invoice number
     */
    private generateInvoiceNumber(): string {
        const prefix = 'INV';
        const timestamp = Date.now().toString().slice(-6);
        const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
        return `${prefix}-${timestamp}-${random}`;
    }

    /**
     * Generate an invoice for a subscription
     */
    async generateInvoice(subscription: any, userId?: string, issuedAt?: Date) {
        if (!hasuraClient) throw new Error('Hasura client not initialized');

        const now = issuedAt || new Date();
        const plan = subscription.plan;
        const price = subscription.billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

        const invoiceObject = {
            shopSubscription_id: subscription.id,
            aiUsage_id: null,   // Set to null as requested to avoid FK violations during creation
            reelUsage_id: null, // Set to null as requested to avoid FK violations during creation
            invoice_number: this.generateInvoiceNumber(),
            plan_name: plan.name,
            plan_price: price.toString(),
            subtotal_amount: price.toString(),
            tax_amount: "0",
            discount_amount: "0",
            currency: "RWF",
            status: "pending",
            is_overdue: false,
            issued_at: now.toISOString(),
            due_date: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7 days from issue
            updated_at: new Date().toISOString()
        };

        return await hasuraClient.request(CREATE_INVOICE, { object: invoiceObject });
    }

    /**
     * Handle new subscription assignment with trial logic
     */
    async handleSubscriptionAssignment(payload: any, userId?: string) {
        if (!hasuraClient) throw new Error('Hasura client not initialized');

        // 1. Check if a subscription already exists for this specific entity
        // We only check the specific ID that is present to avoid Hasura "unexpected null value for type 'uuid'" error
        let existingSub = null;
        if (payload.shop_id || payload.restaurant_id || payload.business_id) {
            const whereClause: any = {};
            if (payload.shop_id) whereClause.shop_id = { _eq: payload.shop_id };
            else if (payload.restaurant_id) whereClause.restaurant_id = { _eq: payload.restaurant_id };
            else if (payload.business_id) whereClause.business_id = { _eq: payload.business_id };

            const existingData = await hasuraClient.request<any>(gql`
                query GetExistingSubscriptionByTarget($where: shop_subscriptions_bool_exp!) {
                    shop_subscriptions(where: $where, limit: 1) {
                        id
                        status
                    }
                }
            `, { where: whereClause });
            existingSub = existingData.shop_subscriptions?.[0];
        }

        // 2. Get Plan details
        const planData = await hasuraClient.request<any>(gql`
            query GetPlan($id: uuid!) {
                plans_by_pk(id: $id) {
                    name
                    price_monthly
                    price_yearly
                }
            }
        `, { id: payload.plan_id });

        const plan = planData.plans_by_pk;
        const isBasic = plan.name?.toLowerCase().includes('basic');

        let startDate = new Date(payload.start_date || new Date());
        let endDate: Date;

        // 3. Apply 14-day trial if not Basic
        if (!isBasic) {
            // Defer the official start (billing date) by 14 days
            startDate = new Date(startDate.getTime() + 14 * 24 * 60 * 60 * 1000);
        }

        // 4. Calculate end date based on cycle
        if (payload.billing_cycle === 'yearly') {
            endDate = new Date(startDate);
            endDate.setFullYear(endDate.getFullYear() + 1);
        } else {
            endDate = new Date(startDate);
            endDate.setMonth(endDate.getMonth() + 1);
        }

        const subscriptionUpdateObject = {
            plan_id: payload.plan_id,
            billing_cycle: payload.billing_cycle,
            start_date: startDate.toISOString(),
            end_date: endDate.toISOString(),
            status: 'active'
        };

        let subId: string;
        let finalSub: any;

        if (existingSub) {
            // Update existing subscription
            const updateResult = await hasuraClient.request<any>(UPDATE_SHOP_SUBSCRIPTION, {
                id: existingSub.id,
                object: subscriptionUpdateObject
            });
            finalSub = updateResult.update_shop_subscriptions_by_pk;
            subId = existingSub.id;
        } else {
            // Create new subscription
            const subscriptionInsertObject = {
                ...payload,
                ...subscriptionUpdateObject
            };
            const insertResult = await hasuraClient.request<any>(INSERT_SHOP_SUBSCRIPTION, { object: subscriptionInsertObject });
            finalSub = insertResult.insert_shop_subscriptions_one;
            subId = finalSub.id;
        }

        // 5. Generate Initial Invoice
        await this.generateInvoice({
            id: subId,
            plan,
            billing_cycle: payload.billing_cycle,
            shop_id: payload.shop_id,
            restaurant_id: payload.restaurant_id,
            business_id: payload.business_id
        }, userId, new Date()); // Issued now

        return finalSub;
    }

    /**
     * Automated Status Updates & Billing:
     * Background process to update subscription statuses and generate invoices for renewals.
     */
    async processAutomatedStatusUpdates() {
        if (!hasuraClient) {
            throw new Error('Hasura client is not initialized');
        }

        try {
            const data = await hasuraClient.request<{ shop_subscriptions: any[] }>(GET_SUBSCRIPTIONS_FOR_AUTOMATION);
            const subscriptions = data.shop_subscriptions;
            const now = new Date();
            const results = {
                total: subscriptions.length,
                updated: 0,
                invoicesGenerated: 0,
                errors: 0,
                log: [] as string[]
            };

            for (const sub of subscriptions) {
                if (!sub.end_date) continue;

                const endDate = new Date(sub.end_date);
                const diffDays = (endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24);

                // --- 1. Status Automation Logic ---
                let newStatus: string | null = null;
                if (sub.status === 'active' && diffDays <= 14 && diffDays > 0) {
                    newStatus = 'due_soon';
                } else if ((sub.status === 'active' || sub.status === 'due_soon') && diffDays <= -3) {
                    newStatus = 'on_hold';
                } else if (sub.status === 'on_hold' && diffDays <= -30) {
                    newStatus = 'expired';
                }

                if (newStatus && newStatus !== sub.status) {
                    try {
                        await hasuraClient.request(UPDATE_SUBSCRIPTION_STATUS, {
                            id: sub.id,
                            status: newStatus
                        });
                        results.updated++;
                        results.log.push(`Status Updated ${sub.id}: ${sub.status} -> ${newStatus}`);
                    } catch (err) {
                        results.errors++;
                        console.error(`Failed to update status ${sub.id}:`, err);
                    }
                }

                // --- 2. Billing Automation Logic (Invoice Generation) ---
                // If it's due soon (within 14 days), generate the invoice for the next period 
                // if we haven't already generated one for this cycle.
                if (diffDays <= 14 && diffDays > -1) {
                    try {
                        // Check if invoice for this expected "start of next cycle" already exists
                        // To keep it simple, we just check if any pending invoice exists for this subscription created recently
                        const existingInvoices = await hasuraClient.request<any>(gql`
                            query CheckRecentInvoice($subId: uuid!) {
                                subscription_invoices(
                                    where: { 
                                        shopSubscription_id: { _eq: $subId },
                                        status: { _eq: "pending" },
                                        created_at: { _gt: "${new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString()}" }
                                    }
                                    limit: 1
                                ) {
                                    id
                                }
                            }
                        `, { subId: sub.id });

                        if (existingInvoices.subscription_invoices.length === 0) {
                            await this.generateInvoice(sub, undefined, now);
                            results.invoicesGenerated++;
                            results.log.push(`Invoice Generated for ${sub.id}`);
                        }
                    } catch (err) {
                        console.error(`Failed to generate invoice for ${sub.id}:`, err);
                    }
                }
            }

            return results;
        } catch (error) {
            console.error('Error in automated updates:', error);
            throw new Error('Failed to process automation');
        }
    }
}
