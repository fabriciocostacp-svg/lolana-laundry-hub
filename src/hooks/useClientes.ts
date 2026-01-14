import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface ClienteDB {
  id: string;
  numero: string;
  nome: string;
  telefone: string;
  endereco: string;
  created_at: string;
  updated_at: string;
}

export const useClientes = () => {
  const queryClient = useQueryClient();

  const { data: clientes = [], isLoading } = useQuery({
    queryKey: ["clientes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clientes")
        .select("*")
        .order("numero", { ascending: true });

      if (error) {
        toast.error("Erro ao carregar clientes");
        throw error;
      }
      return data as ClienteDB[];
    },
  });

  const addCliente = useMutation({
    mutationFn: async (cliente: { nome: string; telefone: string; endereco: string }) => {
      const { data, error } = await supabase
        .from("clientes")
        .insert([{ ...cliente, numero: "" }])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente cadastrado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao cadastrar cliente");
    },
  });

  const updateCliente = useMutation({
    mutationFn: async ({ id, ...cliente }: { id: string; nome: string; telefone: string; endereco: string }) => {
      const { error } = await supabase
        .from("clientes")
        .update(cliente)
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente atualizado com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao atualizar cliente");
    },
  });

  const deleteCliente = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("clientes")
        .delete()
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["clientes"] });
      toast.success("Cliente excluído com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao excluir cliente");
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
