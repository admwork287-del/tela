import { useSyncExternalStore } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type {
  AdminProduct,
  Activity,
  BlockedIp,
  AuthUser,
  Profile,
  UserStats,
  SellerConfig,
} from "./types";

interface AdminState {
  user: AuthUser | null;
  profile: Profile;
  stats: UserStats;
  config: SellerConfig;
  isAdmin: boolean;
  products: AdminProduct[];
  activities: Activity[];
  blockedIps: BlockedIp[];
  loading: boolean;
  initialized: boolean;
}

const emptyProfile: Profile = { name: "", display_id: 0, valid_until: null };
const emptyStats: UserStats = { total_access: 0, pix_generated: 0, pix_copied: 0 };
const emptyConfig: SellerConfig = {
  seller_name: "", cpf: "", city: "",
  since: "", sales_completed: 0, sales_canceled: 0, reviews_count: 0, avg_delivery_hours: 24,
};

let state: AdminState = {
  user: null,
  profile: emptyProfile,
  stats: emptyStats,
  config: emptyConfig,
  isAdmin: false,
  products: [],
  activities: [],
  blockedIps: [],
  loading: true,
  initialized: false,
};

type Listener = () => void;
const listeners = new Set<Listener>();
const notify = () => listeners.forEach((l) => l());
const subscribe = (l: Listener) => { listeners.add(l); return () => { listeners.delete(l); }; };

function setState(patch: Partial<AdminState>) {
  state = { ...state, ...patch };
  notify();
}

export function useAdminStore<T>(selector: (s: AdminState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state), () => selector(state));
}
export const getState = () => state;

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function mapProduct(row: Record<string, unknown>): AdminProduct {
  const r = row as Record<string, unknown>;
  return {
    id: String(r.id),
    slug: String(r.slug ?? ""),
    name: String(r.name ?? ""),
    description: String(r.description ?? ""),
    price: Number(r.price ?? 0),
    garantia_olx: Number(r.garantia_olx ?? 0),
    image1_url: String(r.image1_url ?? ""),
    image2_url: String(r.image2_url ?? ""),
    image3_url: String(r.image3_url ?? ""),
    neighborhood: String(r.neighborhood ?? ""),
    city: String(r.city ?? ""),
    state: String(r.state ?? ""),
    cep: String(r.cep ?? ""),
    seller_name: String(r.seller_name ?? ""),
    seller_cpf: String(r.seller_cpf ?? ""),
    seller_avatar_url: String(r.seller_avatar_url ?? ""),
    category: String(r.category ?? ""),
    brand: String(r.brand ?? ""),
    condition: String(r.condition ?? ""),
    product_type: String(r.product_type ?? ""),
    voltage: String(r.voltage ?? ""),
    publish_date: String(r.publish_date ?? ""),
    publish_time: String(r.publish_time ?? ""),
    extra_fields: (r.extra_fields as Record<string, string>) ?? {},
    views: Number(r.views ?? 0),
    sales: Number(r.sales ?? 0),
    credit_card_enabled: Boolean(r.credit_card_enabled),
    pay_on_delivery_enabled: Boolean(r.pay_on_delivery_enabled),
    pay_on_delivery_whatsapp: (r.pay_on_delivery_whatsapp as string | null) ?? null,
    pay_on_delivery_show_button: r.pay_on_delivery_show_button === undefined ? true : Boolean(r.pay_on_delivery_show_button),
    credit_card_payment_link: (r.credit_card_payment_link as string | null) ?? null,
    credit_card_type: ((r.credit_card_type as any) ?? "external") as "external" | "native",
    pix_mode: (r.pix_mode as "manual" | "automatic") ?? "manual",
    pix_copia_cola: (r.pix_copia_cola as string | null) ?? null,
    qr_code_url: (r.qr_code_url as string | null) ?? null,
    processor_name: String(r.processor_name ?? ""),
    blackcat_customer_name: (r.blackcat_customer_name as string | null) ?? null,
    blackcat_customer_email: (r.blackcat_customer_email as string | null) ?? null,
    blackcat_customer_phone: (r.blackcat_customer_phone as string | null) ?? null,
    blackcat_customer_document: (r.blackcat_customer_document as string | null) ?? null,
    created_at: String(r.created_at ?? new Date().toISOString()),
  };
}

