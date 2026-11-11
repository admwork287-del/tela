import { useMemo } from "react";
import { useSellerConfig as _hook } from "./admin";
import { adminActions } from "@/lib/admin/store";
import type { SellerConfig } from "@/lib/admin/types";

// Adapter: expose `reviews` alias and async updateConfig used by SellerSettings
export function useSellerConfig() {
  const { config, loading } = _hook();
  const configWithAlias = useMemo(
    () => (config ? { ...config, reviews: config.reviews_count } : config),
    [config],
  );
  const updateConfig = async (patch: Partial<SellerConfig> & { reviews?: number }) => {
    const { reviews, ...rest } = patch;
    const mapped: Partial<SellerConfig> = { ...rest };
    if (typeof reviews === "number") mapped.reviews_count = reviews;
    adminActions.updateConfig(mapped);
  };
  return { config: configWithAlias, loading, updateConfig };
}
