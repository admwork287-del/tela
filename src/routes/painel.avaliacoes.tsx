import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Star,
  Plus,
  Trash2,
  MessageSquare,
  Loader2,
  CalendarIcon,
} from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/admin";

export const Route = createFileRoute("/painel/avaliacoes")({
  head: () => ({
    meta: [
      { title: "Gerenciar Avaliações - Painel OLX" },
      { name: "robots", content: "noindex, nofollow" },
    ],
  }),
  component: ReviewsManagementPage,
});

type ReviewRow = {
  id: string;
  user_id: string;
  author: string;
  rating: number;
  comment: string;
  member_since: string | null;
  product_reviewed: string | null;
  review_date: string | null;
  created_at: string;
};

function ReviewsManagementPage() {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [reviewDate, setReviewDate] = useState<Date | undefined>();
  const [memberSinceDate, setMemberSinceDate] = useState<Date | undefined>();
  const [form, setForm] = useState({
    author: "",
    product_reviewed: "",
    rating: "5",
    comment: "",
  });

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("reviews")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    if (error) toast.error("Erro ao carregar avaliações");
    setReviews((data as ReviewRow[]) || []);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const handleAdd = async () => {
    if (!user) return;
    if (!form.author || !form.product_reviewed || !form.comment) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    const memberSince = memberSinceDate
      ? format(memberSinceDate, "MMMM 'de' yyyy", { locale: ptBR })
      : "Janeiro de 2024";
    const rDate = reviewDate
      ? format(reviewDate, "dd/MM/yyyy", { locale: ptBR }) +
        " - " +
        format(new Date(), "HH:mm")
      : format(new Date(), "dd/MM/yyyy", { locale: ptBR }) +
        " - " +
        format(new Date(), "HH:mm");

    setSaving(true);
    const { error } = await supabase.from("reviews").insert({
      user_id: user.id,
      author: form.author,
      product_reviewed: form.product_reviewed,
      rating: parseInt(form.rating, 10),
      comment: form.comment,
      member_since: memberSince,
      review_date: rDate,
    });
    setSaving(false);
    if (error) {
      toast.error("Erro ao adicionar avaliação");
      return;
    }
    toast.success("Avaliação adicionada com sucesso!");
    setForm({ author: "", product_reviewed: "", rating: "5", comment: "" });
    setReviewDate(undefined);
    setMemberSinceDate(undefined);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("reviews").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao remover");
      return;
    }
    toast.success("Avaliação removida");
    setReviews((prev) => prev.filter((r) => r.id !== id));
  };

  const renderStars = (rating: number) =>
    [...Array(5)].map((_, i) => (
      <Star
        key={i}
        size={16}
        fill={i < rating ? "#FFB800" : "transparent"}
        color={i < rating ? "#FFB800" : "#ccc"}
      />
    ));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 rounded-lg">
          <MessageSquare className="h-6 w-6 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Gerenciar Avaliações</h1>
          <p className="text-muted-foreground">
            Adicione avaliações que aparecem no perfil do vendedor
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Adicionar Nova Avaliação
          </CardTitle>
          <CardDescription>
            Preencha os dados da avaliação que será exibida na página do vendedor
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="author">Nome do Avaliador *</Label>
              <Input
                id="author"
                value={form.author}
                onChange={(e) => setForm({ ...form, author: e.target.value })}
                placeholder="Ex: João Silva"
              />
            </div>
            <div className="space-y-2">
              <Label>Membro desde</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !memberSinceDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {memberSinceDate
                      ? format(memberSinceDate, "MMMM 'de' yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={memberSinceDate}
                    onSelect={setMemberSinceDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label htmlFor="product_reviewed">Produto Avaliado *</Label>
              <Input
                id="product_reviewed"
                value={form.product_reviewed}
                onChange={(e) =>
                  setForm({ ...form, product_reviewed: e.target.value })
                }
                placeholder="Ex: Geladeira Flex"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="rating">Nota *</Label>
              <Select
                value={form.rating}
                onValueChange={(value) => setForm({ ...form, rating: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5 estrelas</SelectItem>
                  <SelectItem value="4">4 estrelas</SelectItem>
                  <SelectItem value="3">3 estrelas</SelectItem>
                  <SelectItem value="2">2 estrelas</SelectItem>
                  <SelectItem value="1">1 estrela</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Data da Avaliação</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !reviewDate && "text-muted-foreground",
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {reviewDate
                      ? format(reviewDate, "dd/MM/yyyy", { locale: ptBR })
                      : "Selecionar data"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={reviewDate}
                    onSelect={setReviewDate}
                    initialFocus
                    locale={ptBR}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="comment">Comentário *</Label>
            <Textarea
              id="comment"
              value={form.comment}
              onChange={(e) => setForm({ ...form, comment: e.target.value })}
              placeholder="Ex: Ótimo produto, entrega rápida!"
              rows={3}
            />
          </div>
          <Button onClick={handleAdd} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            <Plus className="h-4 w-4 mr-2" />
            Adicionar Avaliação
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Avaliações Cadastradas</CardTitle>
          <CardDescription>
            {reviews.length} avaliação(ões) cadastrada(s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviews.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Nenhuma avaliação cadastrada ainda
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Avaliador</TableHead>
                  <TableHead>Produto</TableHead>
                  <TableHead>Nota</TableHead>
                  <TableHead>Comentário</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reviews.map((review) => (
                  <TableRow key={review.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{review.author}</p>
                        <p className="text-xs text-muted-foreground">
                          {review.member_since}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell>{review.product_reviewed}</TableCell>
                    <TableCell>
                      <div className="flex">{renderStars(review.rating)}</div>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {review.comment}
                    </TableCell>
                    <TableCell className="text-sm">
                      {review.review_date}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(review.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
