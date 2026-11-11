import { useState } from "react";
import { useProducts, useUserStats } from "@/hooks/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Plus, Copy, Edit, Trash2, Eye, Check, Package, Loader2, CreditCard } from "lucide-react";
import { Link, useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import type { AdminProduct } from "@/lib/admin/types";

export function Products() {
  const { products, loading, deleteProduct, updateProduct } = useProducts();
  const { profile } = useUserStats();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [togglingCard, setTogglingCard] = useState<string | null>(null);

  const handleToggleCreditCard = (id: string, current: boolean) => {
    setTogglingCard(id);
    updateProduct(id, { credit_card_enabled: !current });
    toast.success(!current ? "Cartão de crédito ativado!" : "Cartão de crédito desativado!");
    setTogglingCard(null);
  };


  const filtered = products.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));

  const getProductLink = (p: AdminProduct) => {
    const base = typeof window !== "undefined" ? window.location.origin : "";
    return `${base}/${p.slug}-${profile?.display_id || 0}`;
  };

  const handleCopyLink = async (p: AdminProduct) => {
    await navigator.clipboard.writeText(getProductLink(p));
    setCopiedId(p.id);
    toast.success("Link copiado!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleDelete = (id: string) => {
    if (confirm("Tem certeza que deseja excluir este produto?")) {
      deleteProduct(id);
      toast.success("Produto excluído!");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold">Produtos</h1>
        <Button asChild size="sm" className="w-full sm:w-auto">
          <Link to="/painel/produtos/novo">
            <Plus className="h-4 w-4 mr-2" />Cadastrar Produto
          </Link>
        </Button>
      </div>

      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border">
          <Input placeholder="Buscar produtos..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-full sm:max-w-sm" />
        </div>

        <div className="hidden lg:block">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Produto</TableHead>
                <TableHead>Preço</TableHead>
                <TableHead>Views</TableHead>
                <TableHead>Vendas</TableHead>
                <TableHead>Cartão</TableHead>
                
                <TableHead>Criado em</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                        {p.image1_url ? <img src={p.image1_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-5 w-5 text-muted-foreground" />}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-xs">{p.description}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</TableCell>
                  <TableCell><div className="flex items-center gap-1"><Eye className="h-4 w-4 text-muted-foreground" />{p.views}</div></TableCell>
                  <TableCell>{p.sales}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch checked={p.credit_card_enabled} onCheckedChange={() => handleToggleCreditCard(p.id, p.credit_card_enabled)} disabled={togglingCard === p.id} />
                      {p.credit_card_enabled && <CreditCard className="h-4 w-4 text-primary" />}
                    </div>
                  </TableCell>
                  <TableCell>{format(new Date(p.created_at), "dd/MM/yyyy", { locale: ptBR })}</TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="outline" size="sm" onClick={() => handleCopyLink(p)}>
                        {copiedId === p.id ? <Check className="h-3.5 w-3.5 text-green-600" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => navigate({ to: "/painel/produtos/$id", params: { id: p.id } })}>
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(p.id)} className="text-destructive hover:text-destructive">
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filtered.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <div className="lg:hidden p-4 space-y-4">
          {filtered.map((p) => (
            <Card key={p.id} className="overflow-hidden">
              <CardContent className="p-0">
                <div className="flex gap-3 p-4">
                  <div className="w-20 h-20 rounded-lg bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                    {p.image1_url ? <img src={p.image1_url} alt={p.name} className="w-full h-full object-cover" /> : <Package className="h-8 w-8 text-muted-foreground" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{p.name}</p>
                    <p className="text-lg font-bold text-primary">R$ {p.price.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}</p>
                    <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                      <span className="flex items-center gap-1"><Eye className="h-3.5 w-3.5" />{p.views}</span>
                      <span>{p.sales} vendas</span>
                      <span className="flex items-center gap-1">
                        <CreditCard className="h-3.5 w-3.5" />
                        <Switch checked={p.credit_card_enabled} onCheckedChange={() => handleToggleCreditCard(p.id, p.credit_card_enabled)} disabled={togglingCard === p.id} className="scale-75" />
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex border-t border-border">
                  <Button variant="ghost" size="sm" onClick={() => handleCopyLink(p)} className="flex-1 rounded-none h-11 gap-2">
                    {copiedId === p.id ? <><Check className="h-4 w-4 text-green-600" />Copiado</> : <><Copy className="h-4 w-4" />Copiar Link</>}
                  </Button>
                  <div className="w-px bg-border" />
                  <Button variant="ghost" size="sm" onClick={() => navigate({ to: "/painel/produtos/$id", params: { id: p.id } })} className="flex-1 rounded-none h-11 gap-2">
                    <Edit className="h-4 w-4" />Editar
                  </Button>
                  <div className="w-px bg-border" />
                  <Button variant="ghost" size="sm" onClick={() => handleDelete(p.id)} className="flex-1 rounded-none h-11 gap-2 text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4" />Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {filtered.length === 0 && <div className="text-center py-8 text-muted-foreground">Nenhum produto encontrado</div>}
        </div>
      </div>
    </div>
  );
}
