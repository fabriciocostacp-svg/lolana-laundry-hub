-- Create funcionarios (employees) table
CREATE TABLE public.funcionarios (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  usuario VARCHAR(100) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  telefone VARCHAR(20),
  -- Permissions
  pode_dar_desconto BOOLEAN NOT NULL DEFAULT false,
  pode_cobrar_taxa BOOLEAN NOT NULL DEFAULT false,
  pode_pagar_depois BOOLEAN NOT NULL DEFAULT false,
  is_admin BOOLEAN NOT NULL DEFAULT false,
  ativo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.funcionarios ENABLE ROW LEVEL SECURITY;

-- Create policies for funcionarios access
CREATE POLICY "Anyone can view funcionarios" 
ON public.funcionarios 
FOR SELECT 
USING (true);

CREATE POLICY "Anyone can insert funcionarios" 
ON public.funcionarios 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Anyone can update funcionarios" 
ON public.funcionarios 
FOR UPDATE 
USING (true);

CREATE POLICY "Anyone can delete funcionarios" 
ON public.funcionarios 
FOR DELETE 
USING (true);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_funcionarios_updated_at
BEFORE UPDATE ON public.funcionarios
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default admin user (lolana with password 1234)
INSERT INTO public.funcionarios (nome, usuario, senha, telefone, pode_dar_desconto, pode_cobrar_taxa, pode_pagar_depois, is_admin)
VALUES ('Administrador', 'lolana', '1234', '', true, true, true, true);