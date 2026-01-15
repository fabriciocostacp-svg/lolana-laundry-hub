import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyPassword, generateSessionToken, hashPassword } from '../_shared/crypto.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { usuario, senha } = await req.json();

    if (!usuario || !senha) {
      return new Response(
        JSON.stringify({ error: 'Usuário e senha são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Sanitize input
    const sanitizedUsuario = usuario.trim().slice(0, 100);
    const sanitizedSenha = senha.slice(0, 100);

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the funcionario
    const { data: funcionario, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('usuario', sanitizedUsuario)
      .eq('ativo', true)
      .single();

    if (error || !funcionario) {
      return new Response(
        JSON.stringify({ error: 'Usuário ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password
    const isValid = await verifyPassword(sanitizedSenha, funcionario.senha);
    if (!isValid) {
      return new Response(
        JSON.stringify({ error: 'Usuário ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If password is legacy (plain text), upgrade it
    if (!funcionario.senha.includes(':')) {
      const hashedPassword = await hashPassword(sanitizedSenha);
      await supabase
        .from('funcionarios')
        .update({ senha: hashedPassword })
        .eq('id', funcionario.id);
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session
    await supabase.from('sessions').insert({
      funcionario_id: funcionario.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    // Return user data (without password)
    const userData = {
      id: funcionario.id,
      nome: funcionario.nome,
      usuario: funcionario.usuario,
      telefone: funcionario.telefone,
      permissions: {
        pode_dar_desconto: funcionario.pode_dar_desconto,
        pode_cobrar_taxa: funcionario.pode_cobrar_taxa,
        pode_pagar_depois: funcionario.pode_pagar_depois,
        is_admin: funcionario.is_admin,
      },
    };

    return new Response(
      JSON.stringify({ 
        user: userData, 
        sessionToken,
        expiresAt: expiresAt.toISOString()
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Login error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
