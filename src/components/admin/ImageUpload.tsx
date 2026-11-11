import { useRef, useState } from "react";
import { Upload, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { getState } from "@/lib/admin/store";
import { toast } from "sonner";

interface ImageUploadProps {
  label: string;
  value: string;
  onChange: (url: string) => void;
}

export function ImageUpload({ label, value, onChange }: ImageUploadProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File) => {
    const user = getState().user;
    if (!user) {
      toast.error("Faça login para enviar imagens");
      return;
    }
    setUploading(true);
    try {
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from("product-images").upload(path, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("product-images").getPublicUrl(path);
      onChange(data.publicUrl);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Erro no upload";
      toast.error(msg);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label className="text-sm">{label}</Label>
      {value ? (
        <div className="relative aspect-square overflow-hidden rounded-lg border border-border bg-muted">
          <img src={value} alt={label} className="h-full w-full object-cover" />
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => onChange("")}
            className="absolute right-2 top-2 h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="flex aspect-square w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 text-muted-foreground transition-colors hover:border-primary hover:bg-muted/50 disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-medium">Enviando...</span>
            </>
          ) : (
            <>
              <Upload className="h-6 w-6" />
              <span className="text-xs font-medium">Enviar imagem</span>
            </>
          )}
        </button>
      )}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
