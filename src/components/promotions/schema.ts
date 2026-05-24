import * as z from 'zod';
import { addDays } from 'date-fns';

export const promotionFormSchema = z
  .object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    code: z.string().optional(),
    promotion_type: z.enum(['percentage', 'fixed', 'bogo', 'rush_hour', 'flash_sale', 'bundle'], {
      message: 'Promotion type is required.',
    }),
    discount_value: z.string().optional(),
    buy_quantity: z.string().optional(),
    get_quantity: z.string().optional(),
    applies_to_type: z.enum(['specific_product', 'category', 'entire_store'], {
      message: 'Please select what this applies to.',
    }),
    applies_to_id: z.string().optional(),
    business_type: z.enum(['restaurant', 'shop', 'none']).default('restaurant'),
    business_id: z.string().optional(),
    start_date: z.date({ message: 'Start date is required.' }),
    end_date: z.date({ message: 'End date is required.' }),
    start_time: z.string().optional(),
    end_time: z.string().optional(),
    min_purchase_amount: z.string().optional(),
    usage_per_customer: z.string().optional(),
    usage_limit: z.string().optional(),
    priority: z.string().default('10'),
    is_stackable: z.boolean().default(false),
    status: z.enum(['active', 'scheduled', 'disabled']).default('active'),
    promotion_scope: z.string().default('all_orders'),
    customer_discount_percent: z.string().optional(),

    // Influencer fields (only used when business_type = 'none')
    influencer_id: z.string().optional(),
    influencer_code: z.string().optional(),
    // ✅ COMMISSION FIELDS — replaces earning_per_order
    commission_type: z.enum(['fixed', 'percentage']).optional(),
    commission_value: z.string().optional(),
    commission_cap: z.string().optional(),

    // 💰 ECONOMICS
    funded_by: z.enum(['platform', 'merchant', 'shared']).default('platform'),
    affects: z.enum(['subtotal', 'delivery_fee', 'service_fee', 'total']).default('subtotal'),
    stacking_type: z.enum(['exclusive', 'with_referral', 'stackable']).default('exclusive'),
    max_discount: z.string().optional(),
    min_order_value: z.string().optional(),

    // 🚚 DELIVERY
    free_delivery: z.boolean().default(false),
    delivery_paid_by: z.enum(['platform', 'merchant', 'shared']).optional(),

    // 💰 BUDGET
    budget_limit: z.string().optional(),
  })
  .refine(
    data => {
      if (data.business_type !== 'none' && !data.business_id) {
        return false;
      }
      return true;
    },
    {
      message: 'Please select a business.',
      path: ['business_id'],
    }
  )
  .refine(
    data => {
      // Skip discount checks for Influencer Promotions (None)
      if (data.business_type === 'none') {
        return true;
      }
      if (
        data.promotion_type === 'percentage' &&
        (!data.discount_value ||
          isNaN(Number(data.discount_value)) ||
          Number(data.discount_value) <= 0 ||
          Number(data.discount_value) > 100)
      ) {
        return false;
      }
      if (
        data.promotion_type === 'fixed' &&
        (!data.discount_value ||
          isNaN(Number(data.discount_value)) ||
          Number(data.discount_value) <= 0)
      ) {
        return false;
      }
      if (data.promotion_type === 'bogo' && (!data.buy_quantity || !data.get_quantity)) {
        return false;
      }
      return true;
    },
    {
      message: 'Invalid discount details for the selected promotion type',
      path: ['discount_value'],
    }
  )
  // 🔴 CRITICAL: delivery_paid_by is required when free_delivery = true
  .refine(
    data => {
      if (data.free_delivery && !data.delivery_paid_by) {
        return false;
      }
      return true;
    },
    {
      message: 'Delivery payer is required when free delivery is enabled',
      path: ['delivery_paid_by'],
    }
  )
  // 🔴 CRITICAL: commission_value percentage cannot exceed 100%
  .refine(
    data => {
      // Only apply this check to influencer promotions using a percentage commission
      if (data.business_type === 'none' && data.commission_type === 'percentage') {
        if (data.commission_value) {
          return Number(data.commission_value) <= 100;
        }
      }
      return true;
    },
    {
      message: 'Percentage commission cannot exceed 100%',
      path: ['commission_value'],
    }
  )
  // 🔴 CRITICAL: commission_value must be non-negative
  .refine(
    data => {
      if (data.business_type === 'none' && data.commission_value) {
        return Number(data.commission_value) >= 0;
      }
      return true;
    },
    {
      message: 'Commission value must be 0 or greater',
      path: ['commission_value'],
    }
  )
  // 🔴 CRITICAL: Null handling for commission fields — must be empty for standard promos
  .refine(
    data => {
      if (data.business_type !== 'none') {
        // Strict enforcement: if it's not an influencer promo, these should be empty
        // Note: form clears these naturally, but this is an extra safety check
        return !data.commission_type && !data.commission_value && !data.commission_cap;
      }
      return true;
    },
    {
      message: 'Commission fields must be empty for standard promotions',
      path: ['commission_type'], // point to one field for UX
    }
  );

export type PromotionFormValues = z.infer<typeof promotionFormSchema>;

export const DEFAULT_FORM_VALUES: PromotionFormValues = {
  name: '',
  code: '',
  promotion_type: 'percentage',
  discount_value: '',
  buy_quantity: '',
  get_quantity: '',
  applies_to_type: 'entire_store',
  applies_to_id: '',
  business_type: 'restaurant',
  business_id: '',
  start_date: new Date(),
  end_date: addDays(new Date(), 7),
  start_time: '',
  end_time: '',
  min_purchase_amount: '',
  usage_per_customer: '10',
  usage_limit: '10',
  priority: '10',
  is_stackable: false,
  status: 'active',
  promotion_scope: 'public',
  customer_discount_percent: '',

  // Influencer
  influencer_id: 'none',
  influencer_code: '',
  commission_type: 'fixed',
  commission_value: '500',
  commission_cap: '500',

  // Economics
  funded_by: 'platform',
  affects: 'subtotal',
  stacking_type: 'exclusive',
  max_discount: '1000',
  min_order_value: '8000',

  // Delivery
  free_delivery: false,
  delivery_paid_by: undefined,

  // Budget
  budget_limit: '1000000',
};

export const generatePromotionCode = () => {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789abcdefghijklmnopqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
};
