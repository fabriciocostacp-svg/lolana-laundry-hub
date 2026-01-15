import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { apiLogin, apiLogout, apiValidateSession, LoginResponse } from "@/lib/api";

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

  // Validate session on mount
  useEffect(() => {
    const validateStoredSession = async () => {
      const storedToken = localStorage.getItem(SESSION_KEY);
      const storedExpires = localStorage.getItem(EXPIRES_KEY);
      const storedUser = localStorage.getItem(USER_KEY);

      if (!storedToken || !storedExpires || !storedUser) {
        setIsLoading(false);
        return;
      }

      // Check if session is expired
      if (new Date(storedExpires) < new Date()) {
        clearSession();
        setIsLoading(false);
        return;
      }

      try {
        const result = await apiValidateSession(storedToken);
        
        if (result.valid && result.user) {
          setIsAuthenticated(true);
          setCurrentUser(result.user);
          setSessionToken(storedToken);
        } else {
          clearSession();
        }
      } catch {
        // If validation fails, try to use stored user data
        // (in case edge function is temporarily unavailable)
        try {
          const user = JSON.parse(storedUser);
          setIsAuthenticated(true);
          setCurrentUser(user);
          setSessionToken(storedToken);
        } catch {
          clearSession();
        }
      }
      
      setIsLoading(false);
    };

    validateStoredSession();
  }, []);

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSessionToken(null);
  };

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response: LoginResponse = await apiLogin(username, password);
      
      // Store session data
      localStorage.setItem(SESSION_KEY, response.sessionToken);
      localStorage.setItem(USER_KEY, JSON.stringify(response.user));
      localStorage.setItem(EXPIRES_KEY, response.expiresAt);
      
      setIsAuthenticated(true);
      setCurrentUser(response.user);
      setSessionToken(response.sessionToken);
      
      return true;
    } catch {
      return false;
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await apiLogout(sessionToken);
      } catch {
        // Ignore logout errors - still clear local session
      }
    }
    clearSession();
  };

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
