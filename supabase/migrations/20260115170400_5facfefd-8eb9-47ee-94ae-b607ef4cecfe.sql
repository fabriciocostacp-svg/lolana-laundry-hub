-- Bloquear acesso anon a todas as tabelas
-- Criar políticas que bloqueiam acesso anon explicitamente

-- CLIENTES - bloquear anon
CREATE POLICY "Block anon access - clientes" ON public.clientes
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- FUNCIONARIOS - bloquear anon
CREATE POLICY "Block anon access - funcionarios" ON public.funcionarios
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- PEDIDOS - bloquear anon
CREATE POLICY "Block anon access - pedidos" ON public.pedidos
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- SESSIONS - bloquear anon
CREATE POLICY "Block anon access - sessions" ON public.sessions
  FOR ALL TO anon USING (false) WITH CHECK (false);

-- PASSWORD_RESETS - bloquear anon
CREATE POLICY "Block anon access - password_resets" ON public.password_resets
  FOR ALL TO anon USING (false) WITH CHECK (false);