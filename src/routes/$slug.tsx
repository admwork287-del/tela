import { createFileRoute, Outlet, useMatch, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  Share2,
  Camera,
  Shield,
  Truck,
  CreditCard,
  MapPin,
  Calendar,
  Star,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Flag,
  Grid3X3,
  Tag,
  Zap,
  Box,
  ShoppingCart,
  MessageCircle,
  Loader2,
  X,
  Battery,
  Gauge,
  Weight,
  Ruler,
  Fuel,
  Settings,
} from "lucide-react";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerClose,
} from "@/components/ui/drawer";
import { supabase } from "@/integrations/supabase/client";
import { ProductChat } from "@/components/product/ProductChat";
import { isVisitorBlocked, logVisitorActivity } from "@/lib/tracking";
import { getCategoryConfig } from "@/config/categoryFields";
import olxLogo from "@/assets/olx-logo.png";
import paymentMethods from "@/assets/payments/payment-methods.png";
import pixIcon from "@/assets/pix-icon.png";
import garantiaModalIcon from "@/assets/garantia-modal-icon.png";
import entregaCasaIcon from "@/assets/icons/entrega-casa-icon.png";
import cliqueRetireIcon from "@/assets/icons/clique-retire-icon.png";
import dicasSegurancaIcon from "@/assets/icons/dicas-seguranca-icon.png";
import cityIcon from "@/assets/icons/city-icon.png";
import salesCompletedIcon from "@/assets/icons/sales-completed-icon.png";
import salesCanceledIcon from "@/assets/icons/sales-canceled-icon.png";
import dispatchTimeIcon from "@/assets/icons/dispatch-time-icon.png";
import loanIcon from "@/assets/icons/loan-icon.png";
import deliveryGuaranteeIcon from "@/assets/icons/delivery-guarantee-icon.png";
import olxGuaranteeIcon from "@/assets/icons/olx-guarantee-icon.png";
import payOnlineIcon from "@/assets/icons/pay-online-icon.png";
import notFoundIllustration from "@/assets/not-found-illustration.png";
import "@/styles/olx.css";

export const Route = createFileRoute("/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} - OLX` },
      { property: "og:title", content: `${params.slug} - OLX` },
    ],
  }),
  component: ProductRouteComponent,
});

function ProductRouteComponent() {
  const sellerMatch = useMatch({ from: "/$slug/vendedor", shouldThrow: false });

  if (sellerMatch) return <Outlet />;

  return <ProductPage />;
}

const getIconComponent = (iconName: string, size = 24) => {
  const icons: Record<string, React.ReactNode> = {
    zap: <Zap size={size} />,
    box: <Box size={size} />,
    tag: <Tag size={size} />,
    grid: <Grid3X3 size={size} />,
    gauge: <Gauge size={size} />,
    battery: <Battery size={size} />,
    ruler: <Ruler size={size} />,
    weight: <Weight size={size} />,
    clock: <Clock size={size} />,
    fuel: <Fuel size={size} />,
    settings: <Settings size={size} />,
  };
  return icons[iconName] || <Box size={size} />;
};

type UIProduct = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  description: string;
  price: number;
  images: string[];
  publishDate: string;
  publishTime: string;
  location: { state: string; city: string; neighborhood: string; cep: string };
  details: {
    category: string;
    brand: string;
    condition: string;
    type: string;
    extraFields: Record<string, string>;
  };
  seller: {
    name: string;
    avatarUrl: string;
    since: string;
    rating: number;
    reviews: number;
    salesCompleted: number;
    salesCanceled: number;
    avgDeliveryHours: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    facebookVerified: boolean;
  };
};

function NotFoundView() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <main className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 py-16 md:py-24 max-w-4xl mx-auto">
        <div className="flex-shrink-0">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#ECEEF3] flex items-center justify-center overflow-hidden">
            <img src={notFoundIllustration} alt="Ilustração" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-[#212529] mb-4">A página não foi encontrada...</h1>
          <p className="text-[#6C7A8D] text-base md:text-lg leading-relaxed">
            Não conseguimos localizar a página que você desejava, o produto pode ter sido vendido ou excluído. Tente fazer uma nova busca.
          </p>
        </div>
      </main>
    </div>
  );
}

