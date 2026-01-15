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
  cliente_cpf?: string;
  cliente_cnpj?: string;
  valor_total: number;
  status: StatusPedido;
  itens: ItemPedido[];
  pago: boolean;
  retirado: boolean;
  desconto_percentual: number;
  desconto_valor: number;
  taxa_entrega: number;
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
        status: p.status as StatusPedido,
        pago: p.pago ?? false,
        retirado: p.retirado ?? false,
        desconto_percentual: Number(p.desconto_percentual) || 0,
        desconto_valor: Number(p.desconto_valor) || 0,
        taxa_entrega: Number(p.taxa_entrega) || 0,
        cliente_cpf: p.cliente_cpf || undefined,
        cliente_cnpj: p.cliente_cnpj || undefined
      })) as PedidoDB[];
    },
  });

  const addPedido = useMutation({
    mutationFn: async ({ 
      cliente, 
      itens, 
      descontoPercentual = 0, 
      descontoValor = 0, 
      taxaEntrega = 0 
    }: { 
      cliente: ClienteDB; 
      itens: ItemPedido[]; 
      descontoPercentual?: number;
      descontoValor?: number;
      taxaEntrega?: number;
    }) => {
      const subtotal = itens.reduce(
        (acc, item) => acc + item.servico.preco * item.quantidade,
        0
      );
      
      const valorDescontoPercentual = (subtotal * descontoPercentual) / 100;
      const descontoTotal = valorDescontoPercentual + descontoValor;
      const valorTotal = subtotal - descontoTotal + taxaEntrega;

      const { data, error } = await supabase
        .from("pedidos")
        .insert([{
          numero: "",
          cliente_id: cliente.id,
          cliente_nome: cliente.nome,
          cliente_telefone: cliente.telefone,
          cliente_cpf: cliente.cpf || null,
          cliente_cnpj: cliente.cnpj || null,
          valor_total: Math.max(0, valorTotal),
          status: "lavando",
          itens: JSON.parse(JSON.stringify(itens)),
          pago: false,
          retirado: false,
          desconto_percentual: descontoPercentual,
          desconto_valor: descontoValor,
          taxa_entrega: taxaEntrega
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

  const updatePedidoPagamento = useMutation({
    mutationFn: async ({ id, pago, retirado }: { id: string; pago: boolean; retirado: boolean }) => {
      const { error } = await supabase
        .from("pedidos")
        .update({ pago, retirado })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: () => {
      toast.error("Erro ao atualizar pagamento");
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
    updatePedidoPagamento,
    deletePedido,
  };
};
