import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useClientes, ClienteDB } from "@/hooks/useClientes";
import { Plus, Pencil, Trash2, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";

export const ClientesPage = () => {
  const { clientes, isLoading, addCliente, updateCliente, deleteCliente } = useClientes();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteDB | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
  });

  const resetForm = () => {
    setFormData({ nome: "", telefone: "", endereco: "" });
    setEditingCliente(null);
  };

  const handleSubmit = () => {
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.endereco.trim()) {
      toast.error("Todos os campos são obrigatórios!");
      return;
    }

    if (editingCliente) {
      updateCliente.mutate({ id: editingCliente.id, ...formData });
    } else {
      addCliente.mutate(formData);
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (cliente: ClienteDB) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCliente.mutate(id);
  };

  if (isLoading) {
    return (
      <MainLayout title="Clientes">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Clientes">
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6" />
            <CardTitle className="text-white">Cadastro de Clientes</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-white text-[hsl(210,100%,50%)] hover:bg-white/90">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl">
              <DialogHeader>
                <DialogTitle className="text-[hsl(215,70%,25%)]">
                  {editingCliente ? "Editar Cliente" : "Cadastrar Cliente"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome *</Label>
                  <Input
                    id="nome"
                    placeholder="Digite o nome completo"
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone *</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) =>
                      setFormData({ ...formData, telefone: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço Completo *</Label>
                  <Input
                    id="endereco"
                    placeholder="Rua, Número, Bairro"
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleSubmit} 
                  className="rounded-xl bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)]"
                  disabled={addCliente.isPending || updateCliente.isPending}
                >
                  {editingCliente ? "Salvar Alterações" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <Users className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nenhum cliente cadastrado</p>
              <p className="text-sm">Clique em "Novo Cliente" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-[hsl(210,100%,97%)]">
                  <TableHead className="w-24 font-bold text-[hsl(215,70%,25%)]">ID</TableHead>
                  <TableHead className="font-bold text-[hsl(215,70%,25%)]">Nome</TableHead>
                  <TableHead className="font-bold text-[hsl(215,70%,25%)]">Telefone</TableHead>
                  <TableHead className="font-bold text-[hsl(215,70%,25%)]">Endereço</TableHead>
                  <TableHead className="w-32 text-center font-bold text-[hsl(215,70%,25%)]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-[hsl(210,100%,98%)]">
                    <TableCell className="font-mono font-bold text-[hsl(210,100%,50%)]">
                      #{cliente.numero}
                    </TableCell>
                    <TableCell className="font-medium">{cliente.nome}</TableCell>
                    <TableCell>{cliente.telefone}</TableCell>
                    <TableCell>{cliente.endereco}</TableCell>
                    <TableCell>
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          className="hover:bg-[hsl(210,100%,90%)] hover:text-[hsl(210,100%,50%)] rounded-xl"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/20 hover:text-destructive rounded-xl"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente "{cliente.nome}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(cliente.id)}
                                className="bg-destructive hover:bg-destructive/90 rounded-xl"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};
