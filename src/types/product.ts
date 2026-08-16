export interface Product {
  id: number;
  title: string;
  description: string;
  price: number;
  category: string;
  image_url: string | null;
  stock: number;
  created_at: string;
}

export const CATEGORIES = ["electronics", "apparel", "home", "accessories"] as const;
export type Category = (typeof CATEGORIES)[number];
