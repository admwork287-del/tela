import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAdminUsers, type AdminUser } from "@/hooks/useAdminUsers";
import { useUserRole } from "@/hooks/admin";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  Calendar as CalendarIcon,
  Eye,
  Zap,
  Copy,
  UserPlus,
  Key,
  Trash2,
  Pencil,
  Mail,
  Package,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

export const Route = createFileRoute("/painel/usuarios")({
  head: () => ({
    meta: [
      { title: "Gerenciar Usuários - Painel OLX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: UsersPage,
});

function UsersPage() {
  const { isAdmin, loading: roleLoading } = useUserRole();
  const navigate = useNavigate();
  const {
    users,
    loading,
    refetch,
    updateUserValidity,
    updateUserInfo,
    createUser,
    deleteUser,
    updatePassword,
    updateProductLimit,
  } = useAdminUsers();

  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const [dateDialogOpen, setDateDialogOpen] = useState(false);

  const [limitOpen, setLimitOpen] = useState(false);
  const [limitUser, setLimitUser] = useState<AdminUser | null>(null);
  const [limitValue, setLimitValue] = useState<number>(5);
  const [savingLimit, setSavingLimit] = useState(false);

  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    password: "",
    validDays: 30,
    productLimit: 5,
  });

  const [passwordOpen, setPasswordOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<AdminUser | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const [editOpen, setEditOpen] = useState(false);
  const [editUser, setEditUser] = useState<AdminUser | null>(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [savingEdit, setSavingEdit] = useState(false);

  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    if (!roleLoading && !isAdmin) navigate({ to: "/painel" });
  }, [roleLoading, isAdmin, navigate]);

  if (roleLoading || loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Acesso não autorizado</p>
      </div>
    );
  }

  const handleCreate = async () => {
    if (!newUser.name || !newUser.email || !newUser.password) {
      toast.error("Preencha todos os campos");
      return;
    }
    if (newUser.password.length < 6) {
      toast.error("Senha deve ter ao menos 6 caracteres");
      return;
    }
    setCreating(true);
    try {
      await createUser(newUser);
      toast.success("Usuário criado");
      setCreateOpen(false);
      setNewUser({ name: "", email: "", password: "", validDays: 30, productLimit: 5 });
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao criar");
    } finally {
      setCreating(false);
    }
  };

  const handleSaveValidity = async () => {
    if (!selectedUser || !selectedDate) return;
    const ok = await updateUserValidity(selectedUser.id, selectedDate);
    if (ok) {
      toast.success("Validade atualizada");
      setDateDialogOpen(false);
      setSelectedUser(null);
    } else toast.error("Erro ao atualizar");
  };

  const handleSaveEdit = async () => {
    if (!editUser) return;
    if (!editName.trim()) return toast.error("Nome obrigatório");
    setSavingEdit(true);
    const res = await updateUserInfo(editUser.id, {
      name: editName.trim(),
      email: editEmail.trim() || undefined,
    });
    setSavingEdit(false);
    if (res.success) {
      toast.success("Atualizado");
      setEditOpen(false);
    } else toast.error(res.error || "Erro");
  };

  const handleSavePassword = async () => {
    if (!passwordUser || newPassword.length < 6) {
      toast.error("Senha deve ter ao menos 6 caracteres");
      return;
    }
    setSavingPassword(true);
    try {
      await updatePassword(passwordUser.id, newPassword);
      toast.success("Senha atualizada");
      setPasswordOpen(false);
      setNewPassword("");
    } catch (e: any) {
      toast.error(e.message || "Erro");
    } finally {
      setSavingPassword(false);
    }
  };

  const handleDelete = async (u: AdminUser) => {
    setDeleting(u.id);
    try {
      await deleteUser(u.id);
      toast.success(`Usuário ${u.name} deletado`);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao deletar");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Usuários</h1>
          <p className="text-muted-foreground">
            Edite validade, senha e informações dos usuários
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Usuário
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Novo Usuário</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Nome</Label>
                <Input
                  value={newUser.name}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={newUser.email}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Senha</Label>
                <Input
                  type="password"
                  value={newUser.password}
                  onChange={(e) =>
                    setNewUser((p) => ({ ...p, password: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Dias de Validade</Label>
                <Input
                  type="number"
                  min={1}
                  value={newUser.validDays}
                  onChange={(e) =>
                    setNewUser((p) => ({
                      ...p,
                      validDays: parseInt(e.target.value) || 30,
                    }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label>Limite de Produtos</Label>
                <Input
                  type="number"
                  min={0}
                  value={newUser.productLimit}
                  onChange={(e) =>
                    setNewUser((p) => ({
                      ...p,
                      productLimit: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">Quantidade máxima de produtos que o usuário pode criar</p>
              </div>
              <Button
                onClick={handleCreate}
                className="w-full"
                disabled={creating}
              >
                {creating ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : null}
                Criar Usuário
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Usuários ({users.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Eye className="h-4 w-4" />
                      Acessos
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Zap className="h-4 w-4" />
                      PIX
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Copy className="h-4 w-4" />
                      Copiados
                    </div>
                  </TableHead>
                  <TableHead className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Package className="h-4 w-4" />
                      Produtos
                    </div>
                  </TableHead>
                  <TableHead>Validade</TableHead>
                  <TableHead>Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-mono text-sm">
                      #{u.display_id}
                    </TableCell>
                    <TableCell className="font-medium">{u.name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {u.email || <span className="italic">—</span>}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.stats?.total_access || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.stats?.pix_generated || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {u.stats?.pix_copied || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      <span className={u.product_count >= u.product_limit ? "text-destructive font-semibold" : ""}>
                        {u.product_count} / {u.product_limit}
                      </span>
                    </TableCell>
                    <TableCell>
                      {u.valid_until ? (
                        <span className="text-sm">
                          {formatDistanceToNow(new Date(u.valid_until), {
                            locale: ptBR,
                            addSuffix: true,
                          })}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          title="Editar nome/email"
                          onClick={() => {
                            setEditUser(u);
                            setEditName(u.name);
                            setEditEmail(u.email || "");
                            setEditOpen(true);
                          }}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Editar validade"
                          onClick={() => {
                            setSelectedUser(u);
                            setSelectedDate(
                              u.valid_until ? new Date(u.valid_until) : new Date(),
                            );
                            setDateDialogOpen(true);
                          }}
                        >
                          <CalendarIcon className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Editar limite de produtos"
                          onClick={() => {
                            setLimitUser(u);
                            setLimitValue(u.product_limit);
                            setLimitOpen(true);
                          }}
                        >
                          <Package className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          title="Alterar senha"
                          onClick={() => {
                            setPasswordUser(u);
                            setNewPassword("");
                            setPasswordOpen(true);
                          }}
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="destructive"
                              size="sm"
                              title="Deletar"
                              disabled={deleting === u.id}
                            >
                              {deleting === u.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Deletar Usuário</AlertDialogTitle>
                              <AlertDialogDescription>
                                Deletar <strong>{u.name}</strong>? Todos os dados
                                serão removidos permanentemente.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(u)}>
                                Deletar
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dateDialogOpen} onOpenChange={setDateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Validade - {selectedUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-4 py-4">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={setSelectedDate}
              locale={ptBR}
              className="rounded-md border"
            />
            <Button onClick={handleSaveValidity} className="w-full">
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nome</Label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
              />
            </div>
            <Button onClick={handleSaveEdit} disabled={savingEdit} className="w-full">
              {savingEdit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={passwordOpen} onOpenChange={setPasswordOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Alterar Senha - {passwordUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Nova Senha</Label>
              <Input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres"
              />
            </div>
            <Button
              onClick={handleSavePassword}
              disabled={savingPassword}
              className="w-full"
            >
              {savingPassword ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : null}
              Atualizar Senha
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={limitOpen} onOpenChange={setLimitOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Limite de Produtos - {limitUser?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Quantidade máxima de produtos</Label>
              <Input
                type="number"
                min={0}
                value={limitValue}
                onChange={(e) => setLimitValue(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Este usuário tem {limitUser?.product_count ?? 0} produto(s) cadastrado(s).
              </p>
            </div>
            <Button
              onClick={async () => {
                if (!limitUser) return;
                setSavingLimit(true);
                const ok = await updateProductLimit(limitUser.id, limitValue);
                setSavingLimit(false);
                if (ok) { toast.success("Limite atualizado"); setLimitOpen(false); }
                else toast.error("Erro ao atualizar limite");
              }}
              disabled={savingLimit}
              className="w-full"
            >
              {savingLimit ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
              Salvar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
