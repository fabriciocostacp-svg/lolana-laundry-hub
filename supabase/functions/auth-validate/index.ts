import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export async function validateSession(sessionToken: string | null): Promise<{ valid: boolean; funcionario?: any }> {
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
    const result = await validateSession(sessionToken);

    if (!result.valid) {
      return new Response(
        JSON.stringify({ valid: false }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userData = {
      id: result.funcionario.id,
      nome: result.funcionario.nome,
      usuario: result.funcionario.usuario,
      telefone: result.funcionario.telefone,
      permissions: {
        pode_dar_desconto: result.funcionario.pode_dar_desconto,
        pode_cobrar_taxa: result.funcionario.pode_cobrar_taxa,
        pode_pagar_depois: result.funcionario.pode_pagar_depois,
        is_admin: result.funcionario.is_admin,
      },
    };

    return new Response(
      JSON.stringify({ valid: true, user: userData }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Validation error:', err);
    return new Response(
      JSON.stringify({ valid: false }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
