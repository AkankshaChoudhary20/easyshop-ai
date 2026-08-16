export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled";

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  price_at_purchase: number;
  title?: string;
  image_url?: string | null;
}

export interface Order {
  id: number;
  user_id: number;
  status: OrderStatus;
  total: number;
  created_at: string;
  items?: OrderItem[];
}
