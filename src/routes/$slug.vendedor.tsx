import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import {
  ChevronLeft,
  Calendar,
  MapPin,
  Check,
  Camera,
  ChevronRight,
  Search,
  ChevronDown,
  Image as ImageIcon,
  Star,
  Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { logVisitorActivity, fetchProductBySlug } from "@/lib/tracking";
import olxLogo from "@/assets/olx-logo.png";
import salesCompletedIcon from "@/assets/icons/sales-completed-icon.png";
import salesCanceledIcon from "@/assets/icons/sales-canceled-icon.png";
import dispatchTimeIcon from "@/assets/icons/dispatch-time-icon.png";
import notFoundIllustration from "@/assets/not-found-illustration.png";
import "@/styles/olx.css";

export const Route = createFileRoute("/$slug/vendedor")({
  validateSearch: (s: Record<string, unknown>) => ({
    showReviews: s.showReviews === "true" || s.showReviews === true,
  }),
  head: ({ params }) => ({
    meta: [{ title: `Vendedor - ${params.slug} - OLX` }],
  }),
  component: SellerProfilePage,
});

type Product = {
  id: string;
  userId: string;
  slug: string;
  name: string;
  price: number;
  images: string[];
  location: { state: string; city: string; neighborhood: string };
  seller: {
    name: string;
    avatarUrl: string;
    since: string;
    salesCompleted: number;
    salesCanceled: number;
    avgDeliveryHours: number;
    emailVerified: boolean;
    phoneVerified: boolean;
    facebookVerified: boolean;
  };
};

type Review = {
  id: string;
  author: string;
  rating: number;
  comment: string;
  memberSince: string;
  productReviewed: string;
  reviewDate: string;
};

function NotFoundView() {
  return (
    <div className="min-h-screen bg-[#F7F8FA]">
      <main className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 px-6 py-16 md:py-24 max-w-4xl mx-auto">
        <div className="flex-shrink-0">
          <div className="w-48 h-48 md:w-64 md:h-64 rounded-full bg-[#ECEEF3] flex items-center justify-center overflow-hidden">
            <img src={notFoundIllustration} alt="" className="w-full h-full object-cover" />
          </div>
        </div>
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold text-[#212529] mb-4">
            A página não foi encontrada...
          </h1>
          <p className="text-[#6C7A8D] text-base md:text-lg leading-relaxed">
            Não conseguimos localizar a página que você desejava, o produto pode ter sido vendido ou excluído.
          </p>
        </div>
      </main>
    </div>
  );
}

function SellerProfilePage() {
  const { slug } = Route.useParams();
  const search = useSearch({ from: "/$slug/vendedor" });
  const navigate = useNavigate();

  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [showReviews, setShowReviews] = useState<boolean>(!!search.showReviews);
  const loggedRef = useRef(false);
  const loggedReviewsRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const row = (await fetchProductBySlug(slug)) as any;
      if (cancelled) return;
      if (!row) {
        setProduct(null);
        setLoading(false);
        return;
      }
      const images = [row.image1_url, row.image2_url, row.image3_url].filter(
        (u: string | null) => !!u,
      );
      const { data: ss } = await supabase
        .from("seller_settings")
        .select("*")
        .eq("user_id", row.user_id)
        .maybeSingle();
      const s: any = ss ?? {};
      const p: Product = {
        id: row.id,
        userId: row.user_id,
        slug: row.slug,
        name: row.name,
        price: Number(row.price || 0),
        images,
        location: {
          state: row.state || "",
          city: s.city || row.city || "",
          neighborhood: row.neighborhood || "",
        },
        seller: {
          name: s.seller_name || row.seller_name || "Vendedor",
          avatarUrl: row.seller_avatar_url || "",
          since: s.since || new Date(row.created_at).getFullYear().toString(),
          salesCompleted: Number(s.sales_completed ?? row.sales ?? 0),
          salesCanceled: Number(s.sales_canceled ?? 0),
          avgDeliveryHours: Number(s.avg_delivery_hours ?? 24),
          emailVerified: true,
          phoneVerified: true,
          facebookVerified: false,
        },
      };
      setProduct(p);
      const { data: rv } = await supabase
        .from("reviews")
        .select("*")
        .eq("user_id", row.user_id)
        .order("created_at", { ascending: false });
      if (cancelled) return;
      setReviews(
        (rv || []).map((r: any) => ({
          id: r.id,
          author: r.author,
          rating: r.rating,
          comment: r.comment,
          memberSince:
            r.member_since || new Date(r.created_at).getFullYear().toString(),
          productReviewed: r.product_reviewed || p.name,
          reviewDate:
            r.review_date || new Date(r.created_at).toLocaleDateString("pt-BR"),
        })),
      );
      setLoading(false);
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  useEffect(() => {
    if (product && !loggedRef.current) {
      loggedRef.current = true;
      logVisitorActivity(product.userId, "seller_profile_view", product.slug, product.seller.name);
    }
  }, [product]);

  useEffect(() => {
    if (showReviews && product && !loggedReviewsRef.current) {
      loggedReviewsRef.current = true;
      logVisitorActivity(product.userId, "reviews_view", product.slug, product.seller.name);
    }
  }, [showReviews, product]);

  if (loading) {
    return (
      <div className="olx-page" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
        <Loader2 className="animate-spin" size={48} style={{ color: "#6E0AD6" }} />
      </div>
    );
  }

  if (!product) return <NotFoundView />;

  const sellerStats = {
    registrationDate: product.seller.since,
    completedSales: product.seller.salesCompleted,
    canceledSales: product.seller.salesCanceled,
    averageDispatchTime:
      product.seller.avgDeliveryHours < 24
        ? `${product.seller.avgDeliveryHours} horas`
        : `${Math.round(product.seller.avgDeliveryHours / 24)} dias`,
    rating: reviews.length
      ? reviews.reduce((a, r) => a + (Number(r.rating) || 0), 0) / reviews.length
      : 5.0,
    totalReviews: reviews.length,
  };

  const renderStars = (rating: number) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={20}
        fill={i < rating ? "#FFB800" : "transparent"}
        color={i < rating ? "#FFB800" : "#ccc"}
      />
    ));

  const goToProduct = () => navigate({ to: "/$slug", params: { slug } });

  return (
    <div className="olx-page">
      <header className="olx-header seller-header">
        <nav className="olx-header-nav seller-header-nav">
          <button onClick={goToProduct} className="olx-back-btn">
            <ChevronLeft size={24} />
          </button>
          <a href="/" className="olx-logo">
            <img src={olxLogo} alt="OLX" style={{ height: 28 }} />
          </a>
          <div style={{ width: 24 }}></div>
        </nav>
      </header>

      {/* Desktop */}
      <main className="olx-main seller-profile-main olx-desktop-only">
        <div className="seller-profile-content">
          <aside className="seller-profile-sidebar">
            <div className="seller-profile-card">
              <div className="seller-avatar-section">
                <div className="seller-avatar-large">
                  {product.seller.avatarUrl ? (
                    <img src={product.seller.avatarUrl} alt={product.seller.name} className="seller-avatar-img" />
                  ) : (
                    product.seller.name.charAt(0)
                  )}
                </div>
                <div className="seller-name-section">
                  <span className="seller-verified-label">Conta verificada</span>
                  <h1 className="seller-name-large">{product.seller.name}</h1>
                  <p className="seller-last-access">último acesso há 4 minutos</p>
                </div>
              </div>
              <div className="seller-info-list">
                <div className="seller-info-row">
                  <Calendar size={16} />
                  <span>Na OLX desde {product.seller.since}</span>
                </div>
                <div className="seller-info-row">
                  <MapPin size={16} />
                  <span>
                    {product.location.neighborhood}, {product.location.city} - {product.location.state}
                  </span>
                </div>
              </div>
              <div className="seller-level-section">
                <div className="seller-level-header">
                  <span>Nível de cadastro</span>
                  <ChevronDown size={20} />
                </div>
                <div className="seller-level-bar">
                  <div className="seller-level-segment filled yellow"></div>
                  <div className="seller-level-segment filled yellow"></div>
                  <div className="seller-level-segment filled green"></div>
                  <div className="seller-level-segment filled green"></div>
                </div>
                <div className="seller-verified-list">
                  {product.seller.emailVerified && (
                    <div className="seller-verified-row">
                      <Check size={16} className="check-icon" />
                      <span>Endereço de e-mail</span>
                    </div>
                  )}
                  {product.seller.phoneVerified && (
                    <div className="seller-verified-row">
                      <Check size={16} className="check-icon" />
                      <span>Número de telefone</span>
                    </div>
                  )}
                  {product.seller.facebookVerified && (
                    <div className="seller-verified-row">
                      <Check size={16} className="check-icon" />
                      <span>Facebook</span>
                    </div>
                  )}
                  <div className="seller-verified-row">
                    <Check size={16} className="check-icon" />
                    <span>Identidade verificada</span>
                  </div>
                </div>
              </div>
            </div>
          </aside>

          <div className="seller-profile-main-content">
            <section className="seller-history-section">
              <h2 className="seller-section-title">
                Histórico <span className="info-icon">ℹ</span>
              </h2>
              <div className="seller-history-card">
                <div className="history-icon">
                  <ImageIcon size={24} />
                </div>
                <p className="history-count">1 anúncios</p>
                <p className="history-label">Publicados nos últimos 180 dias</p>
              </div>
            </section>

            <section className="seller-listings-section">
              <h2 className="seller-section-title">Anúncios</h2>
              <p className="seller-listings-count">1 de 1 anúncios publicados</p>

              <div className="seller-search-bar">
                <Search size={18} />
                <input type="text" placeholder="Ex: Chevrolet Onix Turbo Spin" />
              </div>

              <div className="seller-filters">
                <div className="seller-filter">
                  <label>Categoria</label>
                  <div className="seller-filter-select"><span>Selecionar</span><ChevronDown size={16} /></div>
                </div>
                <div className="seller-filter">
                  <label>Localização</label>
                  <div className="seller-filter-select"><span>Selecionar</span><ChevronDown size={16} /></div>
                </div>
                <div className="seller-filter">
                  <label>Ordenar por</label>
                  <div className="seller-filter-select"><span>Mais recentes</span><ChevronDown size={16} /></div>
                </div>
              </div>

              <div className="seller-product-card" onClick={goToProduct} style={{ cursor: "pointer" }}>
                <div className="seller-product-image">
                  {product.images.length > 0 ? (
                    <img src={product.images[0]} alt={product.name} />
                  ) : (
                    <div className="no-image"><Camera size={32} /></div>
                  )}
                  <button className="product-nav-btn"><ChevronRight size={20} /></button>
                  <div className="product-image-count">
                    <Camera size={12} />
                    <span>{product.images.length}</span>
                  </div>
                </div>
                <div className="seller-product-info">
                  <p className="seller-product-price">R$ {product.price.toLocaleString("pt-BR")}</p>
                  <p className="seller-product-title">{product.name.toUpperCase()}</p>
                  <span className="seller-product-badge">Pague Online</span>
                  <div className="seller-product-location">
                    <MapPin size={14} />
                    <span>{product.location.city} - {product.location.state}</span>
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* Mobile - Profile */}
      {!showReviews && (
        <main className="olx-main seller-profile-mobile olx-mobile-only">
          <div className="mobile-seller-header">
            <div className="mobile-seller-avatar">
              {product.seller.avatarUrl ? (
                <img src={product.seller.avatarUrl} alt={product.seller.name} className="mobile-seller-avatar-img" />
              ) : (
                product.seller.name.charAt(0)
              )}
            </div>
            <div className="mobile-seller-info">
              <span className="seller-verified-label">Conta verificada</span>
              <h1 className="mobile-seller-name">{product.seller.name}</h1>
              <p className="mobile-seller-access">último acesso há 4 minutos</p>
            </div>
          </div>

          <div className="mobile-seller-details">
            <div className="mobile-detail-row">
              <Calendar size={16} />
              <span>Na OLX desde {sellerStats.registrationDate}</span>
            </div>
            <div className="mobile-detail-row">
              <MapPin size={16} />
              <span>
                {product.location.neighborhood}, {product.location.city} - {product.location.state}
              </span>
            </div>
          </div>

          <div className="mobile-rating-section">
            <div className="mobile-rating-header">
              <Star size={18} fill="#FFB800" color="#FFB800" />
              <span className="mobile-rating-value">{sellerStats.rating.toFixed(1).replace(".", ",")}</span>
              <span className="mobile-rating-count">({sellerStats.totalReviews} avaliações)</span>
            </div>
            <button className="mobile-reviews-btn" onClick={() => setShowReviews(true)}>
              Acessar avaliações
              <ChevronRight size={18} />
            </button>
          </div>

          <div className="mobile-sales-stats">
            <div className="mobile-stat-item">
              <img src={salesCompletedIcon} alt="" className="mobile-stat-icon-img" />
              <span className="mobile-stat-value">{sellerStats.completedSales}</span>
              <span className="mobile-stat-label">Vendas concluídas</span>
            </div>
            <div className="mobile-stat-item">
              <img src={salesCanceledIcon} alt="" className="mobile-stat-icon-img" />
              <span className="mobile-stat-value">{sellerStats.canceledSales}</span>
              <span className="mobile-stat-label">Vendas canceladas</span>
            </div>
            <div className="mobile-stat-item">
              <img src={dispatchTimeIcon} alt="" className="mobile-stat-icon-img" />
              <span className="mobile-stat-value">{sellerStats.averageDispatchTime}</span>
              <span className="mobile-stat-label">Tempo médio de despacho</span>
            </div>
          </div>

          <div className="mobile-product-section">
            <h3>Anúncio</h3>
            <div className="seller-product-card" onClick={goToProduct} style={{ cursor: "pointer" }}>
              <div className="seller-product-image">
                {product.images.length > 0 ? (
                  <img src={product.images[0]} alt={product.name} />
                ) : (
                  <div className="no-image"><Camera size={32} /></div>
                )}
              </div>
              <div className="seller-product-info">
                <p className="seller-product-price">R$ {product.price.toLocaleString("pt-BR")}</p>
                <p className="seller-product-title">{product.name.toUpperCase()}</p>
              </div>
            </div>
          </div>
        </main>
      )}

      {/* Mobile - Reviews */}
      {showReviews && (
        <main className="olx-main seller-profile-mobile olx-mobile-only">
          <button className="mobile-back-reviews" onClick={() => setShowReviews(false)}>
            <ChevronLeft size={20} />
            <span>Voltar ao perfil</span>
          </button>
          <div className="rating-summary">
            <div className="rating-score">{sellerStats.rating.toFixed(1).replace(".", ",")}</div>
            <div className="rating-stars">{renderStars(Math.round(sellerStats.rating))}</div>
            <p className="rating-count">{sellerStats.totalReviews} avaliações</p>
          </div>
          <div className="reviews-list">
            {reviews.map((review) => (
              <div key={review.id} className="review-card">
                <div className="review-header">
                  <div className="review-avatar">{review.author.charAt(0)}</div>
                  <div className="review-author-info">
                    <span className="review-author-name">{review.author}</span>
                    <span className="review-author-since">Na OLX desde {review.memberSince}</span>
                  </div>
                </div>
                <p className="review-product">
                  <span className="review-product-label">Produto avaliado:</span> {review.productReviewed}
                </p>
                <div className="review-rating">{renderStars(review.rating)}</div>
                <p className="review-comment">{review.comment}</p>
                <p className="review-date">Avaliado em {review.reviewDate}</p>
              </div>
            ))}
          </div>
        </main>
      )}
    </div>
  );
}
