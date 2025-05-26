export interface User {
  id: string;
  name: string;
  email: string;
}

export interface Address {
  street: string;
  city: string;
  postal_code: string;
}

export interface Shopper {
  id: string;
  name: string;
  phone: string;
  email: string;
}

export interface Product {
  id: string;
  name: string;
  price: string;
  description?: string;
}

export interface OrderItem {
  id: string;
  product_id: string;
  quantity: number;
  price: string;
}

export interface Order {
  id: string;
  OrderID: string;
  user_id: string;
  shopper_id: string;
  total: string;
  status: string;
  delivery_address_id: string;
  delivery_photo_url: string;
  delivery_notes: string;
  created_at: string;
  updated_at: string;
  delivery_time: string | null;
  combined_order_id: string | null;
  shop_id: string;
  delivery_fee: string;
  service_fee: string;
  discount: string;
  voucher_code: string | null;
  User: User;
  Order_Items: OrderItem[];
  Address: Address;
  shopper?: Shopper;
}
