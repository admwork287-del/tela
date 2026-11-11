export interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  garantia_olx: number;
  image1_url: string;
  image2_url: string;
  image3_url: string;
  neighborhood: string;
  city: string;
  state: string;
  cep: string;
  seller_name: string;
  seller_cpf: string;
  seller_avatar_url: string;
  category: string;
  brand: string;
  condition: string;
  product_type: string;
  voltage: string;
  publish_date: string;
  publish_time: string;
  extra_fields: Record<string, string>;
  views: number;
  sales: number;
  credit_card_enabled: boolean;
  pay_on_delivery_enabled: boolean;
  pay_on_delivery_whatsapp: string | null;
  pay_on_delivery_show_button: boolean;
  credit_card_payment_link: string | null;
  credit_card_type: "external" | "native";
  pix_mode: "manual" | "automatic";
  pix_copia_cola: string | null;
  qr_code_url: string | null;
  processor_name: string;
  blackcat_customer_name: string | null;
  blackcat_customer_email: string | null;
  blackcat_customer_phone: string | null;
  blackcat_customer_document: string | null;
  created_at: string;
}

export type ProductInput = Omit<
  AdminProduct,
  "id" | "slug" | "views" | "sales" | "created_at" | "credit_card_enabled" | "pay_on_delivery_enabled" | "pay_on_delivery_whatsapp" | "pay_on_delivery_show_button" | "credit_card_payment_link" | "credit_card_type" | "pix_mode" | "pix_copia_cola" | "qr_code_url" | "processor_name" | "blackcat_customer_name" | "blackcat_customer_email" | "blackcat_customer_phone" | "blackcat_customer_document"
> & Partial<Pick<AdminProduct, "credit_card_enabled" | "pay_on_delivery_enabled" | "pay_on_delivery_whatsapp" | "pay_on_delivery_show_button" | "credit_card_payment_link" | "credit_card_type" | "pix_mode" | "pix_copia_cola" | "qr_code_url" | "processor_name" | "blackcat_customer_name" | "blackcat_customer_email" | "blackcat_customer_phone" | "blackcat_customer_document">>;

export interface Activity {
  id: string;
  type: string;
  product_id?: string | null;
  product_name?: string | null;
  ip?: string | null;
  browser?: string | null;
  os?: string | null;
  details?: string | null;
  created_at: string;
}

export interface BlockedIp {
  id: string;
  ip: string;
  block_type: "block" | "refund";
  refund_code: string | null;
  created_at: string;
}

export interface AuthUser {
  id: string;
  email: string;
}

export interface Profile {
  name: string;
  display_id: number;
  valid_until: string | null;
}

export interface UserStats {
  total_access: number;
  pix_generated: number;
  pix_copied: number;
}

export interface SellerConfig {
  seller_name: string;
  cpf: string;
  city: string;
  since: string;
  sales_completed: number;
  sales_canceled: number;
  reviews_count: number;
  avg_delivery_hours: number;
}
