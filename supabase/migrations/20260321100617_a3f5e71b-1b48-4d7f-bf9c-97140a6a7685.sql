
-- Criar tabela de serviços
CREATE TABLE public.servicos (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome text NOT NULL,
  categoria text NOT NULL,
  preco numeric NOT NULL DEFAULT 0,
  ativo boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;

-- Block anon
CREATE POLICY "Block anon access - servicos"
  ON public.servicos FOR ALL TO anon
  USING (false) WITH CHECK (false);

-- Service role full access
CREATE POLICY "Service role only - servicos SELECT"
  ON public.servicos FOR SELECT TO service_role
  USING (true);

CREATE POLICY "Service role only - servicos INSERT"
  ON public.servicos FOR INSERT TO service_role
  WITH CHECK (true);

CREATE POLICY "Service role only - servicos UPDATE"
  ON public.servicos FOR UPDATE TO service_role
  USING (true);

CREATE POLICY "Service role only - servicos DELETE"
  ON public.servicos FOR DELETE TO service_role
  USING (true);

-- Trigger updated_at
CREATE TRIGGER update_servicos_updated_at
  BEFORE UPDATE ON public.servicos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Inserir serviços existentes
INSERT INTO public.servicos (nome, categoria, preco) VALUES
  ('Por Kg', 'Serviços por KG', 26.00),
  ('Kg lavada e passada', 'Serviços por KG', 22.00),
  ('Kg lavar ou passar', 'Serviços por KG', 22.00),
  ('Edredom solteiro', 'Peças de Cama', 30.00),
  ('Edredom casal', 'Peças de Cama', 42.00),
  ('Coberdrom', 'Peças de Cama', 50.00),
  ('Camisa manga longa (lavar e passar)', 'Camisas', 17.00),
  ('Camisa manga longa (passar)', 'Camisas', 15.00),
  ('Camisa manga curta (lavar e passar)', 'Camisas', 15.00),
  ('Camisa manga curta (passar)', 'Camisas', 12.00),
  ('Vestido de festa (a partir de)', 'Vestido', 40.00),
  ('Calça', 'Valor Unitário', 10.00),
  ('Camiseta', 'Valor Unitário', 8.00),
  ('Short', 'Valor Unitário', 6.00),
  ('Paletó', 'Valor Unitário', 30.00),
  ('Terno completo', 'Valor Unitário', 70.00);
