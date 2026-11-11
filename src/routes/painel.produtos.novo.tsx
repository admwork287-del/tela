import { createFileRoute } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/painel/produtos/novo")({
  component: () => <ProductForm />,
});
