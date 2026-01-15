import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { 
  apiGetFuncionarios, 
  apiCreateFuncionario, 
  apiUpdateFuncionario, 
  apiDeleteFuncionario,
  ApiError 
} from "@/lib/api";
import { funcionarioSchema } from "@/lib/validation";
import { toast } from "sonner";

export interface FuncionarioDB {
  id: string;
  nome: string;
  usuario: string;
  telefone: string | null;
  pode_dar_desconto: boolean;
  pode_cobrar_taxa: boolean;
  pode_pagar_depois: boolean;
  is_admin: boolean;
  ativo: boolean;
  created_at: string;
  updated_at: string;
}

export interface FuncionarioPermissions {
  pode_dar_desconto: boolean;
  pode_cobrar_taxa: boolean;
  pode_pagar_depois: boolean;
  is_admin: boolean;
}

export const useFuncionarios = () => {
  const queryClient = useQueryClient();
  const { sessionToken, currentUser } = useAuth();

  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      const response = await apiGetFuncionarios<FuncionarioDB[]>(sessionToken);
      return response.data;
    },
    enabled: !!sessionToken && !!currentUser?.permissions.is_admin,
  });

  const addFuncionario = useMutation({
    mutationFn: async (funcionario: {
      nome: string;
      usuario: string;
      senha: string;
      telefone?: string;
      pode_dar_desconto: boolean;
      pode_cobrar_taxa: boolean;
      pode_pagar_depois: boolean;
      is_admin: boolean;
    }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      // Validate input
      const result = funcionarioSchema.safeParse(funcionario);
      if (!result.success) {
        throw new Error(result.error.errors[0].message);
      }

      const response = await apiCreateFuncionario<FuncionarioDB>(sessionToken, funcionario);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário cadastrado com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      if (error.message.includes("já existe")) {
        toast.error("Já existe um funcionário com este usuário!");
      } else {
        toast.error(error.message || "Erro ao cadastrar funcionário");
      }
    },
  });

  const updateFuncionario = useMutation({
    mutationFn: async ({ id, senha, ...funcionario }: { 
      id: string; 
      nome: string;
      usuario: string;
      senha?: string;
      telefone?: string;
      pode_dar_desconto: boolean;
      pode_cobrar_taxa: boolean;
      pode_pagar_depois: boolean;
      is_admin: boolean;
    }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      const dataToUpdate = senha ? { ...funcionario, senha } : funcionario;
      const response = await apiUpdateFuncionario<FuncionarioDB>(sessionToken, id, dataToUpdate);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário atualizado com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      if (error.message.includes("já existe")) {
        toast.error("Já existe um funcionário com este usuário!");
      } else {
        toast.error(error.message || "Erro ao atualizar funcionário");
      }
    },
  });

  const updateSenha = useMutation({
    mutationFn: async ({ id, senha }: { id: string; senha: string }) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      if (senha.length < 4) {
        throw new Error("Senha deve ter pelo menos 4 caracteres");
      }

      // For password update, we need to get the current funcionario data
      const func = funcionarios.find(f => f.id === id);
      if (!func) {
        throw new Error("Funcionário não encontrado");
      }

      await apiUpdateFuncionario(sessionToken, id, {
        nome: func.nome,
        usuario: func.usuario,
        telefone: func.telefone,
        pode_dar_desconto: func.pode_dar_desconto,
        pode_cobrar_taxa: func.pode_cobrar_taxa,
        pode_pagar_depois: func.pode_pagar_depois,
        is_admin: func.is_admin,
        senha,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Senha atualizada com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao atualizar senha");
    },
  });

  const deleteFuncionario = useMutation({
    mutationFn: async (id: string) => {
      if (!sessionToken) {
        throw new Error("Não autenticado");
      }

      await apiDeleteFuncionario(sessionToken, id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário excluído com sucesso!");
    },
    onError: (error: Error | ApiError) => {
      toast.error(error.message || "Erro ao excluir funcionário");
    },
  });

  return {
    funcionarios,
    isLoading,
    addFuncionario,
    updateFuncionario,
    updateSenha,
    deleteFuncionario,
  };
};
