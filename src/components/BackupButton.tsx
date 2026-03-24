import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetData } from "@/lib/api";
import { toast } from "sonner";

function toCsv(headers: string[], rows: Record<string, unknown>[]): string {
  const escape = (v: unknown) => {
    const s = v == null ? "" : String(v);
    return s.includes(",") || s.includes('"') || s.includes("\n")
      ? `"${s.replace(/"/g, '""')}"`
      : s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

function downloadFile(content: string, filename: string) {
  const blob = new Blob(["\uFEFF" + content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export const BackupButton = () => {
  const { sessionToken } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleBackup = async () => {
    if (!sessionToken) {
      toast.error("Você precisa estar logado para fazer backup");
      return;
    }

    setLoading(true);
    try {
      const [clientes, servicos, pedidos] = await Promise.all([
        apiGetData<Record<string, unknown>[]>("clientes", sessionToken),
        apiGetData<Record<string, unknown>[]>("servicos", sessionToken),
        apiGetData<Record<string, unknown>[]>("pedidos", sessionToken),
      ]);

      const now = new Date().toISOString().slice(0, 10);

      if (clientes.data?.length) {
        downloadFile(
          toCsv(["numero", "nome", "telefone", "endereco", "cpf", "cnpj", "created_at"], clientes.data),
          `backup_clientes_${now}.csv`
        );
      }

      if (servicos.data?.length) {
        downloadFile(
          toCsv(["nome", "categoria", "preco", "ativo", "created_at"], servicos.data),
          `backup_servicos_${now}.csv`
        );
      }

      if (pedidos.data?.length) {
        downloadFile(
          toCsv(["numero", "cliente_nome", "cliente_telefone", "valor_total", "status", "pago", "retirado", "desconto_percentual", "desconto_valor", "taxa_entrega", "itens", "created_at"], pedidos.data),
          `backup_pedidos_${now}.csv`
        );
      }

      toast.success("Backup realizado com sucesso!");
    } catch (e) {
      toast.error("Erro ao fazer backup");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBackup}
      disabled={loading}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      {loading ? "Exportando..." : "Backup"}
    </Button>
  );
};
