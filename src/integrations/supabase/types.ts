export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      clientes: {
        Row: {
          cnpj: string | null
          cpf: string | null
          created_at: string
          endereco: string
          id: string
          nome: string
          numero: string
          telefone: string
          updated_at: string
        }
        Insert: {
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          endereco: string
          id?: string
          nome: string
          numero: string
          telefone: string
          updated_at?: string
        }
        Update: {
          cnpj?: string | null
          cpf?: string | null
          created_at?: string
          endereco?: string
          id?: string
          nome?: string
          numero?: string
          telefone?: string
          updated_at?: string
        }
        Relationships: []
      }
      funcionarios: {
        Row: {
          ativo: boolean
          created_at: string
          id: string
          is_admin: boolean
          nome: string
          pode_cobrar_taxa: boolean
          pode_dar_desconto: boolean
          pode_pagar_depois: boolean
          senha: string
          telefone: string | null
          updated_at: string
          usuario: string
        }
        Insert: {
          ativo?: boolean
          created_at?: string
          id?: string
          is_admin?: boolean
          nome: string
          pode_cobrar_taxa?: boolean
          pode_dar_desconto?: boolean
          pode_pagar_depois?: boolean
          senha: string
          telefone?: string | null
          updated_at?: string
          usuario: string
        }
        Update: {
          ativo?: boolean
          created_at?: string
          id?: string
          is_admin?: boolean
          nome?: string
          pode_cobrar_taxa?: boolean
          pode_dar_desconto?: boolean
          pode_pagar_depois?: boolean
          senha?: string
          telefone?: string | null
          updated_at?: string
          usuario?: string
        }
        Relationships: []
      }
      login_attempts: {
        Row: {
          created_at: string
          id: string
          identifier: string
          identifier_type: string
          ip_address: string | null
          success: boolean
        }
        Insert: {
          created_at?: string
          id?: string
          identifier: string
          identifier_type: string
          ip_address?: string | null
          success?: boolean
        }
        Update: {
          created_at?: string
          id?: string
          identifier?: string
          identifier_type?: string
          ip_address?: string | null
          success?: boolean
        }
        Relationships: []
      }
      password_resets: {
        Row: {
          created_at: string
          expires_at: string
          funcionario_id: string
          id: string
          token: string
          used: boolean
        }
        Insert: {
          created_at?: string
          expires_at: string
          funcionario_id: string
          id?: string
          token: string
          used?: boolean
        }
        Update: {
          created_at?: string
          expires_at?: string
          funcionario_id?: string
          id?: string
          token?: string
          used?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "password_resets_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
      pedidos: {
        Row: {
          cliente_cnpj: string | null
          cliente_cpf: string | null
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          created_at: string
          desconto_percentual: number | null
          desconto_valor: number | null
          id: string
          itens: Json
          numero: string
          pago: boolean | null
          retirado: boolean | null
          status: string
          taxa_entrega: number | null
          updated_at: string
          valor_total: number
        }
        Insert: {
          cliente_cnpj?: string | null
          cliente_cpf?: string | null
          cliente_id: string
          cliente_nome: string
          cliente_telefone: string
          created_at?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          itens?: Json
          numero: string
          pago?: boolean | null
          retirado?: boolean | null
          status?: string
          taxa_entrega?: number | null
          updated_at?: string
          valor_total?: number
        }
        Update: {
          cliente_cnpj?: string | null
          cliente_cpf?: string | null
          cliente_id?: string
          cliente_nome?: string
          cliente_telefone?: string
          created_at?: string
          desconto_percentual?: number | null
          desconto_valor?: number | null
          id?: string
          itens?: Json
          numero?: string
          pago?: boolean | null
          retirado?: boolean | null
          status?: string
          taxa_entrega?: number | null
          updated_at?: string
          valor_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "pedidos_cliente_id_fkey"
            columns: ["cliente_id"]
            isOneToOne: false
            referencedRelation: "clientes"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          expires_at: string
          funcionario_id: string
          id: string
          token: string
        }
        Insert: {
          created_at?: string
          expires_at: string
          funcionario_id: string
          id?: string
          token: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          funcionario_id?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_funcionario_id_fkey"
            columns: ["funcionario_id"]
            isOneToOne: false
            referencedRelation: "funcionarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_expired_sessions: { Args: never; Returns: undefined }
      cleanup_old_login_attempts: { Args: never; Returns: undefined }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
