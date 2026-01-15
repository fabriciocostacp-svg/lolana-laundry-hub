import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetData, apiCreateData, apiUpdateData, apiDeleteData, ApiError } from "@/lib/api";
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
  const { sessionToken } = useAuth();

  const { data: pedidos = [], isLoading } = useQuery({
    queryKey: ["pedidos"],
    queryFn: async () => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      const response = await apiGetData<PedidoDB[]>('pedidos', sessionToken);
      
      return (response.data || []).map(p => ({
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
    enabled: !!sessionToken,
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
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      const subtotal = itens.reduce(
        (acc, item) => acc + item.servico.preco * item.quantidade,
        0
      );
      
      const valorDescontoPercentual = (subtotal * descontoPercentual) / 100;
      const descontoTotal = valorDescontoPercentual + descontoValor;
      const valorTotal = subtotal - descontoTotal + taxaEntrega;

      const response = await apiCreateData<PedidoDB>('pedidos', sessionToken, {
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
      });

      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido criado com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao criar pedido");
    },
  });

  const updatePedidoStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: StatusPedido }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      await apiUpdateData('pedidos', sessionToken, id, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao atualizar status");
    },
  });

  const updatePedidoPagamento = useMutation({
    mutationFn: async ({ id, pago, retirado }: { id: string; pago: boolean; retirado: boolean }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      await apiUpdateData('pedidos', sessionToken, id, { pago, retirado });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao atualizar pagamento");
    },
  });

  const deletePedido = useMutation({
    mutationFn: async (id: string) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      await apiDeleteData('pedidos', sessionToken, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pedidos"] });
      toast.success("Pedido excluído com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao excluir pedido");
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
