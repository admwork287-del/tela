import { useState } from "react";
import { useProducts } from "@/hooks/admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Save, QrCode, Copy, Loader2, Zap } from "lucide-react";
import { toast } from "sonner";

type PixMode = "manual" | "automatic";

export function PixSettings() {
  const { products, updateProduct, loading: productsLoading } = useProducts();
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [pixMode, setPixMode] = useState<PixMode>("manual");
  const [pixCopiaCola, setPixCopiaCola] = useState("");
  const [processorName, setProcessorName] = useState("NOVUS LTDA");
  const [bcName, setBcName] = useState("");
  const [bcEmail, setBcEmail] = useState("");
  const [bcPhone, setBcPhone] = useState("");
  const [bcDocument, setBcDocument] = useState("");
  const [saving, setSaving] = useState(false);

  const selected = products.find((p) => p.id === selectedProductId);
  const selectedTotal = selected ? Number(selected.price || 0) + Number((selected as any).garantia_olx || 0) : 0;
  const automaticDisabled = selectedTotal >= 1400;

  const handleProductChange = (id: string) => {
    setSelectedProductId(id);
    const p = products.find((x) => x.id === id);
    if (p) {
      const storedMode = ((p as any).pix_mode ?? "manual") as PixMode;
      const total = Number(p.price || 0) + Number((p as any).garantia_olx || 0);
      // força manual se automático estiver desabilitado pelo valor
      setPixMode(total >= 1400 && storedMode === "automatic" ? "manual" : storedMode);
      setPixCopiaCola(p.pix_copia_cola || "");
      setProcessorName(p.processor_name || "NOVUS LTDA");
      setBcName((p as any).blackcat_customer_name ?? "");
      setBcEmail((p as any).blackcat_customer_email ?? "");
      setBcPhone((p as any).blackcat_customer_phone ?? "");
      setBcDocument((p as any).blackcat_customer_document ?? "");
    }
  };

  const handleSave = () => {
    if (!selectedProductId) return toast.error("Selecione um produto");
    if (pixMode === "manual" && !pixCopiaCola) return toast.error("Digite o código Pix Copia e Cola");
    if (pixMode === "automatic") {
      if (automaticDisabled)
        return toast.error("Pix automático só pode ser ativado para valores abaixo de R$ 1.400,00. Use o Pix manual.");
      if (!bcName.trim() || !bcEmail.trim() || !bcPhone.trim() || !bcDocument.trim())
        return toast.error("Preencha todos os dados do cliente para o PIX automático");
    }

    setSaving(true);
    updateProduct(selectedProductId, {
      pix_mode: pixMode,
      pix_copia_cola: pixMode === "manual" ? pixCopiaCola : null,
      qr_code_url: null,
      processor_name: processorName.trim() || "NOVUS LTDA",
      blackcat_customer_name: pixMode === "automatic" ? bcName.trim() : null,
      blackcat_customer_email: pixMode === "automatic" ? bcEmail.trim() : null,
      blackcat_customer_phone: pixMode === "automatic" ? bcPhone.trim() : null,
      blackcat_customer_document: pixMode === "automatic" ? bcDocument.trim() : null,
    });
    setSaving(false);
    toast.success("Configurações do Pix e Gateway salvas com sucesso!");
  };

  if (productsLoading) {
    return <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg"><DollarSign className="h-6 w-6 text-primary" /></div>
        <div>
          <h1 className="text-2xl font-bold">Configuração do Pix</h1>
          <p className="text-muted-foreground">Configure o Pix Manual ou Automático e o Gateway de cada produto</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Selecionar Produto</CardTitle>
          <CardDescription>Escolha o produto para configurar o Pix</CardDescription>
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
          {products.length === 0 && <p className="text-sm text-muted-foreground mt-4">Nenhum produto cadastrado. Cadastre um produto primeiro.</p>}
        </CardContent>
      </Card>

      {selected && (
        <>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><QrCode className="h-5 w-5" />Modo do Pix - {selected.name}</CardTitle>
              <CardDescription>Escolha entre inserir o código manualmente ou gerá-lo automaticamente</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Modo</Label>
                <Select
                  value={pixMode}
                  onValueChange={(v) => {
                    if (v === "automatic" && automaticDisabled) {
                      toast.error("Pix automático só pode ser ativado para valores abaixo de R$ 1.400,00.");
                      return;
                    }
                    setPixMode(v as PixMode);
                  }}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Pix Manual (Copia e Cola)</SelectItem>
                    <SelectItem value="automatic" disabled={automaticDisabled}>
                      Pix Automático{automaticDisabled ? " — indisponível acima de R$ 1.400,00" : ""}
                    </SelectItem>
                  </SelectContent>
                </Select>
                {automaticDisabled && (
                  <p className="text-xs text-red-600">
                    Valor total deste produto (R$ {selectedTotal.toLocaleString("pt-BR")}) ultrapassa R$ 1.400,00.
                    O Pix automático só pode ser ativado abaixo desse limite. Use o Pix manual para valores maiores.
                  </p>
                )}
              </div>

              {pixMode === "manual" && (
                <div className="space-y-2">
                  <Label htmlFor="pixCopiaCola" className="flex items-center gap-2"><Copy className="h-4 w-4" />Pix Copia e Cola</Label>
                  <Textarea id="pixCopiaCola" value={pixCopiaCola} onChange={(e) => setPixCopiaCola(e.target.value)} placeholder="Cole aqui o código Pix Copia e Cola gerado pelo seu banco" rows={4} className="font-mono text-sm" />
                  <p className="text-xs text-muted-foreground">O QR Code é gerado automaticamente a partir do código Pix Copia e Cola.</p>
                </div>
              )}

              {pixMode === "automatic" && (
                <div className="space-y-4 rounded-lg border border-primary/20 bg-primary/5 p-4">
                  <div className="flex items-start gap-2">
                    <Zap className="h-5 w-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold">Pix Automático</p>
                      <p className="text-xs text-muted-foreground">O código Pix e o QR Code são gerados automaticamente no momento da compra. Preencha os dados do cliente que serão enviados ao gateway.</p>
                    </div>
                  </div>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Nome do cliente</Label>
                      <Input value={bcName} onChange={(e) => setBcName(e.target.value)} placeholder="Nome completo" />
                    </div>
                    <div className="space-y-2">
                      <Label>E-mail do cliente</Label>
                      <Input type="email" value={bcEmail} onChange={(e) => setBcEmail(e.target.value)} placeholder="cliente@email.com" />
                    </div>
                    <div className="space-y-2">
                      <Label>Telefone (DDD + número)</Label>
                      <Input value={bcPhone} onChange={(e) => setBcPhone(e.target.value)} placeholder="11999999999" />
                    </div>
                    <div className="space-y-2">
                      <Label>CPF ou CNPJ</Label>
                      <Input value={bcDocument} onChange={(e) => setBcDocument(e.target.value)} placeholder="Somente números" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5" />Gateway de Pagamento</CardTitle>
              <CardDescription>Configure o nome da empresa que aparecerá como processadora do pagamento na página do Pix</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label>Nome do Processador</Label>
                <Input value={processorName} onChange={(e) => setProcessorName(e.target.value)} placeholder="Ex: NOVUS LTDA, Pagamentos S.A, etc." />
                <p className="text-xs text-muted-foreground">Este nome será exibido na página de pagamento como "Processado por: {processorName || "NOVUS LTDA"}"</p>
              </div>
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
