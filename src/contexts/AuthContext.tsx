import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { apiLogin, apiLogout, apiValidateSession, LoginResponse } from "@/lib/api";
import { isValidSessionToken, clearAllSessionData, safeError } from "@/lib/security-utils";

export interface FuncionarioPermissions {
  pode_dar_desconto: boolean;
  pode_cobrar_taxa: boolean;
  pode_pagar_depois: boolean;
  is_admin: boolean;
}

export interface CurrentUser {
  id: string;
  nome: string;
  usuario: string;
  telefone: string | null;
  permissions: FuncionarioPermissions;
}

interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  currentUser: CurrentUser | null;
  sessionToken: string | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const SESSION_KEY = "lolana_session";
const USER_KEY = "lolana_user";
const EXPIRES_KEY = "lolana_expires";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  // Secure session clearing - removes all sensitive data
  const clearSession = useCallback(() => {
    clearAllSessionData();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSessionToken(null);
  }, []);

  // Validate session on mount - with strict token validation
  useEffect(() => {
    const validateStoredSession = async () => {
      const storedToken = localStorage.getItem(SESSION_KEY);
      const storedExpires = localStorage.getItem(EXPIRES_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      // SECURITY: Validate token format before using
      if (!storedToken || !storedExpires || !storedUser || !isValidSessionToken(storedToken)) {
        clearSession();
        setIsLoading(false);
        return;
      }

      // Check if session is expired locally first
      if (new Date(storedExpires) < new Date()) {
        clearSession();
        setIsLoading(false);
        return;
      }

      try {
        // SECURITY: Always validate session with server
        const result = await apiValidateSession(storedToken);
        
        if (result.valid && result.user) {
          // SECURITY: Use server-provided user data, not local storage
          setIsAuthenticated(true);
          setCurrentUser(result.user);
          setSessionToken(storedToken);
          
          // Update local storage with fresh server data
          localStorage.setItem(USER_KEY, JSON.stringify(result.user));
        } else {
          // Server rejected the session - clear everything
          clearSession();
        }
      } catch (error) {
        safeError("Session validation failed", error);
        // SECURITY: On network error, don't use cached data - require re-login
        // This prevents using stale/potentially compromised sessions
        clearSession();
      }
      
      setIsLoading(false);
    };

    validateStoredSession();
  }, [clearSession]);

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    try {
      const response: LoginResponse = await apiLogin(username, password);
      
      // SECURITY: Validate response has all required fields
      if (!response.sessionToken || !response.user || !response.expiresAt) {
        safeError("Invalid login response structure");
        return false;
      }

      // SECURITY: Validate session token format
      if (!isValidSessionToken(response.sessionToken)) {
        safeError("Invalid session token format received");
        return false;
      }
      
      // Store session data
      localStorage.setItem(SESSION_KEY, response.sessionToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      localStorage.setItem(EXPIRES_KEY, response.expiresAt);
      
      setIsAuthenticated(true);
      setCurrentUser(response.user);
      setSessionToken(response.sessionToken);
      
      return true;
    } catch (error) {
      safeError("Login failed", error);
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    const token = sessionToken;
    
    // Clear local state immediately for security
    clearSession();
    
    // Then notify server (best effort)
    if (token) {
      try {
        await apiLogout(token);
      } catch {
        // Ignore logout errors - local session is already cleared
      }
    }
  }, [sessionToken, clearSession]);

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      isLoading,
      currentUser, 
      sessionToken,
      login, 
      logout 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
