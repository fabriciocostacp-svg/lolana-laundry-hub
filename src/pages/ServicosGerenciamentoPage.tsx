import React, { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useServicos, ServicoDB } from "@/hooks/useServicos";
import { Settings, Plus, Pencil, Trash2, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

export const ServicosGerenciamentoPage = () => {
  const { servicos, isLoading, addServico, updateServico, deleteServico } = useServicos();
  const [searchTerm, setSearchTerm] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingServico, setEditingServico] = useState<ServicoDB | null>(null);
  const [form, setForm] = useState({ nome: "", categoria: "", preco: "" });

  const filteredServicos = useMemo(() => {
    if (!searchTerm.trim()) return servicos;
    const t = searchTerm.toLowerCase();
    return servicos.filter(
      (s) => s.nome.toLowerCase().includes(t) || s.categoria.toLowerCase().includes(t)
    );
  }, [servicos, searchTerm]);

  const categorias = useMemo(() => [...new Set(servicos.map((s) => s.categoria))], [servicos]);

  const openAdd = () => {
    setEditingServico(null);
    setForm({ nome: "", categoria: "", preco: "" });
    setDialogOpen(true);
  };

  const openEdit = (s: ServicoDB) => {
    setEditingServico(s);
    setForm({ nome: s.nome, categoria: s.categoria, preco: String(s.preco) });
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!form.nome.trim() || !form.categoria.trim() || !form.preco) {
      toast.error("Preencha todos os campos!");
      return;
    }
    const preco = parseFloat(form.preco);
    if (isNaN(preco) || preco < 0) {
      toast.error("Preço inválido!");
      return;
    }
    if (editingServico) {
      updateServico.mutate({ id: editingServico.id, nome: form.nome.trim(), categoria: form.categoria.trim(), preco });
    } else {
      addServico.mutate({ nome: form.nome.trim(), categoria: form.categoria.trim(), preco });
    }
    setDialogOpen(false);
  };

  const formatCurrency = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  if (isLoading) {
    return (
      <MainLayout title="Gerenciar Serviços">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Gerenciar Serviços">
      <div className="space-y-4">
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] text-white rounded-t-2xl py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Settings className="h-5 w-5 md:h-6 md:w-6" />
                <CardTitle className="text-white text-lg md:text-xl">Gerenciar Serviços</CardTitle>
              </div>
              <Button onClick={openAdd} className="gap-2 rounded-xl bg-white/20 hover:bg-white/30 text-white">
                <Plus className="h-4 w-4" /> Novo Serviço
              </Button>
            </div>
          </CardHeader>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-4">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar serviço..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Mobile */}
            <div className="block md:hidden divide-y">
              {filteredServicos.map((s) => (
                <div key={s.id} className="p-3 space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium">{s.nome}</p>
                      <Badge variant="outline" className="text-xs mt-1">{s.categoria}</Badge>
                    </div>
                    <p className="font-mono font-semibold">{formatCurrency(s.preco)}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => openEdit(s)} className="rounded-xl gap-1">
                      <Pencil className="h-3 w-3" /> Editar
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button size="sm" variant="destructive" className="rounded-xl gap-1">
                          <Trash2 className="h-3 w-3" /> Excluir
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                          <AlertDialogDescription>Tem certeza que deseja excluir "{s.nome}"?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => deleteServico.mutate(s.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop */}
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(215,70%,25%)]">
                    <TableHead className="text-white font-bold">Serviço</TableHead>
                    <TableHead className="text-white font-bold">Categoria</TableHead>
                    <TableHead className="text-right text-white font-bold">Preço</TableHead>
                    <TableHead className="text-center text-white font-bold w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredServicos.map((s) => (
                    <TableRow key={s.id} className="hover:bg-[hsl(210,100%,98%)]">
                      <TableCell className="font-medium">{s.nome}</TableCell>
                      <TableCell><Badge variant="outline">{s.categoria}</Badge></TableCell>
                      <TableCell className="text-right font-mono font-semibold">{formatCurrency(s.preco)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-2">
                          <Button size="sm" variant="outline" onClick={() => openEdit(s)} className="rounded-xl">
                            <Pencil className="h-3 w-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button size="sm" variant="destructive" className="rounded-xl">
                                <Trash2 className="h-3 w-3" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Excluir serviço?</AlertDialogTitle>
                                <AlertDialogDescription>Tem certeza que deseja excluir "{s.nome}"?</AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => deleteServico.mutate(s.id)}>Excluir</AlertDialogAction>
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

            {filteredServicos.length === 0 && (
              <p className="text-center text-muted-foreground py-8">Nenhum serviço encontrado.</p>
            )}
          </CardContent>
        </Card>

        {/* Dialog Add/Edit */}
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogContent className="rounded-2xl">
            <DialogHeader>
              <DialogTitle>{editingServico ? "Editar Serviço" : "Novo Serviço"}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Nome *</Label>
                <Input
                  value={form.nome}
                  onChange={(e) => setForm((p) => ({ ...p, nome: e.target.value }))}
                  placeholder="Ex: Camisa social"
                  className="rounded-xl"
                />
              </div>
              <div className="space-y-2">
                <Label>Categoria *</Label>
                <Input
                  value={form.categoria}
                  onChange={(e) => setForm((p) => ({ ...p, categoria: e.target.value }))}
                  placeholder="Ex: Camisas"
                  className="rounded-xl"
                  list="categorias-list"
                />
                <datalist id="categorias-list">
                  {categorias.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>
              <div className="space-y-2">
                <Label>Preço (R$) *</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.preco}
                  onChange={(e) => setForm((p) => ({ ...p, preco: e.target.value }))}
                  placeholder="0.00"
                  className="rounded-xl"
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="outline" className="rounded-xl">Cancelar</Button>
              </DialogClose>
              <Button
                onClick={handleSave}
                className="rounded-xl"
                disabled={addServico.isPending || updateServico.isPending}
              >
                {addServico.isPending || updateServico.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {editingServico ? "Salvar" : "Adicionar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
};
