import { createContext, useContext, useState, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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
  currentUser: CurrentUser | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_KEY = "lolana_auth";
const USER_KEY = "lolana_user";

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem(AUTH_KEY) === "true";
  });
  
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(() => {
    const stored = localStorage.getItem(USER_KEY);
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase
        .from("funcionarios")
        .select("*")
        .eq("usuario", username)
        .eq("senha", password)
        .eq("ativo", true)
        .single();

      if (error || !data) {
        return false;
      }

      const user: CurrentUser = {
        id: data.id,
        nome: data.nome,
        usuario: data.usuario,
        telefone: data.telefone,
        permissions: {
          pode_dar_desconto: data.pode_dar_desconto,
          pode_cobrar_taxa: data.pode_cobrar_taxa,
          pode_pagar_depois: data.pode_pagar_depois,
          is_admin: data.is_admin,
        },
      };

      setIsAuthenticated(true);
      setCurrentUser(user);
      localStorage.setItem(AUTH_KEY, "true");
      localStorage.setItem(USER_KEY, JSON.stringify(user));
      return true;
    } catch {
      return false;
    }
  };

  const logout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(USER_KEY);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, login, logout }}>
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
