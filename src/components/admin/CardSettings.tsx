import { useState } from "react";
import { useProducts } from "@/hooks/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Save, Loader2, CreditCard } from "lucide-react";
import { toast } from "sonner";

export function CardSettings() {
  const { products, updateProduct, loading: productsLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [cardEnabled, setCardEnabled] = useState(false);
  const [cardType, setCardType] = useState<"external" | "native">("external");
  const [cardLink, setCardLink] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = products.find((p) => p.id === selectedProductId);

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      setCardEnabled(p.credit_card_enabled ?? false);
      setCardType(((p as any).credit_card_type ?? "external") as "external" | "native");
      setCardLink((p as any).credit_card_payment_link ?? "");
    }
  };

  const handleSave = () => {
    if (!selectedProductId) return toast.error("Selecione um produto");
    if (cardEnabled && cardType === "external" && !cardLink.trim())
      return toast.error("Informe o link de pagamento do checkout externo");
    setSaving(true);
    updateProduct(selectedProductId, {
      credit_card_enabled: cardEnabled,
      credit_card_type: cardType,
      credit_card_payment_link: cardLink.trim() || null,
    });
    setSaving(false);
    toast.success("Configurações do cartão salvas com sucesso!");
  };

  if (productsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg"><CreditCard className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold">Configuração do Cartão</h1>
          <p className="text-muted-foreground">Ative e configure o pagamento com cartão de crédito por produto</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Produto</CardTitle>
          <CardDescription>Escolha o produto para configurar o cartão</CardDescription>
        </CardHeader>
        <CardContent>
          <Select value={selectedProductId} onValueChange={handleProductChange}>
            <SelectTrigger><SelectValue placeholder="Selecione um produto" /></SelectTrigger>
            <SelectContent>
              {products.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {p.name} - R$ {Number(p.price).toLocaleString("pt-BR")}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {products.length === 0 && <p className="text-sm text-muted-foreground mt-4">Nenhum produto cadastrado.</p>}
        </CardContent>
      </Card>

      {selected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Cartão de Crédito - {selected.name}</CardTitle>
              <CardDescription>Configure a opção de pagamento com cartão para este produto</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-base font-semibold">Aceitar cartão de crédito</Label>
                  <p className="text-sm text-muted-foreground">Exibe a opção de cartão na página de compra segura.</p>
                </div>
                <Switch checked={cardEnabled} onCheckedChange={setCardEnabled} />
              </div>
              {cardEnabled && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo de checkout</Label>
                    <Select value={cardType} onValueChange={(v) => setCardType(v as "external" | "native")}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="native">Checkout interno (formulário no site)</SelectItem>
                        <SelectItem value="external">Checkout externo (link de pagamento)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {cardType === "external" && (
                    <div className="space-y-2">
                      <Label>Link de pagamento *</Label>
                      <Input value={cardLink} onChange={(e) => setCardLink(e.target.value)} placeholder="https://..." />
                      <p className="text-xs text-muted-foreground">O cliente é redirecionado para este link ao escolher cartão.</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleSave} className="w-full sm:w-auto" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Save className="h-4 w-4 mr-2" />Salvar Configurações
          </Button>
        </>
      )}
    </div>
  );
}
