import * as z from 'zod';
import { addDays } from 'date-fns';

export const promotionFormSchema = z.object({
    name: z.string().min(2, { message: 'Name must be at least 2 characters.' }),
    code: z.string().optional(),
    promotion_type: z.enum([
        'percentage',
        'fixed',
        'bogo',
        'rush_hour',
        'flash_sale',
        'bundle'
    ], { message: 'Promotion type is required.' }),
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
    influencer_id: z.string().optional(),
    influencer_code: z.string().optional(),
    earning_per_order: z.string().optional(),
})
    .refine(data => {
        if (data.business_type !== 'none' && !data.business_id) {
            return false;
        }
        return true;
    }, {
        message: "Please select a business.",
        path: ["business_id"]
    })
    .refine(data => {
        // Skip these checks for Influencer Promotions (None) as they use customer_discount_percent instead
        if (data.business_type === 'none') {
            return true;
        }

        if (data.promotion_type === 'percentage' && (!data.discount_value || isNaN(Number(data.discount_value)) || Number(data.discount_value) <= 0 || Number(data.discount_value) > 100)) {
            return false;
        }
        if (data.promotion_type === 'fixed' && (!data.discount_value || isNaN(Number(data.discount_value)) || Number(data.discount_value) <= 0)) {
            return false;
        }
        if (data.promotion_type === 'bogo' && (!data.buy_quantity || !data.get_quantity)) {
            return false;
        }
        return true;
    }, {
        message: "Invalid discount details for the selected promotion type",
        path: ["discount_value"],
    });

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
    influencer_id: 'none',
    influencer_code: '',
    earning_per_order: '',
};

export const generatePromotionCode = () => {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 8; i++) {
        code += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return code;
};
