import { createFileRoute } from "@tanstack/react-router";
import { Dashboard } from "@/components/admin/Dashboard";

export const Route = createFileRoute("/painel/")({
  head: () => ({ meta: [{ title: "Painel - OLX" }] }),
  component: Dashboard,
});
