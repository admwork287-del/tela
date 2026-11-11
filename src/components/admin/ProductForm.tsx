import { useState, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useProducts, useUserRole } from "@/hooks/admin";
import { ImageUpload } from "@/components/admin/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { categories, getCategoryConfig } from "@/lib/data/categoryFields";

interface Props { editingId?: string }

export function ProductForm({ editingId }: Props) {
  const navigate = useNavigate();
  const id = editingId;
  const { products, addProduct, updateProduct } = useProducts();
  const { isAdmin } = useUserRole();
  const isEditing = !!id;


  const [saving, setSaving] = useState(false);
  const [extraFields, setExtraFields] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState({
    name: "", description: "", price: "", garantia_olx: "49",
    image1_url: "", image2_url: "", image3_url: "",
    neighborhood: "", city: "", state: "", cep: "",
    seller_name: "", seller_cpf: "", seller_avatar_url: "",
    category: "", brand: "", condition: "Novo", product_type: "", voltage: "",
    publish_date: new Date().toISOString().split("T")[0],
    publish_time: "10:00",
    credit_card_enabled: false,
    credit_card_type: "external" as "external" | "native",
    credit_card_payment_link: "",
    pay_on_delivery_enabled: false,
    pay_on_delivery_whatsapp: "",
    pay_on_delivery_show_button: true,
  });

  const categoryConfig = getCategoryConfig(formData.category);
  const existing = isEditing ? products.find((p) => p.id === id) : null;

  useEffect(() => {
    if (existing) {
      setFormData({
        name: existing.name,
        description: existing.description,
        price: String(existing.price),
        garantia_olx: String(existing.garantia_olx),
        image1_url: existing.image1_url,
        image2_url: existing.image2_url,
        image3_url: existing.image3_url,
        neighborhood: existing.neighborhood,
        city: existing.city,
        state: existing.state,
        cep: existing.cep,
        seller_name: existing.seller_name,
        seller_cpf: existing.seller_cpf,
        seller_avatar_url: existing.seller_avatar_url,
        category: existing.category,
        brand: existing.brand,
        condition: existing.condition,
        product_type: existing.product_type,
        voltage: existing.voltage,
        publish_date: existing.publish_date,
        publish_time: existing.publish_time,
        credit_card_enabled: existing.credit_card_enabled ?? false,
        credit_card_type: (existing.credit_card_type ?? "external") as "external" | "native",
        credit_card_payment_link: existing.credit_card_payment_link ?? "",
        pay_on_delivery_enabled: existing.pay_on_delivery_enabled ?? false,
        pay_on_delivery_whatsapp: existing.pay_on_delivery_whatsapp ?? "",
        pay_on_delivery_show_button: existing.pay_on_delivery_show_button ?? true,
      });
      setExtraFields(existing.extra_fields || {});
    }
  }, [existing?.id]);

  useEffect(() => {
    if (categoryConfig?.defaultType && !formData.product_type) {
      setFormData((prev) => ({ ...prev, product_type: categoryConfig.defaultType || "" }));
    }
  }, [formData.category]);

  const formatCep = (v: string) => {
    const n = v.replace(/\D/g, "").slice(0, 8);
    return n.length > 5 ? n.slice(0, 5) + "-" + n.slice(5) : n;
  };

  const handleCepChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCep(e.target.value);
    setFormData({ ...formData, cep: formatted });
    const clean = formatted.replace(/\D/g, "");
    if (clean.length === 8) {
      try {
        const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        const d = await r.json();
        if (!d.erro) {
          setFormData((prev) => ({ ...prev, cep: formatted, city: d.localidade || "", neighborhood: d.bairro || "", state: d.uf || "" }));
        }
      } catch {}
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.price || !formData.seller_name) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    setSaving(true);
    const data = {
      ...formData,
      price: parseFloat(formData.price),
      garantia_olx: parseFloat(formData.garantia_olx),
      cep: formData.cep.replace(/\D/g, ""),
      extra_fields: extraFields,
      credit_card_enabled: formData.credit_card_enabled,
      credit_card_type: formData.credit_card_type,
      credit_card_payment_link: formData.credit_card_payment_link.trim() || null,
      ...(isAdmin
        ? {
            pay_on_delivery_enabled: formData.pay_on_delivery_enabled,
            pay_on_delivery_whatsapp: formData.pay_on_delivery_enabled
              ? formData.pay_on_delivery_whatsapp.replace(/\D/g, "") || null
              : null,
            pay_on_delivery_show_button: formData.pay_on_delivery_show_button,
          }
        : {}),
    };
    if (isEditing && id) {
      updateProduct(id, data);
      toast.success("Produto atualizado!");
    } else {
      addProduct(data);
      toast.success("Produto cadastrado! Configure o Pix na aba de configurações.");
    }
    setSaving(false);
    navigate({ to: "/painel/produtos" });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate({ to: "/painel/produtos" })}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-2xl font-bold">{isEditing ? "Editar Produto" : "Cadastrar Produto"}</h1>
      </div>

      <p className="text-muted-foreground">Preencha os dados do produto</p>

      <form onSubmit={handleSubmit} className="space-y-6">
        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Detalhes do Produto</h2>
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Produto *</Label>
            <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Ar Condicionado LG 12.000 Btus" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição do Produto</Label>
            <Textarea id="description" value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} placeholder="Descreva o produto..." rows={4} />
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Fotos do Produto</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            <ImageUpload label="Foto 1 - Destaque" value={formData.image1_url} onChange={(url) => setFormData({ ...formData, image1_url: url })} />
            <ImageUpload label="Foto 2" value={formData.image2_url} onChange={(url) => setFormData({ ...formData, image2_url: url })} />
            <ImageUpload label="Foto 3" value={formData.image3_url} onChange={(url) => setFormData({ ...formData, image3_url: url })} />
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Preço e Garantia</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="price">Preço do Produto (R$) *</Label>
              <Input id="price" type="number" step="0.01" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} placeholder="0,00" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="garantia_olx">Garantia da OLX (R$)</Label>
              <Input id="garantia_olx" type="number" step="0.01" value={formData.garantia_olx} onChange={(e) => setFormData({ ...formData, garantia_olx: e.target.value })} placeholder="49,00" />
            </div>
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Dados do Anunciante</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label>Foto do Anunciante</Label>
              <ImageUpload label="Foto de Perfil" value={formData.seller_avatar_url} onChange={(url) => setFormData({ ...formData, seller_avatar_url: url })} />
              <p className="text-xs text-muted-foreground">Aparece no perfil do vendedor e página do produto</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_name">Nome do Anunciante *</Label>
              <Input id="seller_name" value={formData.seller_name} onChange={(e) => setFormData({ ...formData, seller_name: e.target.value })} placeholder="Ex: Raissa Souza" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seller_cpf">CPF do Anunciante</Label>
              <Input id="seller_cpf" value={formData.seller_cpf} onChange={(e) => setFormData({ ...formData, seller_cpf: e.target.value })} placeholder="Ex: *** 867 700 **" />
            </div>
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Categoria e Detalhes</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Categoria do Produto</Label>
              <Select value={formData.category} onValueChange={(v) => { setFormData({ ...formData, category: v, product_type: "" }); setExtraFields({}); }}>
                <SelectTrigger><SelectValue placeholder="Selecione a Categoria" /></SelectTrigger>
                <SelectContent>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Tipo do Produto</Label>
              {categoryConfig?.types && categoryConfig.types.length > 0 ? (
                <Select value={formData.product_type} onValueChange={(v) => setFormData({ ...formData, product_type: v })}>
                  <SelectTrigger><SelectValue placeholder="Selecione o tipo" /></SelectTrigger>
                  <SelectContent>{categoryConfig.types.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                </Select>
              ) : (
                <Input value={formData.product_type} onChange={(e) => setFormData({ ...formData, product_type: e.target.value })} placeholder="Ex: Ar condicionado e ventilação" />
              )}
            </div>
            <div className="space-y-2">
              <Label>Condição</Label>
              <Select value={formData.condition} onValueChange={(v) => setFormData({ ...formData, condition: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Novo">Novo</SelectItem>
                  <SelectItem value="Seminovo">Seminovo</SelectItem>
                  <SelectItem value="Usado">Usado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" value={formData.brand} onChange={(e) => setFormData({ ...formData, brand: e.target.value })} placeholder="Ex: LG" />
            </div>
            {categoryConfig?.fields.map((f) => (
              <div key={f.key} className="space-y-2">
                <Label>{f.label}</Label>
                {f.type === "select" && f.options ? (
                  <Select value={extraFields[f.key] || ""} onValueChange={(v) => setExtraFields({ ...extraFields, [f.key]: v })}>
                    <SelectTrigger><SelectValue placeholder={`Selecione ${f.label.toLowerCase()}`} /></SelectTrigger>
                    <SelectContent>{f.options.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
                  </Select>
                ) : (
                  <Input value={extraFields[f.key] || ""} onChange={(e) => setExtraFields({ ...extraFields, [f.key]: e.target.value })} placeholder={f.placeholder} />
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Data e Localização</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label>Data</Label><Input type="date" value={formData.publish_date} onChange={(e) => setFormData({ ...formData, publish_date: e.target.value })} /></div>
            <div className="space-y-2"><Label>Horário</Label><Input type="time" value={formData.publish_time} onChange={(e) => setFormData({ ...formData, publish_time: e.target.value })} /></div>
            <div className="space-y-2"><Label>CEP</Label><Input value={formData.cep} onChange={handleCepChange} placeholder="00000-000" /></div>
            <div className="space-y-2"><Label>Cidade</Label><Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} placeholder="Ex: São Paulo" /></div>
            <div className="space-y-2"><Label>Bairro</Label><Input value={formData.neighborhood} onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })} placeholder="Ex: Centro" /></div>
            <div className="space-y-2"><Label>Estado</Label><Input value={formData.state} onChange={(e) => setFormData({ ...formData, state: e.target.value })} placeholder="Ex: SP" maxLength={2} /></div>
          </div>
        </section>

        <section className="bg-card rounded-lg border border-border p-6 space-y-6">
          <h2 className="text-lg font-semibold border-b border-border pb-3">Cartão de Crédito</h2>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base font-semibold">Aceitar cartão de crédito</Label>
              <p className="text-sm text-muted-foreground">Exibe a opção de cartão na página de compra segura.</p>
            </div>
            <Switch checked={formData.credit_card_enabled} onCheckedChange={(c) => setFormData((p) => ({ ...p, credit_card_enabled: c }))} />
          </div>
          {formData.credit_card_enabled && (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Tipo de cobrança</Label>
                <Select value={formData.credit_card_type} onValueChange={(v) => setFormData((p) => ({ ...p, credit_card_type: v as "external" | "native" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="external">Link externo de pagamento</SelectItem>
                    <SelectItem value="native">Formulário de cartão no site</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {formData.credit_card_type === "external" && (
                <div className="space-y-2">
                  <Label>Link de pagamento</Label>
                  <Input value={formData.credit_card_payment_link} onChange={(e) => setFormData({ ...formData, credit_card_payment_link: e.target.value })} placeholder="https://..." />
                </div>
              )}
            </div>
          )}
        </section>

        {isAdmin && (
          <section className="bg-card rounded-lg border border-border p-6 space-y-6">
            <h2 className="text-lg font-semibold border-b border-border pb-3">Pagar na Entrega (somente admin)</h2>
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-base font-semibold">Ativar pagar na entrega</Label>
                <p className="text-sm text-muted-foreground">Exibe a opção "Pagar na entrega" na página de compra segura.</p>
              </div>
              <Switch checked={formData.pay_on_delivery_enabled} onCheckedChange={(c) => setFormData((p) => ({ ...p, pay_on_delivery_enabled: c }))} />
            </div>
            {formData.pay_on_delivery_enabled && (
              <div className="space-y-2">
                <Label htmlFor="pay_on_delivery_whatsapp">Número de WhatsApp para liberar a compra</Label>
                <Input
                  id="pay_on_delivery_whatsapp"
                  value={formData.pay_on_delivery_whatsapp}
                  onChange={(e) => setFormData({ ...formData, pay_on_delivery_whatsapp: e.target.value })}
                  placeholder="Ex: 11999998888"
                />
                <p className="text-xs text-muted-foreground">
                  Após confirmar, o cliente verá um botão que abre uma conversa neste WhatsApp para confirmar e liberar a compra.
                </p>
              </div>
            )}
          </section>
        )}

        <div className="flex gap-4">
          <Button type="button" variant="outline" onClick={() => navigate({ to: "/painel/produtos" })}>Cancelar</Button>
          <Button type="submit" disabled={saving}>
            {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Salvar Alterações" : "Cadastrar Produto"}
          </Button>
        </div>
      </form>
    </div>
  );
}
