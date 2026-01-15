import React, { useState, useMemo } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { servicosFixos } from "@/data/servicos";
import { useClientes } from "@/hooks/useClientes";
import { usePedidos } from "@/hooks/usePedidos";
import { ItemPedido } from "@/types";
import { Package, ShoppingCart, UserCheck, Loader2, Search, Percent, Truck } from "lucide-react";
import { toast } from "sonner";

export const ServicosPage = () => {
  const { clientes, isLoading: loadingClientes } = useClientes();
  const { addPedido } = usePedidos();
  const [selectedClienteId, setSelectedClienteId] = useState<string>("");
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    servicosFixos.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {})
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [desconto, setDesconto] = useState<string>("");
  const [tipoDesconto, setTipoDesconto] = useState<"percentual" | "valor">("percentual");
  const [taxaEntrega, setTaxaEntrega] = useState<string>("");

  const handleQuantidadeChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setQuantidades((prev) => ({
      ...prev,
      [id]: Math.max(0, num),
    }));
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL",
    });
  };

  const subtotal = useMemo(() => {
    return servicosFixos.reduce((acc, servico) => {
      return acc + servico.preco * (quantidades[servico.id] || 0);
    }, 0);
  }, [quantidades]);

  const descontoNum = parseFloat(desconto) || 0;
  const taxaEntregaNum = parseInt(taxaEntrega) || 0;
  
  const descontoTotal = tipoDesconto === "percentual" 
    ? (subtotal * descontoNum) / 100 
    : descontoNum;
  const total = Math.max(0, subtotal - descontoTotal + taxaEntregaNum);

  const categorias = useMemo(() => {
    return [...new Set(servicosFixos.map((s) => s.categoria))];
  }, []);

  // Filtrar serviços pela busca (nome, categoria ou número)
  const servicosFiltrados = useMemo(() => {
    if (!searchTerm.trim()) return servicosFixos;
    const term = searchTerm.toLowerCase().trim();
    
    // Verificar se é busca por números separados por vírgula
    const numeros = term.split(/[,\s]+/).map(n => parseInt(n.trim())).filter(n => !isNaN(n));
    
    if (numeros.length > 0) {
      return servicosFixos.filter((s, index) => 
        numeros.includes(index + 1) ||
        s.nome.toLowerCase().includes(term) ||
        s.categoria.toLowerCase().includes(term)
      );
    }
    
    return servicosFixos.filter(
      (s) =>
        s.nome.toLowerCase().includes(term) ||
        s.categoria.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  // Agrupar serviços filtrados por categoria
  const categoriasFiltradas = useMemo(() => {
    return [...new Set(servicosFiltrados.map((s) => s.categoria))];
  }, [servicosFiltrados]);

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "Serviços por KG": "bg-[hsl(210,100%,50%)]/10 text-[hsl(210,100%,50%)] border-[hsl(210,100%,50%)]/30",
      "Peças de Cama": "bg-[hsl(199,89%,48%)]/10 text-[hsl(199,89%,48%)] border-[hsl(199,89%,48%)]/30",
      "Camisas": "bg-[hsl(38,92%,50%)]/10 text-[hsl(38,92%,50%)] border-[hsl(38,92%,50%)]/30",
      "Vestido": "bg-[hsl(280,70%,50%)]/10 text-[hsl(280,70%,50%)] border-[hsl(280,70%,50%)]/30",
      "Valor Unitário": "bg-[hsl(142,76%,36%)]/10 text-[hsl(142,76%,36%)] border-[hsl(142,76%,36%)]/30",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  // Criar índice numérico para os serviços
  const servicoIndex = useMemo(() => {
    const index: Record<string, number> = {};
    servicosFixos.forEach((s, i) => {
      index[s.id] = i + 1;
    });
    return index;
  }, []);

  const handleCriarPedido = () => {
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

    addPedido.mutate({ 
      cliente, 
      itens,
      descontoPercentual: tipoDesconto === "percentual" ? descontoNum : 0,
      descontoValor: tipoDesconto === "valor" ? descontoNum : 0,
      taxaEntrega: taxaEntregaNum
    });
    
    // Reset form
    setSelectedClienteId("");
    setQuantidades(servicosFixos.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {}));
    setDesconto("");
    setTipoDesconto("percentual");
    setTaxaEntrega("");
    setSearchTerm("");
  };

  const hasServicosSelected = Object.values(quantidades).some((q) => q > 0);

  // Adicionar serviço pela busca rápida
  const handleAddFromSearch = (servicoId: string) => {
    setQuantidades((prev) => ({
      ...prev,
      [servicoId]: (prev[servicoId] || 0) + 1,
    }));
    toast.success("Serviço adicionado!");
  };

  if (loadingClientes) {
    return (
      <MainLayout title="Serviços">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout title="Serviços">
      <div className="space-y-4 md:space-y-6">
        {/* Card de Seleção de Cliente */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-[hsl(210,100%,50%)] to-[hsl(215,70%,35%)] text-white rounded-t-2xl py-4">
            <div className="flex items-center gap-3">
              <UserCheck className="h-5 w-5 md:h-6 md:w-6" />
              <CardTitle className="text-white text-lg md:text-xl">Selecionar Cliente</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="py-4">
            <div className="flex flex-col md:flex-row md:items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label>Cliente *</Label>
                <Select value={selectedClienteId} onValueChange={setSelectedClienteId}>
                  <SelectTrigger className="w-full rounded-xl">
                    <SelectValue placeholder="Selecione um cliente cadastrado" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {clientes.length === 0 ? (
                      <SelectItem value="none" disabled>
                        Nenhum cliente cadastrado
                      </SelectItem>
                    ) : (
                      clientes.map((cliente) => (
                        <SelectItem key={cliente.id} value={cliente.id}>
                          #{cliente.numero} - {cliente.nome} | {cliente.telefone}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {clientes.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Cadastre clientes na aba "Clientes" primeiro
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Card de Busca de Serviços */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardContent className="py-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <Search className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
              <Input
                placeholder="Buscar por nome, categoria ou número (ex: 1,4,5)..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 rounded-xl text-sm sm:text-base"
              />
            </div>
          </CardContent>
        </Card>

        {/* Card de Desconto e Taxa */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-[hsl(210,100%,97%)] py-3">
            <CardTitle className="text-[hsl(215,70%,25%)] text-base md:text-lg flex items-center gap-2">
              <Percent className="h-5 w-5" />
              Descontos e Taxas
            </CardTitle>
          </CardHeader>
          <CardContent className="py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Percent className="h-4 w-4" />
                  Desconto
                </Label>
                <div className="flex gap-2">
                  <Input
                    type="number"
                    min="0"
                    max={tipoDesconto === "percentual" ? 100 : undefined}
                    step="0.01"
                    placeholder="0"
                    value={desconto}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^0-9.]/g, "");
                      setDesconto(value);
                    }}
                    className="rounded-xl flex-1"
                  />
                  <Select value={tipoDesconto} onValueChange={(value: "percentual" | "valor") => setTipoDesconto(value)}>
                    <SelectTrigger className="w-24 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="percentual">%</SelectItem>
                      <SelectItem value="valor">R$</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Truck className="h-4 w-4" />
                  Taxa de Entrega (R$)
                </Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={taxaEntrega}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, "");
                    setTaxaEntrega(value);
                  }}
                  className="rounded-xl"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Serviços */}
        <Card className="shadow-xl border-0 rounded-2xl overflow-hidden">
          <CardHeader className="bg-[hsl(210,100%,97%)] rounded-t-2xl">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Package className="h-5 w-5 md:h-6 md:w-6 text-[hsl(210,100%,50%)]" />
                <CardTitle className="text-[hsl(215,70%,25%)] text-lg md:text-xl">Tabela de Serviços</CardTitle>
              </div>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 sm:gap-4">
                <div className="text-left sm:text-right space-y-1">
                  <p className="text-sm text-muted-foreground">Subtotal: {formatCurrency(subtotal)}</p>
                  {descontoTotal > 0 && (
                    <p className="text-sm text-red-500">
                      Desconto{tipoDesconto === "percentual" ? ` (${desconto}%)` : ""}: -{formatCurrency(descontoTotal)}
                    </p>
                  )}
                  {taxaEntregaNum > 0 && (
                    <p className="text-sm text-muted-foreground">
                      Taxa: +{formatCurrency(taxaEntregaNum)}
                    </p>
                  )}
                  <p className="text-xl md:text-2xl font-bold text-[hsl(210,100%,50%)]">
                    Total: {formatCurrency(total)}
                  </p>
                </div>
                <Button 
                  onClick={handleCriarPedido} 
                  className="gap-2 rounded-xl bg-gradient-to-r from-[hsl(142,76%,36%)] to-[hsl(142,76%,30%)] hover:from-[hsl(142,76%,32%)] hover:to-[hsl(142,76%,26%)] w-full sm:w-auto"
                  size="lg"
                  disabled={!selectedClienteId || !hasServicosSelected || addPedido.isPending}
                >
                  <ShoppingCart className="h-5 w-5" />
                  Concluir Serviço
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            {/* Mobile Cards View */}
            <div className="block md:hidden divide-y">
              {servicosFiltrados.map((servico) => (
                <div 
                  key={servico.id} 
                  className={`p-4 space-y-3 ${quantidades[servico.id] > 0 ? "bg-[hsl(210,100%,95%)]" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          #{servicoIndex[servico.id]}
                        </span>
                        <p className="font-medium">{servico.nome}</p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`${getCategoryColor(servico.categoria)} rounded-lg text-xs`}
                      >
                        {servico.categoria}
                      </Badge>
                    </div>
                    <p className="font-mono font-semibold text-right">
                      {formatCurrency(servico.preco)}
                    </p>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Label className="text-sm">Qtd:</Label>
                      <Input
                        type="number"
                        min="0"
                        step="1"
                        value={quantidades[servico.id]}
                        onChange={(e) =>
                          handleQuantidadeChange(servico.id, e.target.value)
                        }
                        className="w-20 text-center rounded-xl"
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleAddFromSearch(servico.id)}
                        className="rounded-xl"
                      >
                        +1
                      </Button>
                    </div>
                    {quantidades[servico.id] > 0 && (
                      <p className="font-mono font-bold text-[hsl(210,100%,50%)]">
                        {formatCurrency(servico.preco * quantidades[servico.id])}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-[hsl(215,70%,25%)]">
                    <TableHead className="w-16 text-white font-bold">#</TableHead>
                    <TableHead className="text-white font-bold">Serviço</TableHead>
                    <TableHead className="w-40 text-white font-bold">Categoria</TableHead>
                    <TableHead className="w-32 text-right text-white font-bold">Preço Unit.</TableHead>
                    <TableHead className="w-40 text-center text-white font-bold">Quantidade</TableHead>
                    <TableHead className="w-32 text-right text-white font-bold">Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {servicosFiltrados.map((servico) => (
                    <TableRow
                      key={servico.id}
                      className={`hover:bg-[hsl(210,100%,98%)] ${
                        quantidades[servico.id] > 0 ? "bg-[hsl(210,100%,95%)]" : ""
                      }`}
                    >
                      <TableCell className="font-mono text-muted-foreground">
                        #{servicoIndex[servico.id]}
                      </TableCell>
                      <TableCell className="font-medium">
                        {servico.nome}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={`${getCategoryColor(servico.categoria)} rounded-lg`}
                        >
                          {servico.categoria}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono font-semibold">
                        {formatCurrency(servico.preco)}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={quantidades[servico.id]}
                            onChange={(e) =>
                              handleQuantidadeChange(servico.id, e.target.value)
                            }
                            className="w-20 text-center rounded-xl"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddFromSearch(servico.id)}
                            className="rounded-xl"
                          >
                            +1
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-bold">
                        {quantidades[servico.id] > 0 ? (
                          <span className="text-[hsl(210,100%,50%)]">
                            {formatCurrency(
                              servico.preco * quantidades[servico.id]
                            )}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">
                            {formatCurrency(0)}
                          </span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="p-4 bg-[hsl(210,100%,97%)] border-t">
              <p className="text-sm text-muted-foreground text-center">
                <strong>Obs:</strong> Quando não atingir 1kg, será cobrado por valor unitário.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