function ProductPage() {
  const { slug } = Route.useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<UIProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentImage, setCurrentImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showBottomBar, setShowBottomBar] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [showPaymentDrawer, setShowPaymentDrawer] = useState(false);
  const [showGarantiaModal, setShowGarantiaModal] = useState(false);
  const [showEntregaModal, setShowEntregaModal] = useState(false);
  const [showDicasModal, setShowDicasModal] = useState(false);
  const [cep, setCep] = useState("");
  const [cepResult, setCepResult] = useState<{ address: string; city: string; state: string } | null>(null);
  const [loadingCep, setLoadingCep] = useState(false);
  const [showGarantiaTooltip, setShowGarantiaTooltip] = useState(true);
  const hasLoaded = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const m = slug.match(/^(.*)-(\d+)$/);
      let query = supabase.from("products").select("*").limit(1);
      if (m) {
        const [, base, idStr] = m;
        query = supabase
          .from("products")
          .select("*")
          .eq("slug", base)
          .eq("display_id", Number(idStr))
          .limit(1);
      } else {
        query = supabase.from("products").select("*").eq("slug", slug).limit(1);
      }
      const { data } = await query;
      let row = data?.[0] as any | undefined;
      if (!row) {
        const { data: alt } = await supabase
          .from("products")
          .select("*")
          .ilike("slug", `${slug.replace(/-\d+$/, "")}%`)
          .limit(1);
        row = alt?.[0];
      }
      if (cancelled) return;
      if (!row) {
        setProduct(null);
        setLoading(false);
        return;
      }
      if (await isVisitorBlocked(row.user_id)) {
        if (cancelled) return;
        setProduct(null);
        setLoading(false);
        return;
      }
      logVisitorActivity(row.user_id, "product_view", row.slug, row.name);
      const images = [row.image1_url, row.image2_url, row.image3_url].filter(
        (u: string | null) => !!u && u.length > 0,
      );
      const [{ data: ssRow }, { data: rvRows }] = await Promise.all([
        supabase
          .from("seller_settings")
          .select("*")
          .eq("user_id", row.user_id)
          .maybeSingle(),
        supabase.from("reviews").select("rating").eq("user_id", row.user_id),
      ]);
      if (cancelled) return;
      const s: any = ssRow ?? {};
      const ratings = (rvRows || []).map((r: any) => Number(r.rating) || 0);
      const avgRating = ratings.length
        ? ratings.reduce((a, b) => a + b, 0) / ratings.length
        : 5;
      const reviewsCount = ratings.length || Number(s.reviews_count ?? 0);
      setProduct({
        id: row.id,
        userId: row.user_id,
        slug: row.slug,
        name: row.name,
        description: row.description || "",
        price: Number(row.price || 0),
        images,
        publishDate: row.publish_date || "",
        publishTime: row.publish_time || "",
        location: {
          state: row.state || "",
          city: row.city || "",
          neighborhood: row.neighborhood || "",
          cep: row.cep || "",
        },
        details: {
          category: row.category || "",
          brand: row.brand || "",
          condition: row.condition || "",
          type: row.product_type || "",
          extraFields: (row.extra_fields as Record<string, string>) || {},
        },
        seller: {
          name: s.seller_name || row.seller_name || "Vendedor",
          avatarUrl: row.seller_avatar_url || "",
          since: s.since || new Date(row.created_at).getFullYear().toString(),
          rating: avgRating,
          reviews: reviewsCount,
          salesCompleted: Number(s.sales_completed ?? row.sales ?? 0),
          salesCanceled: Number(s.sales_canceled ?? 0),
          avgDeliveryHours: Number(s.avg_delivery_hours ?? 24),
          emailVerified: true,
          phoneVerified: true,
          facebookVerified: false,
        },
      });
      setLoading(false);
      hasLoaded.current = true;
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    const handleScroll = () => setShowBottomBar(window.scrollY > 300);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const formatCep = (value: string) => {
    const numbers = value.replace(/\D/g, "");
    if (numbers.length <= 5) return numbers;
    return `${numbers.slice(0, 5)}-${numbers.slice(5, 8)}`;
  };

  const handleCepChange = async (value: string) => {
    setCep(formatCep(value));
    const numbers = value.replace(/\D/g, "");
    if (numbers.length === 8) {
      setLoadingCep(true);
      try {
        const response = await fetch(`https://viacep.com.br/ws/${numbers}/json/`);
        const data = await response.json();
        if (!data.erro) {
          setCepResult({
            address: data.bairro || data.logradouro || "",
            city: data.localidade,
            state: data.uf,
          });
        } else {
          setCepResult(null);
        }
      } catch {
        setCepResult(null);
      } finally {
        setLoadingCep(false);
      }
    } else {
      setCepResult(null);
    }
  };

  if (loading) {
    return (
      <div className="olx-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "#6E0AD6" }} />
      </div>
    );
  }

  if (!product) return <NotFoundView />;

  const nextImage = () => setCurrentImage((p) => (p + 1) % product.images.length);
  const prevImage = () => setCurrentImage((p) => (p - 1 + product.images.length) % product.images.length);

  const handleBuy = () => {
    // Sempre usa o slug da URL (com display_id) para o checkout achar o produto certo
    const canonicalSlug = slug;
    try {
      localStorage.removeItem("olx_auth_completed");
      localStorage.setItem("olx_produto_slug", canonicalSlug);
      localStorage.setItem("olx_produto_id", product.id);
    } catch { /* ignore */ }
    navigate({ to: "/login", search: { produto: canonicalSlug } as any });
  };


  const formatDate = () => {
    if (product.publishDate && product.publishTime) {
      const [year, month, day] = product.publishDate.split("-");
      const [hours, minutes] = product.publishTime.split(":");
      return `${day}/${month} às ${hours}:${minutes}`;
    }
    const now = new Date();
    return `${now.getDate().toString().padStart(2, "0")}/${(now.getMonth() + 1).toString().padStart(2, "0")} às ${now.getHours().toString().padStart(2, "0")}:${now.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className="olx-page">
      <header className="olx-header">
        <nav className="olx-header-nav">
          <span className="olx-logo" style={{ cursor: "default" }}>
            <img src={olxLogo} alt="OLX" style={{ height: 28 }} />
          </span>
          <div className="olx-search">
            <input type="text" placeholder="Buscar" />
          </div>
          <div className="olx-header-actions">
            <a href="#" className="olx-header-link">Plano Profissional</a>
            <a href="#" className="olx-header-link">Meus Anúncios</a>
            <a href="#" className="olx-header-link">Notificações</a>
            <button className="olx-btn-outline">Entrar</button>
            <button className="olx-btn-primary">Anunciar grátis</button>
            <button className="olx-share-btn" onClick={() => setShowShareModal(true)} aria-label="Compartilhar">
              <Share2 size={22} />
            </button>
          </div>
        </nav>
      </header>

      <div className="olx-breadcrumb">
        <div className="olx-breadcrumb-path">
          <span>{product.location.state}</span>
          <span>›</span>
          <span>{product.location.city}</span>
          <span>›</span>
          <span>{product.details.type}</span>
        </div>
        <div className="olx-breadcrumb-actions">
          <span>{formatDate()}</span>
          <button onClick={() => setShowShareModal(true)} aria-label="Compartilhar">
            <Share2 size={20} />
          </button>
        </div>
      </div>

      <main className="olx-main">
        <div className="olx-content">
          <div className="olx-left-column">
            <div className="olx-gallery olx-gallery-mobile">
              <div className="olx-gallery-main">
                {product.images.length > 0 ? (
                  <img
                    src={product.images[currentImage]}
                    alt={product.name}
                    style={{ cursor: "zoom-in" }}
                    onClick={() => setLightboxOpen(true)}
                  />
                ) : (
                  <div className="olx-no-image"><Camera size={64} /></div>
                )}
                {product.images.length > 1 && (
                  <>
                    <button onClick={prevImage} className="olx-gallery-nav prev"><ChevronLeft size={20} /></button>
                    <button onClick={nextImage} className="olx-gallery-nav next"><ChevronRight size={20} /></button>
                  </>
                )}
                {product.images.length > 0 && (
                  <div className="olx-gallery-counter">
                    <Camera size={14} />
                    {currentImage + 1}/{product.images.length}
                  </div>
                )}
              </div>
            </div>

            <div className="olx-gallery-desktop">
              <div className="olx-gallery-grid">
                <div
                  className={`olx-gallery-grid-item main ${product.images.length === 1 ? "single" : ""}`}
                  onClick={() => { setCurrentImage(0); setLightboxOpen(true); }}
                  style={{ cursor: "zoom-in" }}
                >
                  {product.images[0] ? (
                    <img src={product.images[0]} alt={`${product.name} 1`} />
                  ) : (
                    <div className="olx-no-image"><Camera size={64} /></div>
                  )}
                  <span className="olx-gallery-badge">DESTAQUE</span>
                </div>
                {product.images.slice(1, 3).map((img, idx) => (
                  <div
                    key={idx + 1}
                    className="olx-gallery-grid-item"
                    onClick={() => { setCurrentImage(idx + 1); setLightboxOpen(true); }}
                    style={{ cursor: "zoom-in" }}
                  >
                    <img src={img} alt={`${product.name} ${idx + 2}`} />
                  </div>
                ))}
              </div>
            </div>

            <p className="olx-date olx-mobile-only">{formatDate()}</p>
            <h1 className="olx-product-title">{product.name}</h1>

            <div className="olx-badges">
              <span className="olx-badge olx-badge-delivery">
                <img src={deliveryGuaranteeIcon} alt="Garantia de Entrega" style={{ width: 16, height: 16 }} />
                Garantia de Entrega
              </span>
              <span className="olx-badge">
                <img src={olxGuaranteeIcon} alt="Garantia da OLX" style={{ width: 16, height: 16 }} />
                Garantia da OLX
              </span>
              <span className="olx-badge">
                <img src={payOnlineIcon} alt="Pague Online" style={{ width: 16, height: 16 }} />
                Pague Online
              </span>
            </div>

            <div className="olx-price-section olx-mobile-only">
              <p className="olx-price">R$ {product.price.toLocaleString("pt-BR")}</p>
              <div className="olx-payment-icons">
                <img src={paymentMethods} alt="Formas de pagamento" className="olx-payment-strip" />
              </div>
              <button onClick={() => setShowPaymentDrawer(true)} className="olx-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                Ver formas de pagamento
              </button>
            </div>

            <div className="olx-freight-section olx-mobile-only">
              <div className="olx-freight-label">
                <span>Calcule o frete</span>
                <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="olx-link">Não sei meu CEP</a>
              </div>
              <input
                type="text"
                className="olx-input"
                placeholder="00000-000"
                value={cep}
                onChange={(e) => handleCepChange(e.target.value)}
                maxLength={9}
              />
              {cepResult && (
                <div className="olx-cep-result">
                  <p className="olx-cep-address">{cepResult.address}, {cepResult.city}, {cepResult.state}</p>
                  <div className="olx-freight-option">
                    <div className="olx-freight-icon"><Truck size={28} /></div>
                    <div className="olx-freight-info">
                      <span className="olx-freight-type">Padrão</span>
                      <span className="olx-freight-time">Em até 2 dias úteis</span>
                    </div>
                    <span className="olx-freight-price">Frete Grátis</span>
                  </div>
                </div>
              )}
              {loadingCep && <p className="olx-cep-loading">Buscando CEP...</p>}
            </div>

            <a href="https://emprestimos.olx.com.br/" target="_blank" rel="noopener noreferrer" className="olx-loan-link olx-mobile-only">
              <img src={loanIcon} alt="Simular empréstimo" style={{ width: 20, height: 20 }} />
              Simular empréstimo
            </a>

            <div className="olx-description-section">
              <h2 className="olx-section-title">Descrição</h2>
              <p className="olx-product-description">{product.description}</p>
            </div>

            <div className="olx-details-section">
              <h2 className="olx-section-title">Detalhes</h2>
              <div className="olx-details-grid">
                <div className="olx-detail-item">
                  <div className="olx-detail-icon"><Grid3X3 size={24} /></div>
                  <label>CATEGORIA</label>
                  <span>{product.details.category}</span>
                </div>
                <div className="olx-detail-item">
                  <div className="olx-detail-icon"><Tag size={24} /></div>
                  <label>MARCA</label>
                  <span>{product.details.brand}</span>
                </div>
                <div className="olx-detail-item">
                  <div className="olx-detail-icon"><Box size={24} /></div>
                  <label>CONDIÇÃO</label>
                  <span>{product.details.condition}</span>
                </div>
                <div className="olx-detail-item">
                  <div className="olx-detail-icon"><Grid3X3 size={24} /></div>
                  <label>TIPO</label>
                  <span>{product.details.type}</span>
                </div>
                {(() => {
                  const cfg = getCategoryConfig(product.details.category);
                  if (!cfg) return null;
                  return cfg.fields.map((field) => {
                    const value = product.details.extraFields?.[field.key];
                    if (!value) return null;
                    return (
                      <div key={field.key} className="olx-detail-item">
                        <div className="olx-detail-icon">{getIconComponent(field.icon)}</div>
                        <label>{field.label.toUpperCase()}</label>
                        <span>{value}</span>
                      </div>
                    );
                  });
                })()}
              </div>
            </div>

            <div className="olx-security-box">
              <h3>Compre com Segurança</h3>
              <p>Agora a OLX só libera o valor pago ao vendedor após você receber o que comprou.</p>
              <span
                className="olx-link"
                onClick={() => navigate({ to: "/garantia" })}
                style={{ cursor: "pointer" }}
              >
                Clique e saiba mais!
              </span>
            </div>

            <div className="olx-location-section">
              <h2 className="olx-section-title">Localização</h2>
              <div className="olx-location">
                <div className="olx-location-icon">
                  <img src={cityIcon} alt="Localização" style={{ width: 48, height: 48 }} />
                </div>
                <div className="olx-location-text">
                  <strong>{product.location.neighborhood}</strong>
                  <span>{product.location.city}, {product.location.state}, {product.location.cep}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="olx-right-column">
            <div className="olx-sidebar">
              <div className="olx-price-card olx-desktop-only">
                <p className="olx-price">R$ {product.price.toLocaleString("pt-BR")}</p>
                <div className="olx-payment-icons">
                  <img src={paymentMethods} alt="Formas de pagamento" className="olx-payment-strip" />
                </div>
                <button onClick={() => setShowPaymentDrawer(true)} className="olx-link" style={{ background: "none", border: "none", cursor: "pointer", padding: 0 }}>
                  Ver formas de pagamento
                </button>

                <a href="https://emprestimos.olx.com.br/" target="_blank" rel="noopener noreferrer" className="olx-loan-link">
                  <img src={loanIcon} alt="Simular empréstimo" style={{ width: 20, height: 20 }} />
                  Simular empréstimo
                </a>

                <div className="olx-freight-section">
                  <div className="olx-freight-label">
                    <span>Calcule o frete</span>
                    <a href="https://buscacepinter.correios.com.br/app/endereco/index.php" target="_blank" rel="noopener noreferrer" className="olx-link">Não sei meu CEP</a>
                  </div>
                  <input
                    type="text"
                    className="olx-input"
                    placeholder="00000-000"
                    value={cep}
                    onChange={(e) => handleCepChange(e.target.value)}
                    maxLength={9}
                  />
                  {cepResult && (
                    <div className="olx-cep-result">
                      <p className="olx-cep-address">{cepResult.address}, {cepResult.city}, {cepResult.state}</p>
                      <div className="olx-freight-option">
                        <div className="olx-freight-icon"><Truck size={28} /></div>
                        <div className="olx-freight-info">
                          <span className="olx-freight-type">Padrão</span>
                          <span className="olx-freight-time">Em até 2 dias úteis</span>
                        </div>
                        <span className="olx-freight-price">Frete Grátis</span>
                      </div>
                    </div>
                  )}
                  {loadingCep && <p className="olx-cep-loading">Buscando CEP...</p>}
                </div>

                <button className="olx-buy-btn-desktop" onClick={handleBuy}>
                  <ShoppingCart size={18} /> Comprar
                </button>
              </div>

              <div className="olx-seller-section">
                <h2 className="olx-section-title">Sobre o anunciante</h2>
                <div className="olx-seller-header">
                  <div className="olx-seller-avatar">
                    {product.seller.avatarUrl ? (
                      <img src={product.seller.avatarUrl} alt={product.seller.name} className="olx-seller-avatar-img" />
                    ) : (
                      product.seller.name.charAt(0)
                    )}
                  </div>
                  <div>
                    <p className="olx-seller-name">{product.seller.name}</p>
                    <p className="olx-seller-status">
                      <span className="olx-online-dot"></span> online
                    </p>
                  </div>
                </div>

                <div className="olx-seller-info">
                  <div className="olx-seller-info-item">
                    <Calendar size={16} />
                    <span>Na OLX desde {product.seller.since}</span>
                  </div>
                  <div className="olx-seller-info-item">
                    <MapPin size={16} />
                    <span>{product.location.neighborhood}, {product.location.city} - {product.location.state}</span>
                  </div>
                </div>

                <button className="olx-btn-profile" onClick={() => navigate({ to: "/$slug/vendedor", params: { slug }, search: {} as never })}>
                  Acessar perfil do anunciante
                </button>
              </div>

              <div className="olx-sales-section">
                <h3 className="olx-section-title">Histórico de vendas</h3>
                <div className="olx-rating">
                  <span className="olx-rating-value">{product.seller.rating.toFixed(1)}</span>
                  <div className="olx-stars">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} size={16} className={`olx-star ${star <= product.seller.rating ? "filled" : "empty"}`} />
                    ))}
                  </div>
                </div>
                <a href={`/${slug}/vendedor?showReviews=true`} className="olx-reviews-link">Acessar {product.seller.reviews} avaliações</a>

                <div className="olx-sales-stats">
                  <div className="olx-stat-item">
                    <img src={salesCompletedIcon} alt="Vendas concluídas" className="olx-stat-icon-img" />
                    <p className="olx-stat-value">{product.seller.salesCompleted}</p>
                    <p className="olx-stat-label">Vendas<br />concluídas</p>
                  </div>
                  <div className="olx-stat-item">
                    <img src={salesCanceledIcon} alt="Vendas canceladas" className="olx-stat-icon-img" />
                    <p className="olx-stat-value">{String(product.seller.salesCanceled).padStart(2, "0")}</p>
                    <p className="olx-stat-label">Vendas<br />canceladas</p>
                  </div>
                  <div className="olx-stat-item">
                    <img src={dispatchTimeIcon} alt="Tempo médio de despacho" className="olx-stat-icon-img" />
                    <p className="olx-stat-value">{product.seller.avgDeliveryHours}</p>
                    <p className="olx-stat-label">horas<br />Tempo médio<br />de despacho</p>
                  </div>
                </div>
              </div>

              <div className="olx-verified-section">
                <h3 className="olx-section-title">Informações verificadas</h3>
                <div className="olx-verified-list">
                  {product.seller.emailVerified && (
                    <div className="olx-verified-item"><CheckCircle2 className="olx-verified-icon" /><span>E-mail</span></div>
                  )}
                  {product.seller.phoneVerified && (
                    <div className="olx-verified-item"><CheckCircle2 className="olx-verified-icon" /><span>Telefone</span></div>
                  )}
                  {product.seller.facebookVerified && (
                    <div className="olx-verified-item"><CheckCircle2 className="olx-verified-icon" /><span>Facebook</span></div>
                  )}
                </div>
              </div>

              <div className="olx-offer-section">
                <h3 className="olx-section-title">Este anúncio oferece</h3>
                <div className="olx-offer-list">
                  <div className="olx-offer-item">
                    <Shield className="olx-offer-icon" />
                    <div>
                      <p className="olx-offer-title">Garantia da OLX</p>
                      <p className="olx-offer-text">Pague online e receba o que comprou ou a OLX devolve seu dinheiro.</p>
                      <span className="olx-link" onClick={() => setShowGarantiaModal(true)} style={{ cursor: "pointer" }}>Saiba mais</span>
                    </div>
                  </div>
                  <div className="olx-offer-item">
                    <Truck className="olx-offer-icon" />
                    <div>
                      <p className="olx-offer-title">Entrega fácil</p>
                      <p className="olx-offer-text">Receba ou retire seu produto onde quiser com segurança.</p>
                      <span className="olx-link" onClick={() => setShowEntregaModal(true)} style={{ cursor: "pointer" }}>Saiba mais</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="olx-tips-section">
                <h3 className="olx-section-title">Dicas de segurança</h3>
                <p className="olx-tips-text">
                  Se você pagou adiantado, libere o valor para o vendedor apenas após conferir ou receber a mercadoria.
                </p>
                <span className="olx-link" onClick={() => setShowDicasModal(true)} style={{ cursor: "pointer" }}>Exibir mais dicas</span>
              </div>

              <button className="olx-report">
                <Flag size={16} /> Denunciar anúncio
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="olx-footer">
        <div className="olx-footer-content">
          <div className="olx-footer-bottom">
            <p className="olx-footer-copyright">
              © Bom Negócio Atividades de Internet Ltda.<br />
              Rua do Catete, 359, Flamengo - 22220-001<br />
              Rio de Janeiro, RJ
            </p>
          </div>
        </div>
      </footer>

      {!showChat && (
        <div className={`olx-bottom-bar-container ${showBottomBar ? "visible" : ""}`}>
          {showGarantiaTooltip && (
            <div className="olx-garantia-tooltip">
              <button className="olx-garantia-tooltip-close" onClick={() => setShowGarantiaTooltip(false)}>
                <X size={14} />
              </button>
              <p className="olx-garantia-tooltip-title">Pague online com garantia da OLX</p>
              <p className="olx-garantia-tooltip-text">Receba o que comprou ou a OLX devolve o seu dinheiro</p>
            </div>
          )}
          <div className="olx-bottom-bar">
            <button className="olx-bottom-btn olx-bottom-btn-primary" onClick={handleBuy}>
              <ShoppingCart size={18} /> Comprar
            </button>
            <button className="olx-bottom-btn olx-bottom-btn-outline" onClick={() => setShowChat(true)}>
              <MessageCircle size={18} /> Chat
            </button>
          </div>
        </div>
      )}

      {showChat && product && (
        <ProductChat
          productId={product.id}
          productName={product.name}
          sellerId={product.userId}
          onClose={() => setShowChat(false)}
        />
      )}


      {lightboxOpen && product.images.length > 0 && (
        <div
          onClick={() => setLightboxOpen(false)}
          style={{
            position: "fixed", inset: 0, background: "#fff",
            zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center",
          }}
        >
          <div style={{ position: "fixed", top: 16, left: 20, color: "#000", fontSize: 16, fontWeight: 500, zIndex: 10000 }}>
            {currentImage + 1}/{product.images.length}
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxOpen(false); }}
            aria-label="Fechar"
            style={{
              position: "fixed", top: 12, right: 16, width: 44, height: 44,
              borderRadius: "50%", background: "transparent", border: "none",
              color: "#000", display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", zIndex: 10000,
            }}
          >
            <X size={28} />
          </button>
          {product.images.length > 1 && (
            <>
              <button
                onClick={(e) => { e.stopPropagation(); prevImage(); }}
                aria-label="Anterior"
                style={{
                  position: "fixed", left: 16, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.06)",
                  border: "none", color: "#000", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                onClick={(e) => { e.stopPropagation(); nextImage(); }}
                aria-label="Próxima"
                style={{
                  position: "fixed", right: 16, top: "50%", transform: "translateY(-50%)",
                  width: 44, height: 44, borderRadius: "50%", background: "rgba(0,0,0,0.06)",
                  border: "none", color: "#000", display: "flex", alignItems: "center",
                  justifyContent: "center", cursor: "pointer",
                }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}
          <img
            src={product.images[currentImage]}
            alt={product.name}
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: "95vw", maxHeight: "90vh", objectFit: "contain" }}
          />
        </div>
      )}

      {showShareModal && (
        <div className="olx-modal-overlay" onClick={() => setShowShareModal(false)}>
          <div className="olx-modal" onClick={(e) => e.stopPropagation()}>
            <button className="olx-modal-close" onClick={() => setShowShareModal(false)}>
              <X size={24} />
            </button>
            <h3 className="olx-modal-title">Compartilhar</h3>
            <div className="olx-modal-actions">
              <button
                className="olx-modal-btn"
                onClick={() => {
                  const productUrl = `${window.location.origin}/${slug}`;
                  navigator.clipboard.writeText(productUrl);
                  setShowShareModal(false);
                }}
              >
                <div className="olx-modal-btn-icon" style={{ backgroundColor: "var(--olx-primary)" }}>
                  <Share2 size={18} />
                </div>
                <span>Copiar link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <Drawer open={showPaymentDrawer} onOpenChange={setShowPaymentDrawer}>
        <DrawerContent className="olx-payment-drawer">
          <DrawerHeader className="olx-payment-drawer-header">
            <DrawerTitle className="olx-payment-drawer-title">Formas de pagamento</DrawerTitle>
            <DrawerClose className="olx-payment-drawer-close">
              <X size={24} />
            </DrawerClose>
          </DrawerHeader>
          <div className="olx-payment-drawer-content">
            <div className="olx-payment-option">
              <div className="olx-payment-option-icon"><CreditCard size={24} /></div>
              <div className="olx-payment-option-info">
                <span className="olx-payment-option-label">CARTÃO DE CRÉDITO</span>
                <span className="olx-payment-option-description">Parcelamento sem juros</span>
                <div className="olx-payment-option-cards">
                  <img src={paymentMethods} alt="Cartões aceitos" className="olx-payment-strip-small" />
                </div>
              </div>
            </div>
            <div className="olx-payment-option">
              <div className="olx-payment-option-icon">
                <img src={pixIcon} alt="Pix" style={{ width: 24, height: 24 }} />
              </div>
              <div className="olx-payment-option-info">
                <span className="olx-payment-option-label">PIX</span>
                <span className="olx-payment-option-description">Aprovação imediata</span>
              </div>
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {showGarantiaModal && (
        <div className="olx-garantia-modal-overlay" onClick={() => setShowGarantiaModal(false)}>
          <div className="olx-garantia-modal" onClick={(e) => e.stopPropagation()}>
            <button className="olx-garantia-modal-close" onClick={() => setShowGarantiaModal(false)}>
              <X size={24} />
            </button>
            <div className="olx-garantia-modal-content">
              <img src={garantiaModalIcon} alt="Garantia OLX" className="olx-garantia-modal-icon" />
              <h2 className="olx-garantia-modal-title">Receba o que comprou ou seu dinheiro de volta</h2>
              <p className="olx-garantia-modal-text">
                Com a garantia da OLX, todas as suas compras estão protegidas. Compre diretamente pelo app ou site, clicando no botão Comprar, e nós garantimos o reembolso total do valor caso haja algum problema com a sua compra.
              </p>
              <h3 className="olx-garantia-modal-subtitle">Situações de Cobertura</h3>
              <ul className="olx-garantia-modal-list">
                <li><CheckCircle2 size={18} className="olx-garantia-check" /><span>Produto diferente do anunciado</span></li>
                <li><CheckCircle2 size={18} className="olx-garantia-check" /><span>Produto não recebido</span></li>
                <li>
                  <CheckCircle2 size={18} className="olx-garantia-check" />
                  <div>
                    <span>Produto defeituoso</span>
                    <small>Exceto nos casos de anúncios que explicitam essa condição.</small>
                  </div>
                </li>
              </ul>
              <div className="olx-garantia-modal-help">
                <div className="olx-garantia-modal-help-icon">ℹ</div>
                <div>
                  <strong>Não recebeu o que esperava?</strong>
                  <p>Acesse "Preciso de ajuda" em "Detalhes da Compra" e nós resolveremos pra você.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showEntregaModal && (
        <div className="olx-garantia-modal-overlay" onClick={() => setShowEntregaModal(false)}>
          <div className="olx-garantia-modal" onClick={(e) => e.stopPropagation()}>
            <button className="olx-garantia-modal-close" onClick={() => setShowEntregaModal(false)}>
              <X size={24} />
            </button>
            <div className="olx-entrega-modal-content">
              <h2 className="olx-entrega-modal-title">Entrega fácil</h2>
              <div className="olx-entrega-options">
                <div className="olx-entrega-option">
                  <img src={entregaCasaIcon} alt="Receber em casa" className="olx-entrega-option-icon" />
                  <div className="olx-entrega-option-info">
                    <strong>Receber o produto em casa</strong>
                    <p>Compre de qualquer lugar do Brasil e receba onde quiser.</p>
                  </div>
                </div>
                <div className="olx-entrega-option">
                  <div className="olx-entrega-option-icon" style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <MapPin size={40} color="#6E0AD6" />
                  </div>
                  <div className="olx-entrega-option-info">
                    <strong>Retirar com o vendedor</strong>
                    <p>Compre online e combine a retirada do produto pelo chat.</p>
                  </div>
                </div>
                <div className="olx-entrega-option">
                  <img src={cliqueRetireIcon} alt="CliqueRetire" className="olx-entrega-option-icon" />
                  <div className="olx-entrega-option-info">
                    <strong>Retirar no armário CliqueRetire</strong>
                    <p>Compre online e retire seu produto em um dos armários CliqueRetire disponíveis na sua região.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {showDicasModal && (
        <div className="olx-garantia-modal-overlay" onClick={() => setShowDicasModal(false)}>
          <div className="olx-garantia-modal" onClick={(e) => e.stopPropagation()}>
            <button className="olx-garantia-modal-close" onClick={() => setShowDicasModal(false)}>
              <X size={24} />
            </button>
            <div className="olx-dicas-modal-content">
              <img src={dicasSegurancaIcon} alt="Dicas de Segurança" className="olx-dicas-modal-icon" />
              <h2 className="olx-dicas-modal-title">Dicas de segurança</h2>
              <ul className="olx-dicas-modal-list">
                <li>Não libere pagamentos antes de receber ou retirar o produto.</li>
                <li>Dê preferência ao frete da OLX sempre que possível.</li>
                <li>Se está desapegando, limpe bem não só as mãos, como o produto e deixe-o também bem embrulhado.</li>
                <li>Em caso de arrependimento, você tem até 7 dias para solicitar o reembolso.</li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
