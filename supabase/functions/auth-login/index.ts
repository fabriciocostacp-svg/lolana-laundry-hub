import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { verifyPassword, generateSessionToken, hashPassword } from '../_shared/crypto.ts';
import { checkRateLimit, recordLoginAttempt, clearLoginAttempts, getClientIP } from '../_shared/rate-limit.ts';

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
    const clientIP = getClientIP(req);

    // Check rate limit for username
    const userRateLimit = await checkRateLimit(sanitizedUsuario, 'username', 'login', clientIP);
    if (!userRateLimit.allowed) {
      console.warn(`Rate limit exceeded for user: ${sanitizedUsuario} from IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: `Muitas tentativas de login. Tente novamente em ${userRateLimit.retryAfterMinutes} minutos.` 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit for IP
    const ipRateLimit = await checkRateLimit(clientIP, 'ip', 'login');
    if (!ipRateLimit.allowed) {
      console.warn(`Rate limit exceeded for IP: ${clientIP}`);
      return new Response(
        JSON.stringify({ 
          error: `Muitas tentativas de login deste endereço. Tente novamente em ${ipRateLimit.retryAfterMinutes} minutos.` 
        }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the funcionario
    const { data: funcionario, error } = await supabase
      .from('funcionarios')
      .select('*')
      .eq('usuario', sanitizedUsuario)
      .eq('ativo', true)
      .single();

    if (error || !funcionario) {
      // Record failed attempt
      await recordLoginAttempt(sanitizedUsuario, 'username', false, clientIP);
      await recordLoginAttempt(clientIP, 'ip', false);
      
      return new Response(
        JSON.stringify({ error: 'Usuário ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // SECURITY: Check if password is using legacy format (not bcrypt)
    if (!funcionario.senha.startsWith('$2')) {
      console.warn(`User ${funcionario.usuario} has legacy password format - access denied. Please reset password.`);
      await recordLoginAttempt(sanitizedUsuario, 'username', false, clientIP);
      
      return new Response(
        JSON.stringify({ error: 'Sua senha precisa ser redefinida por motivos de segurança. Use a opção "Esqueci minha senha".' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify password (only bcrypt accepted now)
    const isValid = await verifyPassword(sanitizedSenha, funcionario.senha);
    if (!isValid) {
      // Record failed attempt
      await recordLoginAttempt(sanitizedUsuario, 'username', false, clientIP);
      await recordLoginAttempt(clientIP, 'ip', false);
      
      return new Response(
        JSON.stringify({ error: 'Usuário ou senha incorretos' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clear failed attempts on successful login
    await clearLoginAttempts(sanitizedUsuario, 'username');
    await clearLoginAttempts(clientIP, 'ip');
    await recordLoginAttempt(sanitizedUsuario, 'username', true, clientIP);

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Store session
    await supabase.from('sessions').insert({
      funcionario_id: funcionario.id,
      token: sessionToken,
      expires_at: expiresAt.toISOString(),
    });

    // Return user data (without password or sensitive info)
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
