import { createFileRoute } from "@tanstack/react-router";
import { Products } from "@/components/admin/Products";

export const Route = createFileRoute("/painel/produtos/")({
  component: Products,
});