async function loadAll(userId: string) {
  setState({ loading: true });
  const [profRes, roleRes, adminRes, statsRes, sellerRes, prodRes, actRes, ipRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", userId),
    supabase.rpc("has_role", { _user_id: userId, _role: "admin" }),
    supabase.from("user_stats").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("seller_settings").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("products").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200),
    supabase.from("blocked_ips").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
  ]);

  const roles = (roleRes.data ?? []).map((r) => r.role as string);
  const isAdmin = adminRes.error ? roles.includes("admin") : adminRes.data === true;

  const prof = profRes.data;
  const st = statsRes.data;
  const sc = sellerRes.data;

  setState({
    profile: prof ? {
      name: (prof.name as string) || (prof.email as string) || "",
      display_id: Number(prof.display_id ?? 0),
      valid_until: (prof.valid_until as string | null) ?? null,
    } : emptyProfile,
    isAdmin,
    stats: st ? {
      total_access: Number(st.total_access ?? 0),
      pix_generated: Number(st.pix_generated ?? 0),
      pix_copied: Number(st.pix_copied ?? 0),
    } : emptyStats,

    config: sc ? {
      seller_name: String(sc.seller_name ?? ""),
      cpf: String(sc.cpf ?? ""),
      city: String(sc.city ?? ""),
      since: String((sc as any).since ?? ""),
      sales_completed: Number((sc as any).sales_completed ?? 0),
      sales_canceled: Number((sc as any).sales_canceled ?? 0),
      reviews_count: Number((sc as any).reviews_count ?? 0),
      avg_delivery_hours: Number((sc as any).avg_delivery_hours ?? 24),
    } : emptyConfig,
    products: (prodRes.data ?? []).map(mapProduct),
    activities: (actRes.data ?? []) as unknown as Activity[],
    blockedIps: (ipRes.data ?? []) as unknown as BlockedIp[],
    loading: false,
    initialized: true,
  });
  void refreshStats(userId);
}


async function refreshProducts(userId: string) {
  const { data } = await supabase.from("products").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  setState({ products: (data ?? []).map(mapProduct) });
}
async function refreshStats(userId: string) {
  const [accessRes, genRes, copyRes] = await Promise.all([
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "product_view"),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "pix_generated"),
    supabase.from("activities").select("id", { count: "exact", head: true }).eq("user_id", userId).eq("type", "pix_copied"),
  ]);
  setState({ stats: {
    total_access: accessRes.count ?? 0,
    pix_generated: genRes.count ?? 0,
    pix_copied: copyRes.count ?? 0,
  }});
}
async function refreshActivities(userId: string) {
  const { data } = await supabase.from("activities").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(200);
  setState({ activities: (data ?? []) as unknown as Activity[] });
  void refreshStats(userId);
}

async function refreshBlockedIps(userId: string) {
  const { data } = await supabase.from("blocked_ips").select("*").eq("user_id", userId).order("created_at", { ascending: false });
  setState({ blockedIps: (data ?? []) as unknown as BlockedIp[] });
}

// Expiry handling — real-time logout when profile.valid_until passes
let expiryTimeout: ReturnType<typeof setTimeout> | null = null;
let expiryChannel: ReturnType<typeof supabase.channel> | null = null;
let expiryPoll: ReturnType<typeof setInterval> | null = null;
let loggingOut = false;

