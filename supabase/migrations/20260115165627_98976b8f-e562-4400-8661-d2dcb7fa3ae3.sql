-- =====================================================
-- SECURITY MIGRATION: Corrigir vulnerabilidades críticas
-- =====================================================

-- 1. CRIAR TABELA DE SESSÕES
CREATE TABLE IF NOT EXISTS public.sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON public.sessions(expires_at);

-- 2. CRIAR TABELA DE TOKENS DE RESET DE SENHA
CREATE TABLE IF NOT EXISTS public.password_resets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  funcionario_id UUID NOT NULL REFERENCES public.funcionarios(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Índice para busca rápida por token
CREATE INDEX IF NOT EXISTS idx_password_resets_token ON public.password_resets(token);

-- 3. HABILITAR RLS NAS NOVAS TABELAS
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_resets ENABLE ROW LEVEL SECURITY;

-- 4. REMOVER POLÍTICAS PERMISSIVAS ANTIGAS - CLIENTES
DROP POLICY IF EXISTS "Permitir atualização de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir exclusão de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir inserção de clientes" ON public.clientes;
DROP POLICY IF EXISTS "Permitir leitura de clientes" ON public.clientes;

-- 5. REMOVER POLÍTICAS PERMISSIVAS ANTIGAS - FUNCIONARIOS
DROP POLICY IF EXISTS "Anyone can delete funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Anyone can insert funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Anyone can update funcionarios" ON public.funcionarios;
DROP POLICY IF EXISTS "Anyone can view funcionarios" ON public.funcionarios;

-- 6. REMOVER POLÍTICAS PERMISSIVAS ANTIGAS - PEDIDOS
DROP POLICY IF EXISTS "Permitir atualização de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir exclusão de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir inserção de pedidos" ON public.pedidos;
DROP POLICY IF EXISTS "Permitir leitura de pedidos" ON public.pedidos;

-- 7. CRIAR NOVAS POLÍTICAS RESTRITIVAS - CLIENTES
-- Apenas service_role pode acessar (via Edge Functions)
CREATE POLICY "Service role only - clientes SELECT" ON public.clientes
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role only - clientes INSERT" ON public.clientes
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role only - clientes UPDATE" ON public.clientes
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role only - clientes DELETE" ON public.clientes
  FOR DELETE TO service_role USING (true);

-- 8. CRIAR NOVAS POLÍTICAS RESTRITIVAS - FUNCIONARIOS
CREATE POLICY "Service role only - funcionarios SELECT" ON public.funcionarios
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role only - funcionarios INSERT" ON public.funcionarios
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role only - funcionarios UPDATE" ON public.funcionarios
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role only - funcionarios DELETE" ON public.funcionarios
  FOR DELETE TO service_role USING (true);

-- 9. CRIAR NOVAS POLÍTICAS RESTRITIVAS - PEDIDOS
CREATE POLICY "Service role only - pedidos SELECT" ON public.pedidos
  FOR SELECT TO service_role USING (true);

CREATE POLICY "Service role only - pedidos INSERT" ON public.pedidos
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Service role only - pedidos UPDATE" ON public.pedidos
  FOR UPDATE TO service_role USING (true);

CREATE POLICY "Service role only - pedidos DELETE" ON public.pedidos
  FOR DELETE TO service_role USING (true);

-- 10. CRIAR POLÍTICAS PARA SESSIONS E PASSWORD_RESETS
-- Apenas service_role pode gerenciar sessões
CREATE POLICY "Service role only - sessions ALL" ON public.sessions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "Service role only - password_resets ALL" ON public.password_resets
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 11. FUNÇÃO PARA LIMPAR SESSÕES EXPIRADAS (cleanup automático)
CREATE OR REPLACE FUNCTION public.cleanup_expired_sessions()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  DELETE FROM public.sessions WHERE expires_at < NOW();
  DELETE FROM public.password_resets WHERE expires_at < NOW() OR used = true;
END;
$$;

-- 12. CORRIGIR search_path DAS FUNÇÕES EXISTENTES
-- Atualizar a função update_updated_at_column para incluir search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Atualizar generate_cliente_numero para incluir search_path
CREATE OR REPLACE FUNCTION public.generate_cliente_numero()
RETURNS TRIGGER AS $$
DECLARE
  max_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 INTO max_numero FROM clientes WHERE numero ~ '^[0-9]+$';
  NEW.numero := LPAD(max_numero::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Atualizar generate_pedido_numero para incluir search_path
CREATE OR REPLACE FUNCTION public.generate_pedido_numero()
RETURNS TRIGGER AS $$
DECLARE
  max_numero INTEGER;
BEGIN
  SELECT COALESCE(MAX(CAST(numero AS INTEGER)), 0) + 1 INTO max_numero FROM pedidos WHERE numero ~ '^[0-9]+$';
  NEW.numero := LPAD(max_numero::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;