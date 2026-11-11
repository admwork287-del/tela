import { createFileRoute } from "@tanstack/react-router";
import { PixSettings } from "@/components/admin/PixSettings";

export const Route = createFileRoute("/painel/configuracoes")({
  head: () => ({ meta: [{ title: "Configuração do Pix - Painel OLX" }, { name: "robots", content: "noindex" }] }),
  component: PixSettings,
});
