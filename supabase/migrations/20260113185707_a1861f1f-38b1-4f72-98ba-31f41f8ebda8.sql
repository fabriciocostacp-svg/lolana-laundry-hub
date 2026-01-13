-- Tabela de clientes
CREATE TABLE public.clientes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  nome TEXT NOT NULL,
  telefone TEXT NOT NULL,
  endereco TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Tabela de pedidos
CREATE TABLE public.pedidos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  numero TEXT NOT NULL UNIQUE,
  cliente_id UUID NOT NULL REFERENCES public.clientes(id) ON DELETE CASCADE,
  cliente_nome TEXT NOT NULL,
  cliente_telefone TEXT NOT NULL,
  valor_total DECIMAL(10,2) NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'lavando' CHECK (status IN ('lavando', 'passando', 'secando', 'pronto')),
  itens JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Sequência para números dos clientes
CREATE SEQUENCE public.clientes_numero_seq START 1;

-- Sequência para números dos pedidos
CREATE SEQUENCE public.pedidos_numero_seq START 1;

-- Função para gerar número formatado do cliente (001, 002, etc)
CREATE OR REPLACE FUNCTION public.generate_cliente_numero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := LPAD(nextval('public.clientes_numero_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Função para gerar número formatado do pedido
CREATE OR REPLACE FUNCTION public.generate_pedido_numero()
RETURNS TRIGGER AS $$
BEGIN
  NEW.numero := LPAD(nextval('public.pedidos_numero_seq')::TEXT, 3, '0');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auto-gerar número do cliente
CREATE TRIGGER set_cliente_numero
  BEFORE INSERT ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_cliente_numero();

-- Trigger para auto-gerar número do pedido
CREATE TRIGGER set_pedido_numero
  BEFORE INSERT ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_pedido_numero();

-- Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_clientes_updated_at
  BEFORE UPDATE ON public.clientes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pedidos_updated_at
  BEFORE UPDATE ON public.pedidos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS (acesso público para sistema interno de lavanderia)
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso público (sistema interno sem autenticação)
CREATE POLICY "Permitir leitura de clientes" ON public.clientes FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de clientes" ON public.clientes FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de clientes" ON public.clientes FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de clientes" ON public.clientes FOR DELETE USING (true);

CREATE POLICY "Permitir leitura de pedidos" ON public.pedidos FOR SELECT USING (true);
CREATE POLICY "Permitir inserção de pedidos" ON public.pedidos FOR INSERT WITH CHECK (true);
CREATE POLICY "Permitir atualização de pedidos" ON public.pedidos FOR UPDATE USING (true);
CREATE POLICY "Permitir exclusão de pedidos" ON public.pedidos FOR DELETE USING (true);