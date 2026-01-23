import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { hashPassword, validatePasswordStrength } from '../_shared/crypto.ts';

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

// RBAC: Check if user can view/modify another user's data
function canAccessFuncionarioData(
  requester: any, 
  targetId: string | null, 
  action: 'view' | 'modify'
): boolean {
  // Admins can access all data
  if (requester.is_admin) {
    return true;
  }
  
  // Non-admins can only view/modify their own data
  if (targetId && requester.id === targetId) {
    return true;
  }
  
  return false;
}

// Mask sensitive data for non-admin users viewing other employees
function maskFuncionarioData(data: any, requesterId: string, isAdmin: boolean): any {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => maskFuncionarioData(item, requesterId, isAdmin));
  }

  // Clone to avoid mutation
  const result = { ...data };
  
  // Non-admins can see limited data about other employees
  if (!isAdmin && result.id !== requesterId) {
    // Only show name and basic info, hide sensitive data
    return {
      id: result.id,
      nome: result.nome,
      usuario: result.usuario,
      // Hide phone for other employees (privacy)
      telefone: null,
      // Hide permissions (security)
      pode_dar_desconto: undefined,
      pode_cobrar_taxa: undefined,
      pode_pagar_depois: undefined,
      is_admin: undefined,
    };
  }
  
  return result;
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

    const isAdmin = auth.funcionario.is_admin === true;
    const requesterId = auth.funcionario.id;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    if (req.method === 'GET') {
      // RBAC: Only admins can list all employees
      if (!isAdmin) {
        // Non-admins can only see their own data
        const { data, error } = await supabase
          .from('funcionarios')
          .select('id, nome, usuario, telefone, pode_dar_desconto, pode_cobrar_taxa, pode_pagar_depois, is_admin')
          .eq('id', requesterId)
          .eq('ativo', true)
          .single();

        if (error) {
          return new Response(
            JSON.stringify({ error: error.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        return new Response(
          JSON.stringify({ data: [data] }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

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
      // RBAC: Only admins can create new employees
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado - requer privilégios de administrador' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const body = await req.json();
      
      // Validate required fields
      if (!body.nome || !body.usuario || !body.senha) {
        return new Response(
          JSON.stringify({ error: 'Nome, usuário e senha são obrigatórios' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(body.senha);
      if (!passwordValidation.valid) {
        return new Response(
          JSON.stringify({ error: passwordValidation.message }),
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

      // Hash password with bcrypt
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

      // RBAC: Check if user can modify this employee
      if (!canAccessFuncionarioData(auth.funcionario, id, 'modify')) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado - você não pode modificar dados de outros funcionários' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Non-admins can only update their own password and phone
      const sanitizedData: any = {};
      
      if (isAdmin) {
        // Admins can update everything
        sanitizedData.nome = String(updateData.nome).trim().slice(0, 255);
        sanitizedData.usuario = String(updateData.usuario).trim().slice(0, 100);
        sanitizedData.telefone = updateData.telefone ? String(updateData.telefone).slice(0, 20) : null;
        sanitizedData.pode_dar_desconto = Boolean(updateData.pode_dar_desconto);
        sanitizedData.pode_cobrar_taxa = Boolean(updateData.pode_cobrar_taxa);
        sanitizedData.pode_pagar_depois = Boolean(updateData.pode_pagar_depois);
        sanitizedData.is_admin = Boolean(updateData.is_admin);
      } else {
        // Non-admins can only update phone
        if (updateData.telefone !== undefined) {
          sanitizedData.telefone = updateData.telefone ? String(updateData.telefone).slice(0, 20) : null;
        }
      }

      // Password update (for both admin and self)
      if (senha) {
        // Validate password strength
        const passwordValidation = validatePasswordStrength(senha);
        if (!passwordValidation.valid) {
          return new Response(
            JSON.stringify({ error: passwordValidation.message }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
        sanitizedData.senha = await hashPassword(senha);
      }

      // Ensure we have something to update
      if (Object.keys(sanitizedData).length === 0) {
        return new Response(
          JSON.stringify({ error: 'Nenhum dado para atualizar' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
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
      // RBAC: Only admins can delete employees
      if (!isAdmin) {
        return new Response(
          JSON.stringify({ error: 'Não autorizado - requer privilégios de administrador' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const url = new URL(req.url);
      const id = url.searchParams.get('id');

      if (!id) {
        return new Response(
          JSON.stringify({ error: 'ID é obrigatório' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Prevent admin from deleting themselves
      if (id === requesterId) {
        return new Response(
          JSON.stringify({ error: 'Você não pode excluir sua própria conta' }),
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
