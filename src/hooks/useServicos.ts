import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { apiGetData, apiCreateData, apiUpdateData, apiDeleteData, ApiError } from "@/lib/api";
import { toast } from "sonner";

export interface ServicoDB {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export const useServicos = () => {
  const queryClient = useQueryClient();
  const { sessionToken } = useAuth();

  const { data: servicos = [], isLoading } = useQuery({
    queryKey: ["servicos"],
    queryFn: async () => {
      if (!sessionToken) throw new Error("Não autenticado");
      const response = await apiGetData<ServicoDB[]>("servicos", sessionToken);
      return (response.data || []).map((s) => ({
        ...s,
        preco: Number(s.preco),
      }));
    },
    enabled: !!sessionToken,
  });

  const addServico = useMutation({
    mutationFn: async (data: { nome: string; categoria: string; preco: number }) => {
      if (!sessionToken) throw new Error("Não autenticado");
      return (await apiCreateData<ServicoDB>("servicos", sessionToken, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço adicionado!");
    },
    onError: (e: Error | ApiError) => toast.error(e.message || "Erro ao adicionar"),
  });

  const updateServico = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; nome?: string; categoria?: string; preco?: number; ativo?: boolean }) => {
      if (!sessionToken) throw new Error("Não autenticado");
      return (await apiUpdateData<ServicoDB>("servicos", sessionToken, id, data)).data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço atualizado!");
    },
    onError: (e: Error | ApiError) => toast.error(e.message || "Erro ao atualizar"),
  });

  const deleteServico = useMutation({
    mutationFn: async (id: string) => {
      if (!sessionToken) throw new Error("Não autenticado");
      await apiDeleteData("servicos", sessionToken, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["servicos"] });
      toast.success("Serviço excluído!");
    },
    onError: (e: Error | ApiError) => toast.error(e.message || "Erro ao excluir"),
  });

  return { servicos, isLoading, addServico, updateServico, deleteServico };
};
