import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { generateResetToken, hashPassword, validatePasswordStrength } from '../_shared/crypto.ts';
import { checkRateLimit, recordLoginAttempt, getClientIP } from '../_shared/rate-limit.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

Deno.serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { telefone, token, novaSenha, action } = await req.json();
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const clientIP = getClientIP(req);

    if (action === 'request') {
      // Request password reset
      if (!telefone) {
        return new Response(
          JSON.stringify({ error: 'Telefone é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const sanitizedTelefone = telefone.trim().slice(0, 20);

      // Check rate limit for phone number
      const phoneRateLimit = await checkRateLimit(sanitizedTelefone, 'phone', 'resetPassword', clientIP);
      if (!phoneRateLimit.allowed) {
        console.warn(`Rate limit exceeded for reset password: ${sanitizedTelefone} from IP: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas solicitações de redefinição. Tente novamente em ${phoneRateLimit.retryAfterMinutes} minutos.` 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check rate limit for IP
      const ipRateLimit = await checkRateLimit(clientIP, 'ip', 'resetPassword');
      if (!ipRateLimit.allowed) {
        console.warn(`Rate limit exceeded for IP on reset password: ${clientIP}`);
        return new Response(
          JSON.stringify({ 
            error: `Muitas solicitações deste endereço. Tente novamente em ${ipRateLimit.retryAfterMinutes} minutos.` 
          }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data: funcionario, error } = await supabase
        .from('funcionarios')
        .select('id, nome, usuario')
        .eq('telefone', sanitizedTelefone)
        .eq('ativo', true)
        .single();

      if (error || !funcionario) {
        // Record the attempt even for non-existent phones
        await recordLoginAttempt(sanitizedTelefone, 'phone', false, clientIP);
        
        return new Response(
          JSON.stringify({ error: 'Telefone não encontrado' }),
          { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record successful lookup
      await recordLoginAttempt(sanitizedTelefone, 'phone', true, clientIP);

      // Generate reset token
      const resetToken = generateResetToken();
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

      // Store reset token
      await supabase.from('password_resets').insert({
        funcionario_id: funcionario.id,
        token: resetToken,
        expires_at: expiresAt.toISOString(),
      });

      // In a real app, you would send this token via SMS or email
      // For now, we return it directly (only the token, not the password!)
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Token de redefinição gerado',
          resetToken, // In production, send via SMS
          usuario: funcionario.usuario,
          nome: funcionario.nome,
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } 
    
    if (action === 'reset') {
      // Reset password with token
      if (!token || !novaSenha) {
        return new Response(
          JSON.stringify({ error: 'Token e nova senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(novaSenha);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ error: passwordValidation.message }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Find valid reset token
      const { data: resetData, error: resetError } = await supabase
        .from('password_resets')
        .select('funcionario_id')
        .eq('token', token)
        .eq('used', false)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (resetError || !resetData) {
        return new Response(
          JSON.stringify({ error: 'Token inválido ou expirado' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Hash new password with bcrypt
      const hashedPassword = await hashPassword(novaSenha);

      // Update password
      await supabase
        .from('funcionarios')
        .update({ senha: hashedPassword })
        .eq('id', resetData.funcionario_id);

      // Mark token as used
      await supabase
        .from('password_resets')
        .update({ used: true })
        .eq('token', token);

      // Invalidate all sessions for this user
      await supabase
        .from('sessions')
        .delete()
        .eq('funcionario_id', resetData.funcionario_id);

      return new Response(
        JSON.stringify({ success: true, message: 'Senha alterada com sucesso' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err) {
    console.error('Reset password error:', err);
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
