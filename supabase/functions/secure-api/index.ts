import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

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

    if (!auth.valid) {
      return new Response(
        JSON.stringify({ error: 'Não autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const url = new URL(req.url);
    const table = url.searchParams.get('table');

    if (!table || !['clientes', 'pedidos'].includes(table)) {
      return new Response(
        JSON.stringify({ error: 'Tabela inválida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'GET') {
      const id = url.searchParams.get('id');
      
      let data, error;
      
      if (id) {
        const result = await supabase.from(table).select('*').eq('id', id).single();
        data = result.data;
        error = result.error;
      } else {
        if (table === 'clientes') {
          const result = await supabase.from(table).select('*').order('numero', { ascending: true });
          data = result.data;
          error = result.error;
        } else {
          const result = await supabase.from(table).select('*').order('created_at', { ascending: false });
          data = result.data;
          error = result.error;
        }
      }

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
      
      // Sanitize and validate input
      const sanitizedData = sanitizeInput(body, table);
      
      const { data, error } = await supabase
        .from(table)
        .insert([sanitizedData])
        .select()
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
      const { id, ...updateData } = body;

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sanitizedData = sanitizeInput(updateData, table);

      const { data, error } = await supabase
        .from(table)
        .update(sanitizedData)
        .eq('id', id)
        .select()
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

      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) {
        return new Response(
          JSON.stringify({ error: error.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
    console.error('API error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function sanitizeInput(data: any, table: string): any {
  const sanitized: any = {};

  if (table === 'clientes') {
    if (data.nome) sanitized.nome = String(data.nome).trim().slice(0, 255);
    if (data.telefone) sanitized.telefone = String(data.telefone).replace(/[^\d\s\-\(\)]/g, '').slice(0, 20);
    if (data.endereco) sanitized.endereco = String(data.endereco).trim().slice(0, 500);
    if (data.cpf) sanitized.cpf = String(data.cpf).replace(/[^\d]/g, '').slice(0, 11);
    if (data.cnpj) sanitized.cnpj = String(data.cnpj).replace(/[^\d]/g, '').slice(0, 14);
    if (data.numero !== undefined) sanitized.numero = String(data.numero).slice(0, 10);
  }

  if (table === 'pedidos') {
    if (data.cliente_id) sanitized.cliente_id = String(data.cliente_id);
    if (data.cliente_nome) sanitized.cliente_nome = String(data.cliente_nome).trim().slice(0, 255);
    if (data.cliente_telefone) sanitized.cliente_telefone = String(data.cliente_telefone).replace(/[^\d\s\-\(\)]/g, '').slice(0, 20);
    if (data.cliente_cpf) sanitized.cliente_cpf = String(data.cliente_cpf).replace(/[^\d]/g, '').slice(0, 11);
    if (data.cliente_cnpj) sanitized.cliente_cnpj = String(data.cliente_cnpj).replace(/[^\d]/g, '').slice(0, 14);
    if (data.numero !== undefined) sanitized.numero = String(data.numero).slice(0, 10);
    if (data.status) sanitized.status = ['lavando', 'passando', 'pronto'].includes(data.status) ? data.status : 'lavando';
    if (data.valor_total !== undefined) sanitized.valor_total = Math.max(0, Number(data.valor_total) || 0);
    if (data.desconto_percentual !== undefined) sanitized.desconto_percentual = Math.max(0, Math.min(100, Number(data.desconto_percentual) || 0));
    if (data.desconto_valor !== undefined) sanitized.desconto_valor = Math.max(0, Number(data.desconto_valor) || 0);
    if (data.taxa_entrega !== undefined) sanitized.taxa_entrega = Math.max(0, Number(data.taxa_entrega) || 0);
    if (data.pago !== undefined) sanitized.pago = Boolean(data.pago);
    if (data.retirado !== undefined) sanitized.retirado = Boolean(data.retirado);
    if (data.itens) sanitized.itens = Array.isArray(data.itens) ? data.itens : [];
  }

  return sanitized;
}
