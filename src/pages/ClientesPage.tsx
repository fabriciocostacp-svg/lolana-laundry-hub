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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useClientes, ClienteDB } from "@/hooks/useClientes";
import { Plus, Pencil, Trash2, Users, Loader2, Building2, User, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

export const ClientesPage = () => {
  const { clientes, isLoading, addCliente, updateCliente, deleteCliente } = useClientes();
  const [isOpen, setIsOpen] = useState(false);
  const [editingCliente, setEditingCliente] = useState<ClienteDB | null>(null);
  const [tipoCliente, setTipoCliente] = useState<"pessoa" | "empresa">("pessoa");
  const [formData, setFormData] = useState({
    nome: "",
    telefone: "",
    endereco: "",
    cpf: "",
    cnpj: "",
  });

  // Duplicate warning state
  const [duplicateWarning, setDuplicateWarning] = useState<ClienteDB | null>(null);
  const [showDuplicateDialog, setShowDuplicateDialog] = useState(false);

  const resetForm = () => {
    setFormData({ nome: "", telefone: "", endereco: "", cpf: "", cnpj: "" });
    setEditingCliente(null);
    setTipoCliente("pessoa");
    setDuplicateWarning(null);
  };

  const checkDuplicate = () => {
    if (editingCliente) return null;
    
    const duplicate = clientes.find(
      (c) =>
        c.nome.toLowerCase().trim() === formData.nome.toLowerCase().trim() &&
        c.endereco.toLowerCase().trim() === formData.endereco.toLowerCase().trim()
    );
    return duplicate || null;
  };

  const handleSubmit = () => {
    if (!formData.nome.trim() || !formData.telefone.trim() || !formData.endereco.trim()) {
      toast.error("Nome, telefone e endereço são obrigatórios!");
      return;
    }

    // Check for duplicate
    const duplicate = checkDuplicate();
    if (duplicate && !duplicateWarning) {
      setDuplicateWarning(duplicate);
      setShowDuplicateDialog(true);
      return;
    }

    const clienteData = {
      nome: formData.nome,
      telefone: formData.telefone,
      endereco: formData.endereco,
      cpf: tipoCliente === "pessoa" ? formData.cpf : "",
      cnpj: tipoCliente === "empresa" ? formData.cnpj : "",
    };

    if (editingCliente) {
      updateCliente.mutate({ id: editingCliente.id, ...clienteData });
    } else {
      addCliente.mutate(clienteData);
    }

    resetForm();
    setIsOpen(false);
  };

  const handleConfirmDuplicate = () => {
    setShowDuplicateDialog(false);
    
    const clienteData = {
      nome: formData.nome,
      telefone: formData.telefone,
      endereco: formData.endereco,
      cpf: tipoCliente === "pessoa" ? formData.cpf : "",
      cnpj: tipoCliente === "empresa" ? formData.cnpj : "",
    };

    addCliente.mutate(clienteData);
    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (cliente: ClienteDB) => {
    setEditingCliente(cliente);
    setFormData({
      nome: cliente.nome,
      telefone: cliente.telefone,
      endereco: cliente.endereco,
      cpf: cliente.cpf || "",
      cnpj: cliente.cnpj || "",
    });
    setTipoCliente(cliente.cnpj ? "empresa" : "pessoa");
    setIsOpen(true);
  };

  const handleDelete = (id: string) => {
    deleteCliente.mutate(id);
  };

  const formatCpfCnpj = (cpf?: string, cnpj?: string) => {
    if (cnpj) return `CNPJ: ${cnpj}`;
    if (cpf) return `CPF: ${cpf}`;
    return null;
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
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <Users className="h-5 w-5 md:h-6 md:w-6" />
            <CardTitle className="text-white text-lg md:text-xl">Cadastro de Clientes</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-white text-[hsl(210,100%,50%)] hover:bg-white/90 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg">
              <DialogHeader>
                <DialogTitle className="text-[hsl(215,70%,25%)]">
                  {editingCliente ? "Editar Cliente" : "Cadastrar Cliente"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {/* Tipo de Cliente */}
                <div className="space-y-2">
                  <Label>Tipo de Cliente</Label>
                  <Select value={tipoCliente} onValueChange={(v: "pessoa" | "empresa") => setTipoCliente(v)}>
                    <SelectTrigger className="rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="pessoa">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Pessoa Física
                        </div>
                      </SelectItem>
                      <SelectItem value="empresa">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4" />
                          Empresa
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="nome">Nome {tipoCliente === "empresa" ? "da Empresa" : ""} *</Label>
                  <Input
                    id="nome"
                    placeholder={tipoCliente === "empresa" ? "Nome da empresa" : "Digite o nome completo"}
                    value={formData.nome}
                    onChange={(e) =>
                      setFormData({ ...formData, nome: e.target.value })
                    }
                    className="rounded-xl"
                  />
                </div>

                {/* CPF ou CNPJ */}
                {tipoCliente === "pessoa" ? (
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF (opcional)</Label>
                    <Input
                      id="cpf"
                      placeholder="000.000.000-00"
                      value={formData.cpf}
                      onChange={(e) =>
                        setFormData({ ...formData, cpf: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Label htmlFor="cnpj">CNPJ (opcional)</Label>
                    <Input
                      id="cnpj"
                      placeholder="00.000.000/0000-00"
                      value={formData.cnpj}
                      onChange={(e) =>
                        setFormData({ ...formData, cnpj: e.target.value })
                      }
                      className="rounded-xl"
                    />
                  </div>
                )}

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
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl w-full sm:w-auto">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleSubmit} 
                  className="rounded-xl bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] w-full sm:w-auto"
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
            <div className="p-8 md:p-12 text-center text-muted-foreground">
              <Users className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-30" />
              <p className="text-base md:text-lg">Nenhum cliente cadastrado</p>
              <p className="text-sm">Clique em "Novo Cliente" para começar</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y">
                {clientes.map((cliente) => (
                  <div key={cliente.id} className="p-4 space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-[hsl(210,100%,50%)] text-sm">#{cliente.numero}</span>
                          {cliente.cnpj && <Building2 className="h-3 w-3 text-muted-foreground" />}
                        </div>
                        <p className="font-medium text-foreground">{cliente.nome}</p>
                        {formatCpfCnpj(cliente.cpf, cliente.cnpj) && (
                          <p className="text-xs text-muted-foreground">{formatCpfCnpj(cliente.cpf, cliente.cnpj)}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(cliente)}
                          className="hover:bg-[hsl(210,100%,90%)] hover:text-[hsl(210,100%,50%)] rounded-xl h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="hover:bg-destructive/20 hover:text-destructive rounded-xl h-8 w-8"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o cliente "{cliente.nome}"?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
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
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>{cliente.telefone}</p>
                      <p>{cliente.endereco}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(210,100%,97%)]">
                      <TableHead className="w-24 font-bold text-[hsl(215,70%,25%)]">ID</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Nome</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">CPF/CNPJ</TableHead>
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
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {cliente.cnpj && <Building2 className="h-4 w-4 text-muted-foreground" />}
                            {cliente.nome}
                          </div>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {formatCpfCnpj(cliente.cpf, cliente.cnpj) || "-"}
                        </TableCell>
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Duplicate Client Warning Dialog */}
      <AlertDialog open={showDuplicateDialog} onOpenChange={setShowDuplicateDialog}>
        <AlertDialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Cliente Já Existe
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3">
              <p>Já existe um cliente cadastrado com o mesmo nome e endereço:</p>
              {duplicateWarning && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-sm">
                  <p><strong>Nome:</strong> {duplicateWarning.nome}</p>
                  <p><strong>Endereço:</strong> {duplicateWarning.endereco}</p>
                  <p><strong>Telefone:</strong> {duplicateWarning.telefone}</p>
                </div>
              )}
              <p className="font-medium">Deseja criar outro cliente mesmo assim?</p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDuplicate}
              className="bg-amber-500 hover:bg-amber-600 rounded-xl"
            >
              Criar Mesmo Assim
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
};
