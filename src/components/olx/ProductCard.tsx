import { Link } from "@tanstack/react-router";
import type { Product } from "@/lib/data";

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link
      to="/$slug"
      params={{ slug: product.slug }}
      className="olx-card group block overflow-hidden rounded-lg border border-olx-border bg-olx-card transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-olx-bg">
        <img
          src={product.images[0]}
          alt={product.title}
          loading="lazy"
          className="h-full w-full object-cover transition-transform group-hover:scale-105"
        />
        {product.badges.includes("Frete grátis") && (
          <span className="absolute left-2 top-2 rounded bg-olx-success px-2 py-0.5 text-xs font-bold text-white">
            Frete grátis
          </span>
        )}
      </div>
      <div className="p-3">
        <p className="olx-price text-lg font-bold text-olx-text">
          {formatBRL(product.price)}
        </p>
        {product.installments && (
          <p className="text-xs text-olx-text-secondary">{product.installments}</p>
        )}
        <h3 className="mt-1 line-clamp-2 text-sm text-olx-text">{product.title}</h3>
        <div className="mt-2 flex items-center justify-between text-xs text-olx-text-tertiary">
          <span className="line-clamp-1">{product.location}</span>
          <span>{product.condition}</span>
        </div>
      </div>
    </Link>
  );
}
