import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { hashPassword } from '../_shared/crypto.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

async function validateSession(sessionToken: string | null): Promise<{ valid: boolean; funcionario?: any }> {
  if (!sessionToken) {
    return { valid: false };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const { data: session, error } = await supabase
    .from('sessions')
    .select('*, funcionarios(*)')
    .eq('token', sessionToken)
    .gt('expires_at', new Date().toISOString())
    .single();

  if (error || !session || !session.funcionarios) {
    return { valid: false };
  }

  return { valid: true, funcionario: session.funcionarios };
}

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const sessionToken = req.headers.get('x-session-token');
    const auth = await validateSession(sessionToken);

    if (!auth.valid || !auth.funcionario.is_admin) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado - requer privilégios de administrador' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('funcionarios')
        .select('id, nome, usuario, telefone, pode_dar_desconto, pode_cobrar_taxa, pode_pagar_depois, is_admin, ativo, created_at, updated_at')
        .eq('ativo', true)
        .order('nome', { ascending: true });

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      
      // Validate required fields
      if (!body.nome || !body.usuario || !body.senha) {
        return new Response(
          JSON.stringify({ error: 'Nome, usuário e senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if username already exists
      const { data: existing } = await supabase
        .from('funcionarios')
        .select('id')
        .eq('usuario', body.usuario)
        .single();

      if (existing) {
        return new Response(
          JSON.stringify({ error: 'Usuário já existe' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(body.senha);

      const { data, error } = await supabase
        .from('funcionarios')
        .insert([{
          nome: String(body.nome).trim().slice(0, 255),
          usuario: String(body.usuario).trim().slice(0, 100),
          senha: hashedPassword,
          telefone: body.telefone ? String(body.telefone).slice(0, 20) : null,
          pode_dar_desconto: Boolean(body.pode_dar_desconto),
          pode_cobrar_taxa: Boolean(body.pode_cobrar_taxa),
          pode_pagar_depois: Boolean(body.pode_pagar_depois),
          is_admin: Boolean(body.is_admin),
          ativo: true,
        }])
        .select('id, nome, usuario, telefone, pode_dar_desconto, pode_cobrar_taxa, pode_pagar_depois, is_admin')
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 201, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'PUT') {
      const body = await req.json();
      const { id, senha, ...updateData } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sanitizedData: any = {
        nome: String(updateData.nome).trim().slice(0, 255),
        usuario: String(updateData.usuario).trim().slice(0, 100),
        telefone: updateData.telefone ? String(updateData.telefone).slice(0, 20) : null,
        pode_dar_desconto: Boolean(updateData.pode_dar_desconto),
        pode_cobrar_taxa: Boolean(updateData.pode_cobrar_taxa),
        pode_pagar_depois: Boolean(updateData.pode_pagar_depois),
        is_admin: Boolean(updateData.is_admin),
      };

      // Only update password if provided
      if (senha) {
        sanitizedData.senha = await hashPassword(senha);
      }

      const { data, error } = await supabase
        .from('funcionarios')
        .update(sanitizedData)
        .eq('id', id)
        .select('id, nome, usuario, telefone, pode_dar_desconto, pode_cobrar_taxa, pode_pagar_depois, is_admin')
        .single();

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      return new Response(
        JSON.stringify({ data }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'DELETE') {
      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Soft delete - set ativo to false
      const { error } = await supabase
        .from('funcionarios')
        .update({ ativo: false })
        .eq('id', id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Invalidate all sessions for this user
      await supabase.from('sessions').delete().eq('funcionario_id', id);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Método não permitido' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Admin API error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
