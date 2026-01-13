import { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useStore } from "@/store/useStore";
import { servicosFixos } from "@/data/servicos";
import { StatusPedido, ItemPedido } from "@/types";
import { Plus, ClipboardList, MessageCircle, WashingMachine, Wind, Shirt, Check } from "lucide-react";
import { toast } from "sonner";

const statusConfig: Record<StatusPedido, { label: string; icon: React.ElementType; class: string }> = {
  lavando: { label: "Lavando", icon: WashingMachine, class: "status-lavando" },
  passando: { label: "Passando", icon: Shirt, class: "status-passando" },
  secando: { label: "Secando", icon: Wind, class: "status-secando" },
  pronto: { label: "Pronto", icon: Check, class: "status-pronto" },
};

export const PedidosPage = () => {
  const { clientes, pedidos, addPedido, updatePedidoStatus } = useStore();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    servicosFixos.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {})
  );

  const resetForm = () => {
    setSelectedClienteId("");
    setQuantidades(servicosFixos.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const totalSelecionado = useMemo(() => {
    return servicosFixos.reduce((acc, servico) => {
      return acc + servico.preco * (quantidades[servico.id] || 0);
    }, 0);
  }, [quantidades]);

  const handleCreatePedido = () => {
    const cliente = clientes.find((c) => c.id === selectedClienteId);
    if (!cliente) {
      toast.error("Selecione um cliente!");
      return;
    }

    const itens: ItemPedido[] = servicosFixos
      .filter((s) => quantidades[s.id] > 0)
      .map((s) => ({
        servico: s,
        quantidade: quantidades[s.id],
      }));

    if (itens.length === 0) {
      toast.error("Selecione pelo menos um serviço!");
      return;
    }

    addPedido(cliente, itens);
    toast.success("Pedido criado com sucesso!");
    resetForm();
    setIsOpen(false);
  };

  const handleStatusChange = (pedidoId: string, newStatus: StatusPedido) => {
    const pedido = pedidos.find((p) => p.id === pedidoId);
    updatePedidoStatus(pedidoId, newStatus);
    
    if (newStatus === "pronto" && pedido) {
      const mensagem = `Olá, ${pedido.cliente.nome}! 😊\n\nSeu pedido da Lolana Lavanderia está pronto para retirada.\nValor total: ${formatCurrency(pedido.valorTotal)}.\n\nAguardamos você!`;
      const telefone = pedido.cliente.telefone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappUrl, "_blank");
      toast.success("Mensagem de WhatsApp preparada!");
    }
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <MainLayout title="Pedidos">
      <Card className="shadow-lg border-0">
        <CardHeader className="flex flex-row items-center justify-between bg-muted/50 rounded-t-lg">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle>Gerenciamento de Pedidos</CardTitle>
          </div>
          <Dialog open={isOpen} onOpenChange={(open) => {
            setIsOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button className="gap-2" disabled={clientes.length === 0}>
                <Plus className="h-4 w-4" />
                Novo Pedido
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Criar Novo Pedido</DialogTitle>
              </DialogHeader>
              <div className="space-y-6 py-4">
                <div className="space-y-2">
                  <Label>Cliente *</Label>
                  <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          #{cliente.id} - {cliente.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <Label>Serviços</Label>
                    <span className="text-lg font-bold text-primary">
                      Total: {formatCurrency(totalSelecionado)}
                    </span>
                  </div>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/30">
                          <TableHead>Serviço</TableHead>
                          <TableHead className="w-32 text-right">Preço</TableHead>
                          <TableHead className="w-28 text-center">Qtd</TableHead>
                          <TableHead className="w-32 text-right">Total</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {servicosFixos.map((servico) => (
                          <TableRow
                            key={servico.id}
                            className={quantidades[servico.id] > 0 ? "bg-primary/5" : ""}
                          >
                            <TableCell className="font-medium text-sm">
                              {servico.nome}
                            </TableCell>
                            <TableCell className="text-right font-mono text-sm">
                              {formatCurrency(servico.preco)}
                            </TableCell>
                            <TableCell className="text-center">
                              <Input
                                type="number"
                                min="0"
                                value={quantidades[servico.id]}
                                onChange={(e) =>
                                  setQuantidades((prev) => ({
                                    ...prev,
                                    [servico.id]: Math.max(0, parseInt(e.target.value) || 0),
                                  }))
                                }
                                className="w-16 mx-auto text-center h-8"
                              />
                            </TableCell>
                            <TableCell className="text-right font-mono font-semibold text-sm">
                              {quantidades[servico.id] > 0 ? (
                                <span className="text-primary">
                                  {formatCurrency(servico.preco * quantidades[servico.id])}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">-</span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleCreatePedido}>Criar Pedido</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="p-0">
          {clientes.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Cadastre clientes primeiro</p>
              <p className="text-sm">Para criar pedidos, é necessário ter clientes cadastrados</p>
            </div>
          ) : pedidos.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">
              <ClipboardList className="h-16 w-16 mx-auto mb-4 opacity-30" />
              <p className="text-lg">Nenhum pedido criado</p>
              <p className="text-sm">Clique em "Novo Pedido" para começar</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="w-20">Pedido</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Itens</TableHead>
                  <TableHead className="w-32 text-right">Valor Total</TableHead>
                  <TableHead className="w-40 text-center">Status</TableHead>
                  <TableHead className="w-48">Data</TableHead>
                  <TableHead className="w-20 text-center">WhatsApp</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pedidos.map((pedido) => {
                  const StatusIcon = statusConfig[pedido.status].icon;
                  return (
                    <TableRow key={pedido.id} className="hover:bg-muted/20">
                      <TableCell className="font-mono font-semibold text-primary">
                        #{pedido.id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{pedido.cliente.nome}</p>
                          <p className="text-sm text-muted-foreground">
                            {pedido.cliente.telefone}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {pedido.itens.map((item, i) => (
                            <span key={i}>
                              {item.quantidade}x {item.servico.nome}
                              {i < pedido.itens.length - 1 ? ", " : ""}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold text-lg">
                        {formatCurrency(pedido.valorTotal)}
                      </TableCell>
                      <TableCell>
                        <Select
                          value={pedido.status}
                          onValueChange={(value: StatusPedido) =>
                            handleStatusChange(pedido.id, value)
                          }
                        >
                          <SelectTrigger className={`${statusConfig[pedido.status].class} border`}>
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <span>{statusConfig[pedido.status].label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {Object.entries(statusConfig).map(([key, config]) => {
                              const Icon = config.icon;
                              return (
                                <SelectItem key={key} value={key}>
                                  <div className="flex items-center gap-2">
                                    <Icon className="h-4 w-4" />
                                    <span>{config.label}</span>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatDate(pedido.dataCriacao)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="hover:bg-success/20 hover:text-success"
                          onClick={() => {
                            const mensagem = `Olá, ${pedido.cliente.nome}! 😊\n\nSeu pedido #${pedido.id} da Lolana Lavanderia.\nValor total: ${formatCurrency(pedido.valorTotal)}.`;
                            const telefone = pedido.cliente.telefone.replace(/\D/g, "");
                            window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, "_blank");
                          }}
                        >
                          <MessageCircle className="h-5 w-5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};
