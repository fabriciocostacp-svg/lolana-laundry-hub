-- Adicionar campos CPF e CNPJ na tabela clientes (opcionais)
ALTER TABLE public.clientes 
ADD COLUMN IF NOT EXISTS cpf TEXT,
ADD COLUMN IF NOT EXISTS cnpj TEXT;

-- Adicionar campos de desconto e taxa de entrega na tabela pedidos
ALTER TABLE public.pedidos 
ADD COLUMN IF NOT EXISTS desconto_percentual NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS desconto_valor NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS taxa_entrega NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS cliente_cpf TEXT,
ADD COLUMN IF NOT EXISTS cliente_cnpj TEXT;