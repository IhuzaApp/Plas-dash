export interface Promotion {
  id: string;
  name: string;
  code?: string;
  promotion_type: string;
  discount_type: string;
  discount_value: string;
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
  created_at: string;
  update_on: string;
  promotion_scope?: string;
  customer_discount_percent?: number;
  influencer_id?: string;
  influencer_code?: string;
  earning_per_order?: number;
  Influencer?: {
    name: string;
    code: string;
  };
}
