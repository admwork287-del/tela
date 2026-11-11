import { adminActions, useAdminStore } from "@/lib/admin/store";

export function useAuth() {
  const user = useAdminStore((s) => s.user);
  const loading = useAdminStore((s) => s.loading);
  const initialized = useAdminStore((s) => s.initialized);
  return { user, loading: loading || !initialized };
}

export function useUserRole() {
  const isAdmin = useAdminStore((s) => s.isAdmin);
  const loading = useAdminStore((s) => s.loading);
  return { isAdmin, loading };
}

export function useUserStats() {
  const stats = useAdminStore((s) => s.stats);
  const profile = useAdminStore((s) => s.profile);
  const loading = useAdminStore((s) => s.loading);
  return { stats, profile, loading };
}

export function useSellerConfig() {
  const config = useAdminStore((s) => s.config);
  const loading = useAdminStore((s) => s.loading);
  return { config, updateConfig: adminActions.updateConfig, loading };
}

export function useProducts() {
  const products = useAdminStore((s) => s.products);
  const loading = useAdminStore((s) => s.loading);
  return {
    products,
    loading,
    addProduct: adminActions.addProduct,
    updateProduct: adminActions.updateProduct,
    deleteProduct: adminActions.deleteProduct,
  };
}

export function useActivities() {
  const activities = useAdminStore((s) => s.activities);
  const loading = useAdminStore((s) => s.loading);
  return {
    activities,
    loading,
    refetch: adminActions.refetchActivities,
    deleteActivity: adminActions.deleteActivity,
    clearActivities: adminActions.clearActivities,
  };
}

export function useBlockedIps() {
  const blockedIps = useAdminStore((s) => s.blockedIps);
  const loading = useAdminStore((s) => s.loading);
  return {
    blockedIps,
    loading,
    refetch: adminActions.refetchBlockedIps,
    blockIp: adminActions.blockIp,
    unblockIp: adminActions.unblockIp,
    updateRefundCode: adminActions.updateRefundCode,
    isIpBlocked: (ip: string) => blockedIps.some((b) => b.ip === ip),
    getBlockedEntry: (ip: string) => blockedIps.find((b) => b.ip === ip),
  };
}

export const authActions = {
  signOut: adminActions.signOut,
};
