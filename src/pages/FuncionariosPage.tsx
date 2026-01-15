import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
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
import { useFuncionarios, FuncionarioDB } from "@/hooks/useFuncionarios";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, Pencil, Trash2, UserCog, Loader2, Key, Shield, ShieldCheck, ShieldX } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const FuncionariosPage = () => {
  const { funcionarios, isLoading, addFuncionario, updateFuncionario, updateSenha, deleteFuncionario } = useFuncionarios();
  const { currentUser } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [editingFuncionario, setEditingFuncionario] = useState<FuncionarioDB | null>(null);
  const [passwordFuncionario, setPasswordFuncionario] = useState<FuncionarioDB | null>(null);
  const [formData, setFormData] = useState({
    nome: "",
    usuario: "",
    senha: "",
    telefone: "",
    pode_dar_desconto: false,
    pode_cobrar_taxa: false,
    pode_pagar_depois: false,
    is_admin: false,
  });
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const resetForm = () => {
    setFormData({
      nome: "",
      usuario: "",
      senha: "",
      telefone: "",
      pode_dar_desconto: false,
      pode_cobrar_taxa: false,
      pode_pagar_depois: false,
      is_admin: false,
    });
    setEditingFuncionario(null);
  };

  const handleSubmit = () => {
    if (!formData.nome.trim() || !formData.usuario.trim()) {
      toast.error("Nome e usuário são obrigatórios!");
      return;
    }

    if (!editingFuncionario && !formData.senha.trim()) {
      toast.error("Senha é obrigatória para novos funcionários!");
      return;
    }

    if (editingFuncionario) {
      updateFuncionario.mutate({
        id: editingFuncionario.id,
        nome: formData.nome,
        usuario: formData.usuario,
        telefone: formData.telefone,
        pode_dar_desconto: formData.pode_dar_desconto,
        pode_cobrar_taxa: formData.pode_cobrar_taxa,
        pode_pagar_depois: formData.pode_pagar_depois,
        is_admin: formData.is_admin,
      });
    } else {
      addFuncionario.mutate({
        nome: formData.nome,
        usuario: formData.usuario,
        senha: formData.senha,
        telefone: formData.telefone,
        pode_dar_desconto: formData.pode_dar_desconto,
        pode_cobrar_taxa: formData.pode_cobrar_taxa,
        pode_pagar_depois: formData.pode_pagar_depois,
        is_admin: formData.is_admin,
      });
    }

    resetForm();
    setIsOpen(false);
  };

  const handleEdit = (funcionario: FuncionarioDB) => {
    setEditingFuncionario(funcionario);
    setFormData({
      nome: funcionario.nome,
      usuario: funcionario.usuario,
      senha: "",
      telefone: funcionario.telefone || "",
      pode_dar_desconto: funcionario.pode_dar_desconto,
      pode_cobrar_taxa: funcionario.pode_cobrar_taxa,
      pode_pagar_depois: funcionario.pode_pagar_depois,
      is_admin: funcionario.is_admin,
    });
    setIsOpen(true);
  };

  const handlePasswordChange = () => {
    if (!newPassword.trim()) {
      toast.error("Digite a nova senha!");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("As senhas não conferem!");
      return;
    }
    if (passwordFuncionario) {
      updateSenha.mutate({ id: passwordFuncionario.id, senha: newPassword });
      setIsPasswordOpen(false);
      setNewPassword("");
      setConfirmPassword("");
      setPasswordFuncionario(null);
    }
  };

  const handleDelete = (id: string) => {
    deleteFuncionario.mutate(id);
  };

  const openPasswordDialog = (funcionario: FuncionarioDB) => {
    setPasswordFuncionario(funcionario);
    setNewPassword("");
    setConfirmPassword("");
    setIsPasswordOpen(true);
  };

  // Only admins can access this page
  if (!currentUser?.permissions.is_admin) {
    return (
      <MainLayout title="Funcionários">
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="p-12 text-center">
            <ShieldX className="h-16 w-16 mx-auto mb-4 text-destructive opacity-50" />
            <p className="text-lg text-muted-foreground">Acesso restrito a administradores</p>
          </CardContent>
        </Card>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout title="Funcionários">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Funcionários">
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <UserCog className="h-5 w-5 md:h-6 md:w-6" />
            <CardTitle className="text-white text-lg md:text-xl">Gestão de Funcionários</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2 bg-white text-[hsl(210,100%,50%)] hover:bg-white/90 w-full sm:w-auto">
                <Plus className="h-4 w-4" />
                Novo Funcionário
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] sm:max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-[hsl(215,70%,25%)]">
                  {editingFuncionario ? "Editar Funcionário" : "Cadastrar Funcionário"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="nome">Nome Completo *</Label>
                  <Input
                    id="nome"
                    placeholder="Nome do funcionário"
                    value={formData.nome}
                    onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="usuario">Usuário *</Label>
                  <Input
                    id="usuario"
                    placeholder="Nome de usuário para login"
                    value={formData.usuario}
                    onChange={(e) => setFormData({ ...formData, usuario: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                {!editingFuncionario && (
                  <div className="space-y-2">
                    <Label htmlFor="senha">Senha *</Label>
                    <Input
                      id="senha"
                      type="password"
                      placeholder="Senha de acesso"
                      value={formData.senha}
                      onChange={(e) => setFormData({ ...formData, senha: e.target.value })}
                      className="rounded-xl"
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="telefone">Telefone</Label>
                  <Input
                    id="telefone"
                    placeholder="(00) 00000-0000"
                    value={formData.telefone}
                    onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <Label className="text-base font-semibold flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Permissões
                  </Label>
                  
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                      <Checkbox
                        id="pode_dar_desconto"
                        checked={formData.pode_dar_desconto}
                        onCheckedChange={(checked) => setFormData({ ...formData, pode_dar_desconto: !!checked })}
                      />
                      <Label htmlFor="pode_dar_desconto" className="cursor-pointer flex-1">
                        Pode dar descontos
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                      <Checkbox
                        id="pode_cobrar_taxa"
                        checked={formData.pode_cobrar_taxa}
                        onCheckedChange={(checked) => setFormData({ ...formData, pode_cobrar_taxa: !!checked })}
                      />
                      <Label htmlFor="pode_cobrar_taxa" className="cursor-pointer flex-1">
                        Pode cobrar taxa de entrega
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-muted/50 rounded-xl">
                      <Checkbox
                        id="pode_pagar_depois"
                        checked={formData.pode_pagar_depois}
                        onCheckedChange={(checked) => setFormData({ ...formData, pode_pagar_depois: !!checked })}
                      />
                      <Label htmlFor="pode_pagar_depois" className="cursor-pointer flex-1">
                        Pode permitir pagar depois
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-amber-100 rounded-xl border border-amber-300">
                      <Checkbox
                        id="is_admin"
                        checked={formData.is_admin}
                        onCheckedChange={(checked) => setFormData({ ...formData, is_admin: !!checked })}
                      />
                      <Label htmlFor="is_admin" className="cursor-pointer flex-1 flex items-center gap-2">
                        <ShieldCheck className="h-4 w-4 text-amber-600" />
                        Administrador (acesso total)
                      </Label>
                    </div>
                  </div>
                </div>
              </div>
              <DialogFooter className="flex-col sm:flex-row gap-2">
                <DialogClose asChild>
                  <Button variant="outline" className="rounded-xl w-full sm:w-auto">Cancelar</Button>
                </DialogClose>
                <Button 
                  onClick={handleSubmit} 
                  className="rounded-xl bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] w-full sm:w-auto"
                  disabled={addFuncionario.isPending || updateFuncionario.isPending}
                >
                  {editingFuncionario ? "Salvar Alterações" : "Cadastrar"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {funcionarios.length === 0 ? (
            <div className="p-8 md:p-12 text-center text-muted-foreground">
              <UserCog className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-30" />
              <p className="text-base md:text-lg">Nenhum funcionário cadastrado</p>
              <p className="text-sm">Clique em "Novo Funcionário" para começar</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block md:hidden divide-y">
                {funcionarios.map((funcionario) => (
                  <div key={funcionario.id} className="p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-foreground">{funcionario.nome}</p>
                        <p className="text-sm text-muted-foreground">@{funcionario.usuario}</p>
                        {funcionario.telefone && (
                          <p className="text-xs text-muted-foreground">{funcionario.telefone}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openPasswordDialog(funcionario)}
                          className="hover:bg-amber-100 hover:text-amber-600 rounded-xl h-8 w-8"
                        >
                          <Key className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(funcionario)}
                          className="hover:bg-[hsl(210,100%,90%)] hover:text-[hsl(210,100%,50%)] rounded-xl h-8 w-8"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        {funcionario.id !== currentUser?.id && (
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
                                  Tem certeza que deseja excluir o funcionário "{funcionario.nome}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                                <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(funcionario.id)}
                                  className="bg-destructive hover:bg-destructive/90 rounded-xl"
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {funcionario.is_admin && (
                        <Badge className="bg-amber-500 text-white text-xs">Admin</Badge>
                      )}
                      {funcionario.pode_dar_desconto && (
                        <Badge variant="outline" className="text-xs">Desconto</Badge>
                      )}
                      {funcionario.pode_cobrar_taxa && (
                        <Badge variant="outline" className="text-xs">Taxa</Badge>
                      )}
                      {funcionario.pode_pagar_depois && (
                        <Badge variant="outline" className="text-xs">Pagar Depois</Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(210,100%,97%)]">
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Nome</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Usuário</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Telefone</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Permissões</TableHead>
                      <TableHead className="w-40 text-center font-bold text-[hsl(215,70%,25%)]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {funcionarios.map((funcionario) => (
                      <TableRow key={funcionario.id} className="hover:bg-[hsl(210,100%,98%)]">
                        <TableCell className="font-medium">{funcionario.nome}</TableCell>
                        <TableCell className="text-muted-foreground">@{funcionario.usuario}</TableCell>
                        <TableCell>{funcionario.telefone || "-"}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {funcionario.is_admin && (
                              <Badge className="bg-amber-500 text-white text-xs">Admin</Badge>
                            )}
                            {funcionario.pode_dar_desconto && (
                              <Badge variant="outline" className="text-xs">Desconto</Badge>
                            )}
                            {funcionario.pode_cobrar_taxa && (
                              <Badge variant="outline" className="text-xs">Taxa</Badge>
                            )}
                            {funcionario.pode_pagar_depois && (
                              <Badge variant="outline" className="text-xs">Pagar Depois</Badge>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center justify-center gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openPasswordDialog(funcionario)}
                              className="hover:bg-amber-100 hover:text-amber-600 rounded-xl"
                              title="Trocar senha"
                            >
                              <Key className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(funcionario)}
                              className="hover:bg-[hsl(210,100%,90%)] hover:text-[hsl(210,100%,50%)] rounded-xl"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            {funcionario.id !== currentUser?.id && (
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
                                      Tem certeza que deseja excluir o funcionário "{funcionario.nome}"?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handleDelete(funcionario.id)}
                                      className="bg-destructive hover:bg-destructive/90 rounded-xl"
                                    >
                                      Excluir
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
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

      {/* Password Change Dialog */}
      <Dialog open={isPasswordOpen} onOpenChange={setIsPasswordOpen}>
        <DialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)] sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-[hsl(215,70%,25%)] flex items-center gap-2">
              <Key className="h-5 w-5" />
              Trocar Senha
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-muted-foreground">
              Alterando senha de: <strong>{passwordFuncionario?.nome}</strong>
            </p>
            <div className="space-y-2">
              <Label htmlFor="newPassword">Nova Senha</Label>
              <Input
                id="newPassword"
                type="password"
                placeholder="Digite a nova senha"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirme a nova senha"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="rounded-xl"
              />
            </div>
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <DialogClose asChild>
              <Button variant="outline" className="rounded-xl w-full sm:w-auto">Cancelar</Button>
            </DialogClose>
            <Button 
              onClick={handlePasswordChange} 
              className="rounded-xl bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] w-full sm:w-auto"
              disabled={updateSenha.isPending}
            >
              Salvar Nova Senha
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
};
