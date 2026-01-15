import { useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { usePedidos, PedidoDB } from "@/hooks/usePedidos";
import { StatusPedido } from "@/types";
import { ClipboardList, MessageCircle, WashingMachine, Wind, Shirt, Check, X, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import lolanaLogo from "@/assets/lolana.png";

const statusConfig: Record<StatusPedido, { label: string; icon: React.ElementType; bgClass: string; textClass: string }> = {
  lavando: { label: "Lavando", icon: WashingMachine, bgClass: "bg-[hsl(210,100%,50%)]", textClass: "text-white" },
  passando: { label: "Passando", icon: Shirt, bgClass: "bg-[hsl(38,92%,50%)]", textClass: "text-white" },
  secando: { label: "Secando", icon: Wind, bgClass: "bg-[hsl(199,89%,48%)]", textClass: "text-white" },
  pronto: { label: "Pronto", icon: Check, bgClass: "bg-[hsl(142,76%,36%)]", textClass: "text-white" },
};

export const PedidosPage = () => {
  const { pedidos, isLoading, updatePedidoStatus, updatePedidoPagamento, deletePedido } = usePedidos();

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const handleStatusChange = (pedido: PedidoDB, newStatus: StatusPedido) => {
    updatePedidoStatus.mutate({ id: pedido.id, status: newStatus });
    
    if (newStatus === "pronto") {
      const mensagem = `Olá ${pedido.cliente_nome}! 😊\n\nSeu pedido da Lolana Lavanderia está pronto para retirada.\nValor total: ${formatCurrency(pedido.valor_total)}.\n\nAguardamos você!\n\n📞 Contato: (19) 99757-9086`;
      const telefone = pedido.cliente_telefone.replace(/\D/g, "");
      const whatsappUrl = `https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`;
      window.open(whatsappUrl, "_blank");
      toast.success("Mensagem de WhatsApp preparada!");
    }
  };

  const handleMarcarRetiradoPago = (pedido: PedidoDB) => {
    updatePedidoPagamento.mutate({ id: pedido.id, pago: true, retirado: true });
    toast.success("Pedido marcado como retirado e pago!");
  };

  const handleMarcarRetiradoNaoPago = (pedido: PedidoDB) => {
    updatePedidoPagamento.mutate({ id: pedido.id, pago: false, retirado: true });
    toast.warning("Pedido marcado como retirado SEM pagamento!");
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <MainLayout title="Pedidos">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Pedidos">
      <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] text-white rounded-t-2xl">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-5 w-5 md:h-6 md:w-6" />
            <CardTitle className="text-white text-lg md:text-xl">Gerenciamento de Pedidos</CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="bg-white/20 text-white border-0">
              {pedidos.length} pedido(s)
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {pedidos.length === 0 ? (
            <div className="p-8 md:p-12 text-center text-muted-foreground">
              <ClipboardList className="h-12 w-12 md:h-16 md:w-16 mx-auto mb-4 opacity-30" />
              <p className="text-base md:text-lg">Nenhum pedido criado</p>
              <p className="text-sm">Crie pedidos na aba "Serviços"</p>
            </div>
          ) : (
            <>
              {/* Mobile Cards View */}
              <div className="block lg:hidden divide-y">
                {pedidos.map((pedido) => {
                  const StatusIcon = statusConfig[pedido.status].icon;
                  const isPronto = pedido.status === "pronto";
                  
                  return (
                    <div key={pedido.id} className="p-4 space-y-3">
                      {/* Header: ID, Cliente, Data */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="font-mono font-bold text-[hsl(210,100%,50%)]">#{pedido.numero}</span>
                          <p className="font-medium">{pedido.cliente_nome}</p>
                          <p className="text-sm text-muted-foreground">{pedido.cliente_telefone}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-mono font-bold text-lg text-[hsl(215,70%,25%)]">
                            {formatCurrency(pedido.valor_total)}
                          </p>
                          <p className="text-xs text-muted-foreground">{formatDate(pedido.created_at)}</p>
                        </div>
                      </div>

                      {/* Itens */}
                      <div className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-2">
                        {pedido.itens.map((item, i) => (
                          <span key={i}>
                            {item.quantidade}x {item.servico.nome}
                            {i < pedido.itens.length - 1 ? ", " : ""}
                          </span>
                        ))}
                      </div>

                      {/* Status e Pagamento */}
                      <div className="flex flex-wrap items-center gap-2">
                        <Select
                          value={pedido.status}
                          onValueChange={(value: StatusPedido) =>
                            handleStatusChange(pedido, value)
                          }
                        >
                          <SelectTrigger className={`${statusConfig[pedido.status].bgClass} ${statusConfig[pedido.status].textClass} border-0 rounded-xl w-auto min-w-[130px]`}>
                            <div className="flex items-center gap-2">
                              <StatusIcon className="h-4 w-4" />
                              <span className="font-medium">{statusConfig[pedido.status].label}</span>
                            </div>
                          </SelectTrigger>
                          <SelectContent className="rounded-xl">
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

                        {pedido.retirado ? (
                          pedido.pago ? (
                            <Badge className="bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-0">
                              <Check className="h-3 w-3 mr-1" />
                              Pago
                            </Badge>
                          ) : (
                            <Badge className="bg-destructive/10 text-destructive border-0">
                              <X className="h-3 w-3 mr-1" />
                              Não Pago
                            </Badge>
                          )
                        ) : isPronto ? (
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              onClick={() => handleMarcarRetiradoPago(pedido)}
                              className="bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] rounded-lg h-8 px-2"
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleMarcarRetiradoNaoPago(pedido)}
                              className="rounded-lg h-8 px-2"
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : null}
                      </div>

                      {/* Ações */}
                      <div className="flex items-center gap-2 pt-2 border-t">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 gap-2 rounded-xl"
                          onClick={() => {
                            const mensagem = `Olá, ${pedido.cliente_nome}! 😊\n\nSeu pedido #${pedido.numero} da Lolana Lavanderia.\nValor total: ${formatCurrency(pedido.valor_total)}.\n\n📞 Contato: (19) 99757-9086`;
                            const telefone = pedido.cliente_telefone.replace(/\D/g, "");
                            window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, "_blank");
                          }}
                        >
                          <MessageCircle className="h-4 w-4" />
                          WhatsApp
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              className="gap-2 rounded-xl text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="rounded-2xl mx-4 max-w-[calc(100vw-2rem)]">
                            <AlertDialogHeader>
                              <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
                              <AlertDialogDescription>
                                Tem certeza que deseja excluir o pedido #{pedido.numero}?
                                Esta ação não pode ser desfeita.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter className="flex-col sm:flex-row gap-2">
                              <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePedido.mutate(pedido.id)}
                                className="bg-destructive hover:bg-destructive/90 rounded-xl"
                              >
                                Excluir
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden lg:block overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-[hsl(210,100%,97%)]">
                      <TableHead className="w-24 font-bold text-[hsl(215,70%,25%)]">Pedido</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Cliente</TableHead>
                      <TableHead className="font-bold text-[hsl(215,70%,25%)]">Itens</TableHead>
                      <TableHead className="w-32 text-right font-bold text-[hsl(215,70%,25%)]">Valor</TableHead>
                      <TableHead className="w-40 text-center font-bold text-[hsl(215,70%,25%)]">Status</TableHead>
                      <TableHead className="w-32 text-center font-bold text-[hsl(215,70%,25%)]">Pagamento</TableHead>
                      <TableHead className="w-48 font-bold text-[hsl(215,70%,25%)]">Data</TableHead>
                      <TableHead className="w-32 text-center font-bold text-[hsl(215,70%,25%)]">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pedidos.map((pedido) => {
                      const StatusIcon = statusConfig[pedido.status].icon;
                      const isPronto = pedido.status === "pronto";
                      
                      return (
                        <TableRow key={pedido.id} className="hover:bg-[hsl(210,100%,98%)]">
                          <TableCell className="font-mono font-bold text-[hsl(210,100%,50%)]">
                            #{pedido.numero}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{pedido.cliente_nome}</p>
                              <p className="text-sm text-muted-foreground">
                                {pedido.cliente_telefone}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm max-w-xs">
                              {pedido.itens.map((item, i) => (
                                <span key={i}>
                                  {item.quantidade}x {item.servico.nome}
                                  {i < pedido.itens.length - 1 ? ", " : ""}
                                </span>
                              ))}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-lg text-[hsl(215,70%,25%)]">
                            {formatCurrency(pedido.valor_total)}
                          </TableCell>
                          <TableCell>
                            <Select
                              value={pedido.status}
                              onValueChange={(value: StatusPedido) =>
                                handleStatusChange(pedido, value)
                              }
                            >
                              <SelectTrigger className={`${statusConfig[pedido.status].bgClass} ${statusConfig[pedido.status].textClass} border-0 rounded-xl`}>
                                <div className="flex items-center gap-2">
                                  <StatusIcon className="h-4 w-4" />
                                  <span className="font-medium">{statusConfig[pedido.status].label}</span>
                                </div>
                              </SelectTrigger>
                              <SelectContent className="rounded-xl">
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
                          <TableCell className="text-center">
                            {pedido.retirado ? (
                              <div className="flex justify-center">
                                {pedido.pago ? (
                                  <div className="flex items-center gap-1 text-[hsl(142,76%,36%)]">
                                    <Check className="h-6 w-6" />
                                    <span className="text-xs font-medium">Pago</span>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-1 text-destructive">
                                    <X className="h-6 w-6" />
                                    <span className="text-xs font-medium">Não Pago</span>
                                  </div>
                                )}
                              </div>
                            ) : isPronto ? (
                              <div className="flex justify-center gap-1">
                                <Button
                                  size="sm"
                                  onClick={() => handleMarcarRetiradoPago(pedido)}
                                  className="bg-[hsl(142,76%,36%)] hover:bg-[hsl(142,76%,30%)] rounded-lg h-8 px-2"
                                  title="Retirado e Pago"
                                >
                                  <Check className="h-4 w-4" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handleMarcarRetiradoNaoPago(pedido)}
                                  className="rounded-lg h-8 px-2"
                                  title="Retirado Sem Pagar"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {formatDate(pedido.created_at)}
                          </TableCell>
                          <TableCell className="text-center">
                            <div className="flex items-center justify-center gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="hover:bg-[hsl(142,76%,36%)]/20 hover:text-[hsl(142,76%,36%)] rounded-xl"
                                onClick={() => {
                                  const mensagem = `Olá, ${pedido.cliente_nome}! 😊\n\nSeu pedido #${pedido.numero} da Lolana Lavanderia.\nValor total: ${formatCurrency(pedido.valor_total)}.\n\n📞 Contato: (19) 99757-9086`;
                                  const telefone = pedido.cliente_telefone.replace(/\D/g, "");
                                  window.open(`https://wa.me/55${telefone}?text=${encodeURIComponent(mensagem)}`, "_blank");
                                }}
                              >
                                <MessageCircle className="h-5 w-5" />
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
                                    <AlertDialogTitle>Excluir Pedido</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Tem certeza que deseja excluir o pedido #{pedido.numero}?
                                      Esta ação não pode ser desfeita.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => deletePedido.mutate(pedido.id)}
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
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </MainLayout>
  );
};
