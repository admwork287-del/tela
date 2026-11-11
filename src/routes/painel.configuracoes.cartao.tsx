import { createFileRoute } from "@tanstack/react-router";
import { CardSettings } from "@/components/admin/CardSettings";

export const Route = createFileRoute("/painel/configuracoes/cartao")({
  head: () => ({ meta: [{ title: "Configuração do Cartão - Painel OLX" }, { name: "robots", content: "noindex" }] }),
  component: CardSettings,
});