async function forceExpiredLogout() {
  if (loggingOut) return;
  loggingOut = true;
  if (expiryTimeout) { clearTimeout(expiryTimeout); expiryTimeout = null; }
  if (expiryPoll) { clearInterval(expiryPoll); expiryPoll = null; }
  toast.error("Sua validade expirou. Faça login novamente.");
  try { await supabase.auth.signOut(); } catch { /* ignore */ }
  if (typeof window !== "undefined") window.location.href = "/auth";
}

function scheduleExpiryCheck(validUntil: string | null) {
  if (expiryTimeout) { clearTimeout(expiryTimeout); expiryTimeout = null; }
  if (!validUntil) return;
  const ms = new Date(validUntil).getTime() - Date.now();
  if (Number.isNaN(ms)) return;
  if (ms <= 0) { void forceExpiredLogout(); return; }
  // setTimeout maxes ~24.8 days; cap it so it still fires.
  expiryTimeout = setTimeout(() => { void forceExpiredLogout(); }, Math.min(ms, 2_000_000_000));
}

// Fallback: poll the DB in case realtime is unavailable (or the admin
// shortened the validity while this tab was idle).
function startExpiryPolling(userId: string) {
  if (expiryPoll) { clearInterval(expiryPoll); expiryPoll = null; }
  expiryPoll = setInterval(async () => {
    if (!state.user) return;
    const { data } = await supabase
      .from("profiles")
      .select("valid_until")
      .eq("id", userId)
      .maybeSingle();
    const next = (data?.valid_until as string | null) ?? null;
    if (next !== state.profile.valid_until) {
      setState({ profile: { ...state.profile, valid_until: next } });
      scheduleExpiryCheck(next);
    }
    if (next && new Date(next).getTime() <= Date.now()) void forceExpiredLogout();
    void refreshStats(userId);
  }, 30_000);

}

function subscribeProfileExpiry(userId: string) {
  if (expiryChannel) { supabase.removeChannel(expiryChannel); expiryChannel = null; }
  expiryChannel = supabase
    .channel(`profile-expiry-${userId}`)
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "profiles", filter: `id=eq.${userId}` },
      (payload) => {
        const next = (payload.new as { valid_until?: string | null } | null)?.valid_until ?? null;
        setState({ profile: { ...state.profile, valid_until: next } });
        scheduleExpiryCheck(next);
      },
    )
    .subscribe();
}


let activitiesChannel: ReturnType<typeof supabase.channel> | null = null;
function subscribeActivities(userId: string) {
  if (activitiesChannel) { supabase.removeChannel(activitiesChannel); activitiesChannel = null; }
  activitiesChannel = supabase
    .channel(`activities-${userId}`)
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "activities", filter: `user_id=eq.${userId}` },
      () => { refreshActivities(userId); },
    )
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "user_stats", filter: `user_id=eq.${userId}` },
      (payload) => {
        const n = payload.new as Record<string, unknown> | null;
        if (!n) return;
        setState({ stats: {
          total_access: Number(n.total_access ?? 0),
          pix_generated: Number(n.pix_generated ?? 0),
          pix_copied: Number(n.pix_copied ?? 0),
        }});
      },
    )
    .subscribe();
}

function clearExpiryWatchers() {
  if (expiryTimeout) { clearTimeout(expiryTimeout); expiryTimeout = null; }
  if (expiryPoll) { clearInterval(expiryPoll); expiryPoll = null; }
  if (expiryChannel) { supabase.removeChannel(expiryChannel); expiryChannel = null; }
  if (activitiesChannel) { supabase.removeChannel(activitiesChannel); activitiesChannel = null; }
}


