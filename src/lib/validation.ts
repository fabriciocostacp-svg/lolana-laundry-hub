import { z } from 'zod';

// Schema de validação para clientes
export const clienteSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .refine(
      (val) => !/[<>'"`;]/.test(val),
      'Nome contém caracteres inválidos'
    ),
  telefone: z.string()
    .trim()
    .min(8, 'Telefone deve ter pelo menos 8 dígitos')
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s\-\(\)]+$/, 'Telefone deve conter apenas números'),
  endereco: z.string()
    .trim()
    .min(5, 'Endereço deve ter pelo menos 5 caracteres')
    .max(500, 'Endereço deve ter no máximo 500 caracteres')
    .refine(
      (val) => !/[<>'"`;]/.test(val),
      'Endereço contém caracteres inválidos'
    ),
  cpf: z.string()
    .optional()
    .refine(
      (val) => !val || /^[\d\.\-\/]+$/.test(val),
      'CPF inválido'
    )
    .transform((val) => val?.replace(/[^\d]/g, '')),
  cnpj: z.string()
    .optional()
    .refine(
      (val) => !val || /^[\d\.\-\/]+$/.test(val),
      'CNPJ inválido'
    )
    .transform((val) => val?.replace(/[^\d]/g, '')),
});

// Schema para funcionários
export const funcionarioSchema = z.object({
  nome: z.string()
    .trim()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(255, 'Nome deve ter no máximo 255 caracteres')
    .refine(
      (val) => !/[<>'"`;]/.test(val),
      'Nome contém caracteres inválidos'
    ),
  usuario: z.string()
    .trim()
    .min(3, 'Usuário deve ter pelo menos 3 caracteres')
    .max(100, 'Usuário deve ter no máximo 100 caracteres')
    .regex(/^[a-zA-Z0-9_]+$/, 'Usuário deve conter apenas letras, números e underscore'),
  senha: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .refine(
      (val) => !val || /\d/.test(val),
      'Senha deve conter pelo menos um número'
    )
    .refine(
      (val) => !val || /[a-zA-Z]/.test(val),
      'Senha deve conter pelo menos uma letra'
    )
    .optional(),
  telefone: z.string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-\(\)]+$/.test(val),
      'Telefone inválido'
    ),
  pode_dar_desconto: z.boolean().default(false),
  pode_cobrar_taxa: z.boolean().default(false),
  pode_pagar_depois: z.boolean().default(false),
  is_admin: z.boolean().default(false),
});

// Schema para login
export const loginSchema = z.object({
  usuario: z.string()
    .trim()
    .min(1, 'Usuário é obrigatório')
    .max(100, 'Usuário muito longo'),
  senha: z.string()
    .min(1, 'Senha é obrigatória')
    .max(100, 'Senha muito longa'),
});

// Schema para recuperação de senha
export const resetPasswordRequestSchema = z.object({
  telefone: z.string()
    .trim()
    .min(8, 'Telefone deve ter pelo menos 8 dígitos')
    .max(20, 'Telefone muito longo')
    .regex(/^[\d\s\-\(\)]+$/, 'Telefone deve conter apenas números'),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, 'Token é obrigatório'),
  novaSenha: z.string()
    .min(8, 'Senha deve ter pelo menos 8 caracteres')
    .max(100, 'Senha deve ter no máximo 100 caracteres')
    .refine(
      (val) => /\d/.test(val),
      'Senha deve conter pelo menos um número'
    )
    .refine(
      (val) => /[a-zA-Z]/.test(val),
      'Senha deve conter pelo menos uma letra'
    ),
});

// Schema para pedidos
export const pedidoSchema = z.object({
  cliente_id: z.string().uuid('ID do cliente inválido'),
  itens: z.array(z.object({
    servico: z.object({
      id: z.string(),
      nome: z.string(),
      preco: z.number(),
      categoria: z.string(),
    }),
    quantidade: z.number().int().positive('Quantidade deve ser positiva'),
  })).min(1, 'Selecione pelo menos um serviço'),
  desconto_percentual: z.number().min(0).max(100).optional(),
  desconto_valor: z.number().min(0).optional(),
  taxa_entrega: z.number().min(0).optional(),
});

// Função para sanitizar strings antes de renderizar
export function sanitizeForDisplay(str: string | null | undefined): string {
  if (!str) return '';
  return str
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
}

// Função para validar e limpar input
export function validateInput<T>(schema: z.ZodSchema<T>, data: unknown): { success: true; data: T } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  
  if (result.success) {
    return { success: true, data: result.data };
  }
  
  const errors = result.error.errors.map((err) => err.message);
  return { success: false, errors };
}

export type ClienteInput = z.infer<typeof clienteSchema>;
export type FuncionarioInput = z.infer<typeof funcionarioSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type PedidoInput = z.infer<typeof pedidoSchema>;
