import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ItemPedido, StatusPedido } from "@/types";
import { ClienteDB } from "./useClientes";

export interface PedidoDB {
  id: string;
  numero: string;
  cliente_id: string;
  cliente_nome: string;
  cliente_telefone: string;
  valor_total: number;
  status: StatusPedido;
  itens: ItemPedido[];
  created_at: string;
  updated_at: string;
}

export const usePedidos = () => {
  const queryClient = useQueryClient();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("pedidos")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        toast.error("Erro ao carregar pedidos");
        throw error;
      }
      
      return (data || []).map(p => ({
        ...p,
        valor_total: Number(p.valor_total),
        itens: p.itens as unknown as ItemPedido[],
        status: p.status as StatusPedido
      })) as PedidoDB[];
    },
  });

  const addPedido = useMutation({
    mutationFn: async ({ cliente, itens }: { cliente: ClienteDB; itens: ItemPedido[] }) => {
      const valorTotal = itens.reduce(
        (acc, item) => acc + item.servico.preco * item.quantidade,
        0
      );

      const { data, error } = await supabase
        .from("pedidos")
        .insert([{
          cliente_id: cliente.id,
          cliente_nome: cliente.nome,
          cliente_telefone: cliente.telefone,
          valor_total: valorTotal,
          status: "lavando",
          itens: itens as unknown as Record<string, unknown>[],
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido criado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao criar pedido");
    },
  });

  const updatePedidoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusPedido }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar status");
    },
  });

  const deletePedido = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("pedidos")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir pedido");
    },
  });

  return {
    pedidos,
    isLoading,
    addPedido,
    updatePedidoStatus,
    deletePedido,
  };
};