// Bootstrap: subscribe to auth once
let bootstrapped = false;
export function initAdminAuth() {
  if (bootstrapped) return;
  bootstrapped = true;

  let currentUserId: string | null = null;
  const applySession = async (userObj: { id: string; email?: string | null } | null) => {
    if (!userObj) {
      if (currentUserId === null && state.initialized) return;
      currentUserId = null;
      clearExpiryWatchers();
      setState({
        user: null,
        profile: emptyProfile,
        stats: emptyStats,
        config: emptyConfig,
        isAdmin: false,
        products: [],
        activities: [],
        blockedIps: [],
        loading: false,
        initialized: true,
      });
      return;
    }
    if (currentUserId === userObj.id) return;
    currentUserId = userObj.id;
    setState({ user: { id: userObj.id, email: userObj.email ?? "" } });
    await loadAll(userObj.id);
    scheduleExpiryCheck(state.profile.valid_until);
    startExpiryPolling(userObj.id);
    subscribeProfileExpiry(userObj.id);
    subscribeActivities(userObj.id);

  };

  supabase.auth.getSession().then(({ data }) => {
    applySession(data.session?.user ?? null);
  });

  supabase.auth.onAuthStateChange((event, session) => {
    if (event !== "SIGNED_IN" && event !== "SIGNED_OUT") return;
    applySession(session?.user ?? null);
  });

  if (typeof window !== "undefined") {
    // Catch expiry that passes while tab was hidden/asleep.
    window.addEventListener("focus", () => {
      const vu = state.profile.valid_until;
      if (vu && new Date(vu).getTime() <= Date.now() && state.user) void forceExpiredLogout();
    });
  }
}


function requireUser(): string | null {
  const u = state.user;
  if (!u) { toast.error("Faça login para continuar"); return null; }
  return u.id;
}

