export interface Promotion {
  id: string;
  name: string;
  code?: string;

  promotion_type: string;
  discount_type?: string;

  discount_value?: string;
  customer_discount_percent?: number;

  // 💰 ECONOMICS — who pays and how
  funded_by: 'platform' | 'merchant' | 'shared';
  affects: 'subtotal' | 'delivery_fee' | 'service_fee' | 'total';
  stacking_type: 'exclusive' | 'with_referral' | 'stackable';

  max_discount?: number;
  min_order_value?: number;

  // 🚚 DELIVERY CONTROL
  free_delivery?: boolean;
  delivery_paid_by?: 'platform' | 'merchant' | 'shared';

  // 💰 BUDGET — budget_used is READ-ONLY, managed by backend only
  budget_limit?: number;
  budget_used?: number;

  // 👤 INFLUENCER COMMISSION (only when business_type = 'none')
  influencer_id?: string;
  influencer_code?: string;
  commission_type?: 'fixed' | 'percentage';
  commission_value?: number;
  commission_cap?: number;

  // EXISTING FIELDS
  buy_quantity?: string;
  get_quantity?: string;
  applies_to_type: string;
  applies_to_id?: string;
  restaurant_id?: string;
  shop_id?: string;

  Restaurant?: {
    name: string;
    is_active: boolean;
    phone: string;
    profile: string;
    tin: string;
    ussd: string;
  };
  Shop?: {
    name: string;
    description: string;
    category_id: string;
    created_at: string;
    logo: string;
    longitude: string;
    latitude: string;
    image: string;
    phone: string;
    relatedTo: string;
    ssd: string;
    tin: string;
  };

  Influencer?: {
    name: string;
    code: string;
  };

  start_date: string;
  end_date: string;
  start_time?: string;
  end_time?: string;
  min_purchase_amount: string;
  usage_per_customer?: number;
  usage_limit?: number;
  priority: number;
  status: 'active' | 'scheduled' | 'disabled';
  is_stackable: boolean;
  promotion_scope?: string;
  created_at: string;
  update_on: string;
}
