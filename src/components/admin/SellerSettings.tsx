import { useState, useEffect } from 'react';
import { useSellerConfig } from '@/hooks/useSellerConfig';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Loader2, Save } from 'lucide-react';

export const SellerSettings = () => {
  const { user } = useAuth();
  const { config: sellerConfig, loading, updateConfig } = useSellerConfig();
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    since: '',
    sales_completed: 0,
    sales_canceled: 0,
    reviews: 0,
    avg_delivery_hours: 0,
  });

  useEffect(() => {
    if (sellerConfig) {
      setFormData({
        since: sellerConfig.since || '',
        sales_completed: sellerConfig.sales_completed || 0,
        sales_canceled: sellerConfig.sales_canceled || 0,
        reviews: sellerConfig.reviews || 0,
        avg_delivery_hours: sellerConfig.avg_delivery_hours || 0,
      });
    }
  }, [sellerConfig]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Você precisa estar logado');
      return;
    }

    setSaving(true);
    try {
      await updateConfig(formData);
      toast.success('Configurações salvas com sucesso!');
    } catch (error) {
      toast.error('Erro ao salvar configurações');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Configurações do Anunciante</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="since">Na OLX desde</Label>
              <Input
                id="since"
                type="text"
                placeholder="Ex: 2020"
                value={formData.since}
                onChange={(e) => setFormData({ ...formData, since: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="sales_completed">Vendas Realizadas</Label>
                <Input
                  id="sales_completed"
                  type="number"
                  min="0"
                  value={formData.sales_completed}
                  onChange={(e) => setFormData({ ...formData, sales_completed: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="sales_canceled">Vendas Canceladas</Label>
                <Input
                  id="sales_canceled"
                  type="number"
                  min="0"
                  value={formData.sales_canceled}
                  onChange={(e) => setFormData({ ...formData, sales_canceled: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reviews">Avaliações</Label>
                <Input
                  id="reviews"
                  type="number"
                  min="0"
                  value={formData.reviews}
                  onChange={(e) => setFormData({ ...formData, reviews: parseInt(e.target.value) || 0 })}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="avg_delivery_hours">Tempo Médio de Entrega (horas)</Label>
                <Input
                  id="avg_delivery_hours"
                  type="number"
                  min="0"
                  value={formData.avg_delivery_hours}
                  onChange={(e) => setFormData({ ...formData, avg_delivery_hours: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full">
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Salvar Configurações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