export const adminActions = {
  refetchActivities() {
    const userId = state.user?.id;
    if (userId) refreshActivities(userId);
  },
  refetchBlockedIps() {
    const userId = state.user?.id;
    if (userId) refreshBlockedIps(userId);
  },
  addProduct(input: Partial<AdminProduct>): true {
    const userId = requireUser();
    if (!userId) return true;
    (async () => {
      const [{ data: prof }, { count }] = await Promise.all([
        supabase.from("profiles").select("product_limit").eq("id", userId).maybeSingle(),
        supabase.from("products").select("id", { count: "exact", head: true }).eq("user_id", userId),
      ]);
      const limit = (prof as { product_limit?: number } | null)?.product_limit ?? 5;
      if ((count ?? 0) >= limit) {
        toast.error(`Limite de ${limit} produto(s) atingido. Contate o administrador.`);
        return;
      }
      const payload = {
        user_id: userId,
        slug: slugify(input.name || "produto") + "-" + Math.random().toString(36).slice(2, 7),
        name: input.name ?? "",
        description: input.description ?? "",
        price: input.price ?? 0,
        garantia_olx: input.garantia_olx ?? 0,
        image1_url: input.image1_url ?? "",
        image2_url: input.image2_url ?? "",
        image3_url: input.image3_url ?? "",
        neighborhood: input.neighborhood ?? "",
        city: input.city ?? "",
        state: input.state ?? "",
        cep: input.cep ?? "",
        seller_name: input.seller_name ?? "",
        seller_cpf: input.seller_cpf ?? "",
        seller_avatar_url: input.seller_avatar_url ?? "",
        category: input.category ?? "",
        brand: input.brand ?? "",
        condition: input.condition ?? "Novo",
        product_type: input.product_type ?? "",
        voltage: input.voltage ?? "",
        publish_date: input.publish_date ?? "",
        publish_time: input.publish_time ?? "",
        extra_fields: input.extra_fields ?? {},
        credit_card_enabled: input.credit_card_enabled ?? false,
        pay_on_delivery_enabled: input.pay_on_delivery_enabled ?? false,
        pay_on_delivery_whatsapp: input.pay_on_delivery_whatsapp ?? null,
        pay_on_delivery_show_button: input.pay_on_delivery_show_button ?? true,
        credit_card_payment_link: input.credit_card_payment_link ?? null,
        credit_card_type: input.credit_card_type ?? "external",
        pix_mode: input.pix_mode ?? "manual",
        pix_copia_cola: input.pix_copia_cola ?? null,
        qr_code_url: input.qr_code_url ?? null,
        processor_name: input.processor_name ?? "",
        blackcat_customer_name: input.blackcat_customer_name ?? null,
        blackcat_customer_email: input.blackcat_customer_email ?? null,
        blackcat_customer_phone: input.blackcat_customer_phone ?? null,
        blackcat_customer_document: input.blackcat_customer_document ?? null,
      };
      const { error } = await supabase.from("products").insert(payload);
      if (error) { toast.error("Erro ao cadastrar: " + error.message); return; }
      await refreshProducts(userId);
    })();
    return true;
  },

  updateProduct(id: string, patch: Partial<AdminProduct>): true {
    const userId = requireUser();
    if (!userId) return true;
    const cleanPatch: Record<string, unknown> = { ...patch };
    delete cleanPatch.id;
    delete cleanPatch.created_at;
    if (patch.name) cleanPatch.slug = slugify(patch.name) + "-" + id.slice(0, 5);
    (async () => {
      const { error } = await supabase.from("products").update(cleanPatch).eq("id", id);
      if (error) { toast.error("Erro ao atualizar: " + error.message); return; }
      await refreshProducts(userId);
    })();
    return true;
  },

  deleteProduct(id: string): true {
    const userId = requireUser();
    if (!userId) return true;
    (async () => {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) { toast.error("Erro ao excluir: " + error.message); return; }
      await refreshProducts(userId);
    })();
    return true;
  },

  deleteActivity(id: string): true {
    const userId = requireUser();
    if (!userId) return true;
    (async () => {
      const { error } = await supabase.from("activities").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
      await refreshActivities(userId);
    })();
    return true;
  },

  clearActivities(): true {
    const userId = requireUser();
    if (!userId) return true;
    (async () => {
      const { error } = await supabase.from("activities").delete().eq("user_id", userId);
      if (error) { toast.error(error.message); return; }
      await refreshActivities(userId);
    })();
    return true;
  },

  blockIp(ip: string, blockType: "block" | "refund" = "block", refundCode?: string): boolean {
    const userId = requireUser();
    if (!userId) return false;
    if (state.blockedIps.some((b) => b.ip === ip)) return false;
    (async () => {
      const { error } = await supabase.from("blocked_ips").insert({
        user_id: userId, ip, block_type: blockType, refund_code: refundCode ?? null,
      });
      if (error) { toast.error(error.message); return; }
      await refreshBlockedIps(userId);
    })();
    return true;
  },

  unblockIp(id: string): true {
    const userId = requireUser();
    if (!userId) return true;
    (async () => {
      const { error } = await supabase.from("blocked_ips").delete().eq("id", id);
      if (error) { toast.error(error.message); return; }
      await refreshBlockedIps(userId);
    })();
    return true;
  },

  updateRefundCode(id: string, code: string): true {
    const userId = requireUser();
    if (!userId) return true;
    (async () => {
      const { error } = await supabase.from("blocked_ips").update({ refund_code: code }).eq("id", id);
      if (error) { toast.error(error.message); return; }
      await refreshBlockedIps(userId);
    })();
    return true;
  },

  updateConfig(patch: Partial<SellerConfig>): true {
    const userId = requireUser();
    if (!userId) return true;
    const next = { ...state.config, ...patch };
    setState({ config: next });
    (async () => {
      const { error } = await supabase.from("seller_settings").upsert({
        user_id: userId,
        seller_name: next.seller_name,
        cpf: next.cpf,
        city: next.city,
        since: next.since,
        sales_completed: next.sales_completed,
        sales_canceled: next.sales_canceled,
        reviews_count: next.reviews_count,
        avg_delivery_hours: next.avg_delivery_hours,
      } as any);
      if (error) toast.error(error.message);
    })();
    return true;
  },

  async signOut() {
    await supabase.auth.signOut();
  },
};
