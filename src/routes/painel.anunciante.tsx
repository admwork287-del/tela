import { createFileRoute } from "@tanstack/react-router";
import { SellerSettings } from "@/components/admin/SellerSettings";

export const Route = createFileRoute("/painel/anunciante")({
  head: () => ({ meta: [{ title: "Anunciante - Painel OLX" }, { name: "robots", content: "noindex" }] }),
  component: SellerSettings,
});
