import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface FuncionarioDB {
  id: string;
  nome: string;
  usuario: string;
  senha: string;
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

  const { data: funcionarios = [], isLoading } = useQuery({
    queryKey: ["funcionarios"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .order("created_at", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar funcionários");
        throw error;
      }
      return data as FuncionarioDB[];
    },
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
      const { data, error } = await supabase
        .from("funcionarios")
        .insert([funcionario])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário cadastrado com sucesso!");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Já existe um funcionário com este usuário!");
      } else {
        toast.error("Erro ao cadastrar funcionário");
      }
    },
  });

  const updateFuncionario = useMutation({
    mutationFn: async ({ id, ...funcionario }: { 
      id: string; 
      nome?: string;
      usuario?: string;
      telefone?: string;
      pode_dar_desconto?: boolean;
      pode_cobrar_taxa?: boolean;
      pode_pagar_depois?: boolean;
      is_admin?: boolean;
      ativo?: boolean;
    }) => {
      const { error } = await supabase
        .from("funcionarios")
        .update(funcionario)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário atualizado com sucesso!");
    },
    onError: (error: any) => {
      if (error.code === "23505") {
        toast.error("Já existe um funcionário com este usuário!");
      } else {
        toast.error("Erro ao atualizar funcionário");
      }
    },
  });

  const updateSenha = useMutation({
    mutationFn: async ({ id, senha }: { id: string; senha: string }) => {
      const { error } = await supabase
        .from("funcionarios")
        .update({ senha })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Senha atualizada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar senha");
    },
  });

  const deleteFuncionario = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("funcionarios")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funcionarios"] });
      toast.success("Funcionário excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir funcionário");
    },
  });

  const loginFuncionario = async (usuario: string, senha: string): Promise<FuncionarioDB | null> => {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("usuario", usuario)
      .eq("senha", senha)
      .eq("ativo", true)
      .single();

    if (error || !data) {
      return null;
    }
    return data as FuncionarioDB;
  };

  const findByTelefone = async (telefone: string): Promise<FuncionarioDB | null> => {
    const { data, error } = await supabase
      .from("funcionarios")
      .select("*")
      .eq("telefone", telefone)
      .eq("ativo", true)
      .single();

    if (error || !data) {
      return null;
    }
    return data as FuncionarioDB;
  };

  return {
    funcionarios,
    isLoading,
    addFuncionario,
    updateFuncionario,
    updateSenha,
    deleteFuncionario,
    loginFuncionario,
    findByTelefone,
  };
};
