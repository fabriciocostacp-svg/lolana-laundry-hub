import { Servico } from "@/types";

export const servicosFixos: Servico[] = [
  // Serviços por KG
  { id: "kg-1", nome: "Por Kg", categoria: "Serviços por KG", preco: 26.00 },
  { id: "kg-2", nome: "Kg lavada e passada", categoria: "Serviços por KG", preco: 22.00 },
  { id: "kg-3", nome: "Kg lavar ou passar", categoria: "Serviços por KG", preco: 22.00 },
  
  // Peças de Cama
  { id: "cama-1", nome: "Edredom solteiro", categoria: "Peças de Cama", preco: 30.00 },
  { id: "cama-2", nome: "Edredom casal", categoria: "Peças de Cama", preco: 42.00 },
  { id: "cama-3", nome: "Coberdrom", categoria: "Peças de Cama", preco: 50.00 },
  
  // Camisas
  { id: "camisa-1", nome: "Camisa manga longa (lavar e passar)", categoria: "Camisas", preco: 17.00 },
  { id: "camisa-2", nome: "Camisa manga longa (passar)", categoria: "Camisas", preco: 15.00 },
  { id: "camisa-3", nome: "Camisa manga curta (lavar e passar)", categoria: "Camisas", preco: 15.00 },
  { id: "camisa-4", nome: "Camisa manga curta (passar)", categoria: "Camisas", preco: 12.00 },
  
  // Vestido
  { id: "vestido-1", nome: "Vestido de festa (a partir de)", categoria: "Vestido", preco: 40.00 },
  
  // Valor Unitário
  { id: "unitario-1", nome: "Calça", categoria: "Valor Unitário", preco: 10.00 },
  { id: "unitario-2", nome: "Camiseta", categoria: "Valor Unitário", preco: 8.00 },
  { id: "unitario-3", nome: "Short", categoria: "Valor Unitário", preco: 6.00 },
  { id: "unitario-4", nome: "Paletó", categoria: "Valor Unitário", preco: 30.00 },
];
