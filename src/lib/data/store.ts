import type { AppUser, SaleRecord } from "./types";

export const sales: SaleRecord[] = [
  { id: "v1", product: "Bicicleta Dobrável Elétrica", buyer: "Carlos M.", date: "2026-07-22", price: 2899.9, status: "concluida", method: "Pix" },
  { id: "v2", product: "Televisão Smart 50\"", buyer: "Mariana L.", date: "2026-07-21", price: 2199.0, status: "concluida", method: "Cartão" },
  { id: "v3", product: "Patinete Elétrico", buyer: "Pedro R.", date: "2026-07-18", price: 1599.0, status: "cancelada", method: "Pix" },
  { id: "v4", product: "Mountain Bike Elétrica", buyer: "Fernanda C.", date: "2026-07-16", price: 4499.0, status: "concluida", method: "Cartão" },
  { id: "v5", product: "Máquina de Lavar", buyer: "Lucas P.", date: "2026-07-12", price: 1299.0, status: "cancelada", method: "Pix" },
];

export const users: AppUser[] = [
  { id: "u1", name: "João Silva", email: "joao@exemplo.com", role: "admin", status: "ativo", createdAt: "2026-01-10" },
  { id: "u2", name: "TechStore Brasil", email: "contato@techstore.com", role: "user", status: "ativo", createdAt: "2026-02-15" },
  { id: "u3", name: "Maria Souza", email: "maria@exemplo.com", role: "user", status: "bloqueado", createdAt: "2026-03-20" },
  { id: "u4", name: "Carlos M.", email: "carlos@exemplo.com", role: "user", status: "expirado", expiresAt: "2026-07-01", createdAt: "2026-04-01" },
];

export const blockedIps: { ip: string; reason: string; date: string }[] = [
  { ip: "187.45.12.33", reason: "Tentativa de fraude", date: "2026-07-15" },
  { ip: "200.150.99.2", reason: "Comportamento suspeito", date: "2026-07-10" },
];

export const notifications: { id: string; title: string; body: string; date: string }[] = [
  { id: "n1", title: "Nova venda", body: "Scooter Elétrica foi vendido via Pix.", date: "2026-07-22" },
  { id: "n2", title: "Avaliação recebida", body: "Você recebeu uma nova avaliação de 5 estrelas.", date: "2026-07-21" },
  { id: "n3", title: "Conta expirando", body: "A conta de Carlos M. expira em 1 dia.", date: "2026-07-20" },
];
