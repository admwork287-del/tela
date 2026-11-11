import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AdminUser = {
  id: string;
  display_id: number;
  name: string;
  email: string | null;
  valid_until: string | null;
  created_at: string;
  product_limit: number;
  product_count: number;
  stats?: { total_access: number; pix_generated: number; pix_copied: number };
};

// Todas as ações de admin rodam em funções SECURITY DEFINER no banco
// (admin_*), protegidas por has_role(auth.uid(), 'admin').
// Não precisa de PHP, service_role key nem edge function.
async function rpc<T>(fn: string, args: Record<string, unknown> = {}) {
  const { data, error } = await supabase.rpc(fn as never, args as never);
  if (error) throw new Error(error.message);
  return data as T;
}

export function useAdminUsers() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);

  const refetch = useCallback(async () => {
    setLoading(true);
    try {
      const data = await rpc<AdminUser[]>("admin_list_users");
      setUsers(Array.isArray(data) ? data : []);
    } catch {
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  const updateUserValidity = async (userId: string, date: Date) => {
    try {
      await rpc("admin_update_validity", {
        _user_id: userId,
        _valid_until: date.toISOString(),
      });
      await refetch();
      return true;
    } catch {
      return false;
    }
  };

  const updateUserInfo = async (
    userId: string,
    payload: { name?: string; email?: string },
  ) => {
    try {
      await rpc("admin_update_user_info", {
        _user_id: userId,
        _name: payload.name ?? null,
        _email: payload.email ?? null,
      });
      await refetch();
      return { success: true as const };
    } catch (e: any) {
      return { success: false as const, error: e.message };
    }
  };

  const createUser = async (payload: {
    name: string;
    email: string;
    password: string;
    validDays: number;
    productLimit: number;
  }) => {
    await rpc("admin_create_user", {
      _email: payload.email,
      _password: payload.password,
      _name: payload.name,
      _valid_days: payload.validDays,
      _product_limit: payload.productLimit,
    });
    await refetch();
    return { ok: true };
  };

  const deleteUser = async (userId: string) => {
    await rpc("admin_delete_user", { _user_id: userId });
    await refetch();
    return { ok: true };
  };

  const updatePassword = async (userId: string, newPassword: string) => {
    await rpc("admin_update_password", {
      _user_id: userId,
      _new_password: newPassword,
    });
    return { ok: true };
  };

  const updateProductLimit = async (userId: string, productLimit: number) => {
    try {
      await rpc("admin_update_product_limit", {
        _user_id: userId,
        _product_limit: productLimit,
      });
      await refetch();
      return true;
    } catch {
      return false;
    }
  };

  return {
    users,
    loading,
    refetch,
    updateUserValidity,
    updateUserInfo,
    createUser,
    deleteUser,
    updatePassword,
    updateProductLimit,
  };
}
