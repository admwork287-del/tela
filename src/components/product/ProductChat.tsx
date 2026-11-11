import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { X, Send, Loader2 } from "lucide-react";

interface Props {
  productId: string;
  productName: string;
  sellerId: string;
  onClose: () => void;
}

interface Msg {
  id: string;
  sender_type: "seller" | "customer";
  message: string;
  created_at: string;
}

const TOKEN_KEY = "olx_chat_token";

/** Token privado por navegador: garante que um cliente nunca veja a conversa de outro. */
function getCustomerToken(): string {
  try {
    let t = localStorage.getItem(TOKEN_KEY);
    if (!t || t.length < 16) {
      t = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`) + "-" +
        Math.random().toString(36).slice(2);
      localStorage.setItem(TOKEN_KEY, t);
    }
    return t;
  } catch {
    return `${Date.now()}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
  }
}

async function getIp(): Promise<string> {
  try {
    const r = await fetch("https://api.ipify.org?format=json");
    const j = await r.json();
    return j.ip || "unknown";
  } catch {
    return "unknown";
  }
}

export function ProductChat({ productId, productName, sellerId, onClose }: Props) {
  const [ip, setIp] = useState<string>("");
  const [convId, setConvId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const tokenRef = useRef<string>(getCustomerToken());

  const loadMessages = useCallback(async (cId: string) => {
    const { data } = await supabase.rpc("chat_customer_messages" as any, {
      p_conversation_id: cId,
      p_token: tokenRef.current,
    });
    setMessages((data ?? []) as any);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const myIp = await getIp();
      if (cancelled) return;
      setIp(myIp);
      const { data: cId } = await supabase.rpc("chat_open_conversation" as any, {
        p_seller_id: sellerId,
        p_product_id: productId,
        p_product_name: productName,
        p_customer_ip: myIp,
        p_token: tokenRef.current,
      });
      if (!cId || cancelled) return;
      setConvId(cId as string);
      await loadMessages(cId as string);
    })();
    return () => {
      cancelled = true;
    };
  }, [productId, sellerId, productName, loadMessages]);

  // Atualiza as respostas do vendedor (leitura direta é bloqueada por segurança, então usamos polling na RPC)
  useEffect(() => {
    if (!convId) return;
    const t = setInterval(() => loadMessages(convId), 3000);
    return () => clearInterval(t);
  }, [convId, loadMessages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!convId || !input.trim() || sending) return;
    setSending(true);
    const text = input.trim();
    setInput("");
    await supabase.rpc("chat_customer_send" as any, {
      p_conversation_id: convId,
      p_token: tokenRef.current,
      p_message: text,
    });
    await loadMessages(convId);
    setSending(false);
  }

  return (
    <div style={{
      position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 9998,
      display: "flex", alignItems: "flex-end", justifyContent: "center",
    }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 480, height: "80vh", background: "#fff",
          borderTopLeftRadius: 12, borderTopRightRadius: 12,
          display: "flex", flexDirection: "column",
        }}
      >
        <div style={{ padding: "14px 16px", borderBottom: "1px solid #eee", display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600, fontSize: 15 }}>Chat com vendedor</div>
            <div style={{ fontSize: 12, color: "#666" }}>{productName}</div>
          </div>
          <button onClick={onClose} aria-label="Fechar" style={{ background: "transparent", border: "none", cursor: "pointer" }}>
            <X size={22} />
          </button>
        </div>
        <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: 16, background: "#f7f7f7" }}>
          {messages.length === 0 && (
            <p style={{ textAlign: "center", color: "#888", fontSize: 13 }}>
              Envie uma mensagem para o vendedor.
            </p>
          )}
          {messages.map((m) => (
            <div key={m.id} style={{
              display: "flex", justifyContent: m.sender_type === "customer" ? "flex-end" : "flex-start",
              marginBottom: 8,
            }}>
              <div style={{
                maxWidth: "80%", padding: "8px 12px", borderRadius: 12, fontSize: 14,
                background: m.sender_type === "customer" ? "#6e0ad6" : "#fff",
                color: m.sender_type === "customer" ? "#fff" : "#111",
                border: m.sender_type === "customer" ? "none" : "1px solid #e5e5e5",
              }}>
                {m.message}
              </div>
            </div>
          ))}
        </div>
        <div style={{ display: "flex", gap: 8, padding: 12, borderTop: "1px solid #eee" }}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Digite sua mensagem..."
            disabled={!convId || sending}
            style={{ flex: 1, padding: "10px 12px", borderRadius: 8, border: "1px solid #ddd", fontSize: 14, outline: "none" }}
          />
          <button
            onClick={send}
            disabled={!convId || !input.trim() || sending}
            aria-label="Enviar"
            style={{
              width: 44, height: 44, borderRadius: 8, background: "#6e0ad6",
              color: "#fff", border: "none", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              opacity: !convId || !input.trim() || sending ? 0.5 : 1,
            }}
          >
            {sending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <div style={{ fontSize: 10, color: "#999", textAlign: "center", padding: "0 12px 8px" }}>
          IP: {ip || "carregando..."}
        </div>
      </div>
    </div>
  );
}
