import { create } from 'zustand';
import { Cliente, Pedido, ItemPedido, StatusPedido } from '@/types';

interface AppState {
  clientes: Cliente[];
  pedidos: Pedido[];
  nextClienteId: number;
  nextPedidoId: number;
  
  // Cliente actions
  addCliente: (cliente: Omit<Cliente, 'id'>) => void;
  updateCliente: (id: string, cliente: Omit<Cliente, 'id'>) => void;
  deleteCliente: (id: string) => void;
  
  // Pedido actions
  addPedido: (cliente: Cliente, itens: ItemPedido[]) => void;
  updatePedidoStatus: (id: string, status: StatusPedido) => void;
  deletePedido: (id: string) => void;
}

const formatId = (num: number): string => {
  return num.toString().padStart(3, '0');
};

export const useStore = create<AppState>((set, get) => ({
  clientes: [],
  pedidos: [],
  nextClienteId: 1,
  nextPedidoId: 1,

  addCliente: (clienteData) => {
    const { nextClienteId, clientes } = get();
    const newCliente: Cliente = {
      ...clienteData,
      id: formatId(nextClienteId),
    };
    set({
      clientes: [...clientes, newCliente],
      nextClienteId: nextClienteId + 1,
    });
  },

  updateCliente: (id, clienteData) => {
    const { clientes } = get();
    set({
      clientes: clientes.map((c) =>
        c.id === id ? { ...clienteData, id } : c
      ),
    });
  },

  deleteCliente: (id) => {
    const { clientes } = get();
    set({
      clientes: clientes.filter((c) => c.id !== id),
    });
  },

  addPedido: (cliente, itens) => {
    const { nextPedidoId, pedidos } = get();
    const valorTotal = itens.reduce(
      (acc, item) => acc + item.servico.preco * item.quantidade,
      0
    );
    const newPedido: Pedido = {
      id: formatId(nextPedidoId),
      cliente,
      itens,
      valorTotal,
      status: 'lavando',
      dataCriacao: new Date(),
    };
    set({
      pedidos: [...pedidos, newPedido],
      nextPedidoId: nextPedidoId + 1,
    });
  },

  updatePedidoStatus: (id, status) => {
    const { pedidos } = get();
    set({
      pedidos: pedidos.map((p) => (p.id === id ? { ...p, status } : p)),
    });
  },

  deletePedido: (id) => {
    const { pedidos } = get();
    set({
      pedidos: pedidos.filter((p) => p.id !== id),
    });
  },
}));
