import { createFileRoute } from "@tanstack/react-router";
import { Chat } from "@/components/admin/Chat";

export const Route = createFileRoute("/painel/chat")({
  head: () => ({ meta: [{ title: "Chat - Painel OLX" }, { name: "robots", content: "noindex" }] }),
  component: Chat,
});
