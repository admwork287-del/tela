import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./admin";

export interface ChatConversation {
  id: string;
  seller_id: string;
  product_id: string | null;
  product_name: string | null;
  customer_ip: string;
  last_message_at: string;
  created_at: string;
}

export interface ChatMessage {
  id: string;
  conversation_id: string;
  seller_id: string;
  sender_type: "seller" | "customer";
  message: string;
  created_at: string;
}

export function useSellerChat() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selectedRef = useRef<ChatConversation | null>(null);
  selectedRef.current = selectedConversation;

  const loadConversations = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("chat_conversations" as any)
      .select("*")
      .eq("seller_id", user.id)
      .order("last_message_at", { ascending: false });
    setConversations((data ?? []) as any);
    setLoading(false);
  }, [user]);

  const loadMessages = useCallback(async (conversationId: string) => {
    const { data } = await supabase
      .from("chat_messages" as any)
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });
    setMessages((data ?? []) as any);
  }, []);

  useEffect(() => {
    if (!user) return;
    loadConversations();
    const chConv = supabase
      .channel(`chat_conv_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_conversations", filter: `seller_id=eq.${user.id}` },
        () => loadConversations()
      )
      .subscribe();
    const chMsg = supabase
      .channel(`chat_msg_${user.id}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "chat_messages", filter: `seller_id=eq.${user.id}` },
        (payload) => {
          const row = (payload.new ?? payload.old) as any;
          if (selectedRef.current && row?.conversation_id === selectedRef.current.id) {
            loadMessages(selectedRef.current.id);
          }
          loadConversations();
        }
      )
      .subscribe();
    return () => {
      supabase.removeChannel(chConv);
      supabase.removeChannel(chMsg);
    };
  }, [user, loadConversations, loadMessages]);

  const selectConversation = useCallback(
    (c: ChatConversation | null) => {
      setSelectedConversation(c);
      setMessages([]);
      if (c) loadMessages(c.id);
    },
    [loadMessages]
  );

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      if (!user || !selectedConversation || !text.trim()) return false;
      setSending(true);
      const { error } = await supabase.from("chat_messages" as any).insert({
        conversation_id: selectedConversation.id,
        seller_id: user.id,
        sender_type: "seller",
        message: text.trim(),
      });
      if (!error) {
        await supabase
          .from("chat_conversations" as any)
          .update({ last_message_at: new Date().toISOString() })
          .eq("id", selectedConversation.id);
        await loadMessages(selectedConversation.id);
      }
      setSending(false);
      return !error;
    },
    [user, selectedConversation, loadMessages]
  );

  const deleteConversation = useCallback(
    async (id: string): Promise<boolean> => {
      setDeleting(true);
      const { error } = await supabase.from("chat_conversations" as any).delete().eq("id", id);
      setDeleting(false);
      if (!error) {
        if (selectedConversation?.id === id) setSelectedConversation(null);
        await loadConversations();
      }
      return !error;
    },
    [selectedConversation, loadConversations]
  );

  return {
    conversations,
    selectedConversation,
    messages,
    loading,
    sending,
    deleting,
    sendMessage,
    selectConversation,
    deleteConversation,
  };
}
