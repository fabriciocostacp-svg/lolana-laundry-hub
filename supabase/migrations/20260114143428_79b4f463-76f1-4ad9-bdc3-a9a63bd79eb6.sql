-- Adicionar campos pago e retirado na tabela pedidos
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS pago BOOLEAN DEFAULT false;
ALTER TABLE public.pedidos ADD COLUMN IF NOT EXISTS retirado BOOLEAN DEFAULT false;