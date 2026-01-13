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
import { useStore } from "@/store/useStore";
import { Cliente } from "@/types";
import { Plus, Pencil, Trash2, Users } from "lucide-react";
import { toast } from "sonner";

export const ClientesPage = () => {
  const { clientes, addCliente, updateCliente, deleteCliente } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<Cliente | null>(null);
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
      updateCliente(editingCliente.id, formData);
      toast.success("Cliente atualizado com sucesso!");
    } else {
      addCliente(formData);
      toast.success("Cliente cadastrado com sucesso!");
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (cliente: Cliente) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
    });
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCliente(id);
    toast.success("Cliente excluído com sucesso!");
  };

  return (
    <MainLayout title="Clientes">
      <Card className="shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <CardTitle>Cadastro de Clientes</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
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
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endereco">Endereço *</Label>
                  <Input
                    id="endereco"
                    placeholder="Digite o endereço completo"
                    value={formData.endereco}
                    onChange={(e) =>
                      setFormData({ ...formData, endereco: e.target.value })
                    }
                  />
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSubmit}>
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
                <TableRow className="bg-muted/30">
                  <TableHead className="w-20">ID</TableHead>
                  <TableHead>Nome</TableHead>
                  <TableHead>Telefone</TableHead>
                  <TableHead>Endereço</TableHead>
                  <TableHead className="w-32 text-center">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientes.map((cliente) => (
                  <TableRow key={cliente.id} className="hover:bg-muted/20">
                    <TableCell className="font-mono font-semibold text-primary">
                      #{cliente.id}
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
                          className="hover:bg-accent/20 hover:text-accent"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/20 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente "{cliente.nome}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => handleDelete(cliente.id)}
                                className="bg-destructive hover:bg-destructive/90"
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
