import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetData, apiCreateData, apiUpdateData, apiDeleteData, ApiError } from "@/lib/api";
import { clienteSchema } from "@/lib/validation";
import { toast } from "sonner";

export interface ClienteDB {
  id: string;
  numero: string;
  nome: string;
  telefone: string;
  endereco: string;
  cpf?: string;
  cnpj?: string;
  created_at: string;
  updated_at: string;
}

export const useClientes = () => {
  const queryClient = useQueryClient();
  const { sessionToken } = useAuth();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }
      
      const response = await apiGetData<ClienteDB[]>('clientes', sessionToken);
      return response.data;
    },
    enabled: !!sessionToken,
  });

  const addCliente = useMutation({
    mutationFn: async (cliente: { nome: string; telefone: string; endereco: string; cpf?: string; cnpj?: string }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      // Validate input
      const result = clienteSchema.safeParse(cliente);
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      const response = await apiCreateData<ClienteDB>('clientes', sessionToken, {
        ...result.data,
        numero: "",
      });
      
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao cadastrar cliente");
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...cliente }: { id: string; nome: string; telefone: string; endereco: string; cpf?: string; cnpj?: string }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      // Validate input
      const result = clienteSchema.safeParse(cliente);
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      await apiUpdateData('clientes', sessionToken, id, result.data as Record<string, unknown>);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao atualizar cliente");
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      await apiDeleteData('clientes', sessionToken, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao excluir cliente");
    },
  });

  return {
    clientes,
    isLoading,
    addCliente,
    updateCliente,
    deleteCliente,
  };
};
