export interface Cliente {
  id: string;
  nome: string;
  telefone: string;
  endereco: string;
}

export interface Servico {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
}

export interface ItemPedido {
  servico: Servico;
  quantidade: number;
}

export type StatusPedido = 'lavando' | 'passando' | 'pronto';

export interface Pedido {
  id: string;
  cliente: Cliente;
  itens: ItemPedido[];
  valorTotal: number;
  status: StatusPedido;
  dataCriacao: Date;
}
