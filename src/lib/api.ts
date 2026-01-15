const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

interface ApiOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  body?: unknown;
  sessionToken?: string | null;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function callEdgeFunction<T>(
  functionName: string,
  options: ApiOptions = {},
  queryParams?: Record<string, string>
): Promise<T> {
  const { method = 'GET', body, sessionToken } = options;
  
  let url = `${SUPABASE_URL}/functions/v1/${functionName}`;
  
  if (queryParams) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  
  if (sessionToken) {
    headers['x-session-token'] = sessionToken;
  }
  
  const response = await fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new ApiError(data.error || 'Erro na requisição', response.status);
  }
  
  return data;
}

// Auth APIs
export interface LoginResponse {
  user: {
    id: string;
    nome: string;
    usuario: string;
    telefone: string | null;
    permissions: {
      pode_dar_desconto: boolean;
      pode_cobrar_taxa: boolean;
      pode_pagar_depois: boolean;
      is_admin: boolean;
    };
  };
  sessionToken: string;
  expiresAt: string;
}

export async function apiLogin(usuario: string, senha: string): Promise<LoginResponse> {
  return callEdgeFunction<LoginResponse>('auth-login', {
    method: 'POST',
    body: { usuario, senha },
  });
}

export async function apiLogout(sessionToken: string): Promise<void> {
  await callEdgeFunction('auth-logout', {
    method: 'POST',
    sessionToken,
  });
}

export async function apiValidateSession(sessionToken: string): Promise<{ valid: boolean; user?: LoginResponse['user'] }> {
  return callEdgeFunction('auth-validate', {
    method: 'POST',
    sessionToken,
  });
}

export interface ResetPasswordRequestResponse {
  success: boolean;
  message: string;
  resetToken: string;
  usuario: string;
  nome: string;
}

export async function apiRequestPasswordReset(telefone: string): Promise<ResetPasswordRequestResponse> {
  return callEdgeFunction<ResetPasswordRequestResponse>('auth-reset-password', {
    method: 'POST',
    body: { action: 'request', telefone },
  });
}

export async function apiResetPassword(token: string, novaSenha: string): Promise<{ success: boolean; message: string }> {
  return callEdgeFunction('auth-reset-password', {
    method: 'POST',
    body: { action: 'reset', token, novaSenha },
  });
}

// Data APIs
export async function apiGetData<T>(
  table: 'clientes' | 'pedidos',
  sessionToken: string,
  id?: string
): Promise<{ data: T }> {
  const queryParams: Record<string, string> = { table };
  if (id) queryParams.id = id;
  
  return callEdgeFunction<{ data: T }>('secure-api', {
    method: 'GET',
    sessionToken,
  }, queryParams);
}

export async function apiCreateData<T>(
  table: 'clientes' | 'pedidos',
  sessionToken: string,
  data: Record<string, unknown>
): Promise<{ data: T }> {
  return callEdgeFunction<{ data: T }>('secure-api', {
    method: 'POST',
    sessionToken,
    body: data,
  }, { table });
}

export async function apiUpdateData<T>(
  table: 'clientes' | 'pedidos',
  sessionToken: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ data: T }> {
  return callEdgeFunction<{ data: T }>('secure-api', {
    method: 'PUT',
    sessionToken,
    body: { id, ...data },
  }, { table });
}

export async function apiDeleteData(
  table: 'clientes' | 'pedidos',
  sessionToken: string,
  id: string
): Promise<{ success: boolean }> {
  return callEdgeFunction<{ success: boolean }>('secure-api', {
    method: 'DELETE',
    sessionToken,
  }, { table, id });
}

// Admin APIs (Funcionarios)
export async function apiGetFuncionarios<T>(sessionToken: string): Promise<{ data: T }> {
  return callEdgeFunction<{ data: T }>('admin-funcionarios', {
    method: 'GET',
    sessionToken,
  });
}

export async function apiCreateFuncionario<T>(
  sessionToken: string,
  data: Record<string, unknown>
): Promise<{ data: T }> {
  return callEdgeFunction<{ data: T }>('admin-funcionarios', {
    method: 'POST',
    sessionToken,
    body: data,
  });
}

export async function apiUpdateFuncionario<T>(
  sessionToken: string,
  id: string,
  data: Record<string, unknown>
): Promise<{ data: T }> {
  return callEdgeFunction<{ data: T }>('admin-funcionarios', {
    method: 'PUT',
    sessionToken,
    body: { id, ...data },
  });
}

export async function apiDeleteFuncionario(
  sessionToken: string,
  id: string
): Promise<{ success: boolean }> {
  return callEdgeFunction<{ success: boolean }>('admin-funcionarios', {
    method: 'DELETE',
    sessionToken,
  }, { id });
}
