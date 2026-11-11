import { createFileRoute, useParams } from "@tanstack/react-router";
import { ProductForm } from "@/components/admin/ProductForm";

export const Route = createFileRoute("/painel/produtos/$id")({
  component: EditProduct,
});

function EditProduct() {
  const { id } = useParams({ from: "/painel/produtos/$id" });
  return <ProductForm editingId={id} />;
}
