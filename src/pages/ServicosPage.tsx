import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { servicosFixos } from "@/data/servicos";
import { Package, ShoppingCart } from "lucide-react";

export const ServicosPage = () => {
  const navigate = useNavigate();
  const [quantidades, setQuantidades] = useState<Record<string, number>>(
    servicosFixos.reduce((acc, s) => ({ ...acc, [s.id]: 0 }), {})
  );

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

  const total = useMemo(() => {
    return servicosFixos.reduce((acc, servico) => {
      return acc + servico.preco * (quantidades[servico.id] || 0);
    }, 0);
  }, [quantidades]);

  const categorias = useMemo(() => {
    return [...new Set(servicosFixos.map((s) => s.categoria))];
  }, []);

  const getCategoryColor = (categoria: string) => {
    const colors: Record<string, string> = {
      "Serviços por KG": "bg-info/10 text-info border-info/30",
      "Peças de Cama": "bg-accent/10 text-accent border-accent/30",
      "Camisas": "bg-warning/10 text-warning border-warning/30",
      "Vestido": "bg-destructive/10 text-destructive border-destructive/30",
      "Valor Unitário": "bg-success/10 text-success border-success/30",
    };
    return colors[categoria] || "bg-muted text-muted-foreground";
  };

  return (
    <MainLayout title="Serviços / Produtos">
      <div className="space-y-6">
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-muted/50 rounded-t-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Package className="h-6 w-6 text-primary" />
                <CardTitle>Tabela de Serviços</CardTitle>
              </div>
              <div className="text-right flex items-center gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Total Selecionado</p>
                  <p className="text-2xl font-bold text-primary">
                    {formatCurrency(total)}
                  </p>
                </div>
                <Button 
                  onClick={() => navigate("/pedidos")} 
                  className="gap-2"
                  size="lg"
                >
                  <ShoppingCart className="h-5 w-5" />
                  Criar Pedido
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead>Serviço</TableHead>
                  <TableHead className="w-40">Categoria</TableHead>
                  <TableHead className="w-32 text-right">Preço Unit.</TableHead>
                  <TableHead className="w-32 text-center">Quantidade</TableHead>
                  <TableHead className="w-32 text-right">Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorias.map((categoria) => (
                  <>
                    {servicosFixos
                      .filter((s) => s.categoria === categoria)
                      .map((servico, index) => (
                        <TableRow
                          key={servico.id}
                          className={`hover:bg-muted/20 ${
                            quantidades[servico.id] > 0 ? "bg-primary/5" : ""
                          }`}
                        >
                          <TableCell className="font-medium">
                            {servico.nome}
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="outline"
                              className={getCategoryColor(servico.categoria)}
                            >
                              {servico.categoria}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {formatCurrency(servico.preco)}
                          </TableCell>
                          <TableCell className="text-center">
                            <Input
                              type="number"
                              min="0"
                              value={quantidades[servico.id]}
                              onChange={(e) =>
                                handleQuantidadeChange(servico.id, e.target.value)
                              }
                              className="w-20 mx-auto text-center"
                            />
                          </TableCell>
                          <TableCell className="text-right font-mono font-semibold">
                            {quantidades[servico.id] > 0 ? (
                              <span className="text-primary">
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
                  </>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};
