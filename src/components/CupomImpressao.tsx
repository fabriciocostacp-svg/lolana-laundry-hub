import { forwardRef } from "react";
import lolanaLogo from "@/assets/lolana.png";
import { PedidoDB } from "@/hooks/usePedidos";

interface CupomImpressaoProps {
  pedido: PedidoDB;
  cpfCnpj?: string;
}

export const CupomImpressao = forwardRef<HTMLDivElement, CupomImpressaoProps>(
  ({ pedido, cpfCnpj }, ref) => {
    const formatCurrency = (value: number) => {
      return value.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
      });
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

    const subtotal = pedido.itens.reduce(
      (acc, item) => acc + item.servico.preco * item.quantidade,
      0
    );
    
    const descontoPercentual = Number(pedido.desconto_percentual) || 0;
    const descontoValor = Number(pedido.desconto_valor) || 0;
    const taxaEntrega = Number(pedido.taxa_entrega) || 0;
    
    const valorDescontoPercentual = (subtotal * descontoPercentual) / 100;
    const descontoTotal = valorDescontoPercentual + descontoValor;

    return (
      <div
        ref={ref}
        className="p-6 bg-white text-black max-w-[300px] mx-auto font-mono text-xs"
        style={{ fontFamily: "monospace" }}
      >
        {/* Logo */}
        <div className="text-center mb-4">
          <img
            src={lolanaLogo}
            alt="Lolana Lavanderia"
            className="h-16 mx-auto mb-2"
          />
          <h1 className="font-bold text-lg">LOLANA LAVANDERIA</h1>
          <p className="text-[10px]">Prestação de Serviços</p>
          <p className="text-[10px]">📞 (19) 99757-9086</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Dados do Pedido */}
        <div className="mb-2">
          <p><strong>Pedido:</strong> #{pedido.numero}</p>
          <p><strong>Data:</strong> {formatDate(pedido.created_at)}</p>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Dados do Cliente */}
        <div className="mb-2">
          <p><strong>Cliente:</strong> {pedido.cliente_nome}</p>
          <p><strong>Tel:</strong> {pedido.cliente_telefone}</p>
          {(cpfCnpj || pedido.cliente_cpf || pedido.cliente_cnpj) && (
            <p><strong>CPF/CNPJ:</strong> {cpfCnpj || pedido.cliente_cpf || pedido.cliente_cnpj}</p>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Itens */}
        <div className="mb-2">
          <p className="font-bold mb-1">ITENS:</p>
          {pedido.itens.map((item, i) => (
            <div key={i} className="flex justify-between text-[10px]">
              <span>{item.quantidade}x {item.servico.nome}</span>
              <span>{formatCurrency(item.servico.preco * item.quantidade)}</span>
            </div>
          ))}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Totais */}
        <div className="space-y-1">
          <div className="flex justify-between">
            <span>Subtotal:</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          
          {descontoTotal > 0 && (
            <div className="flex justify-between text-red-600">
              <span>
                Desconto
                {descontoPercentual > 0 && ` (${descontoPercentual}%)`}:
              </span>
              <span>-{formatCurrency(descontoTotal)}</span>
            </div>
          )}
          
          {taxaEntrega > 0 && (
            <div className="flex justify-between">
              <span>Taxa Entrega:</span>
              <span>+{formatCurrency(taxaEntrega)}</span>
            </div>
          )}
          
          <div className="flex justify-between font-bold text-sm border-t border-black pt-1">
            <span>TOTAL:</span>
            <span>{formatCurrency(pedido.valor_total)}</span>
          </div>
        </div>

        <div className="border-t border-dashed border-black my-2" />

        {/* Status */}
        <div className="text-center">
          <p><strong>Status:</strong> {pedido.status.toUpperCase()}</p>
          {pedido.retirado && (
            <p className={pedido.pago ? "text-green-600" : "text-red-600"}>
              {pedido.pago ? "✓ PAGO" : "✗ NÃO PAGO"}
            </p>
          )}
        </div>

        <div className="border-t border-dashed border-black my-2" />

        <p className="text-center text-[9px] mt-4">
          Obrigado pela preferência!
        </p>
      </div>
    );
  }
);

CupomImpressao.displayName = "CupomImpressao";
