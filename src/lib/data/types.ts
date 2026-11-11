export type ProductCondition = "Novo" | "Seminovo" | "Usado";

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  productName: string;
}

export interface Seller {
  id: string;
  name: string;
  avatarInitials: string;
  location: string;
  online: boolean;
  since: string;
  rating: number;
  reviewsCount: number;
  verified: boolean;
  reviews: Review[];
}

export interface ProductImage {
  url: string;
  alt: string;
}

export interface Product {
  id: string;
  slug: string;
  title: string;
  price: number;
  installments?: string;
  category: string;
  condition: ProductCondition;
  location: string;
  images: string[];
  description: string;
  details: { label: string; value: string }[];
  freeShipping: boolean;
  shippingTime: string;
  seller: Seller;
  badges: string[];
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface SaleRecord {
  id: string;
  product: string;
  buyer: string;
  date: string;
  price: number;
  status: "concluida" | "cancelada";
  method: "Pix" | "Cartão";
}

export interface AppUser {
  id: string;
  name: string;
  email: string;
  role: "admin" | "user";
  status: "ativo" | "bloqueado" | "expirado";
  expiresAt?: string;
  createdAt: string;
}
