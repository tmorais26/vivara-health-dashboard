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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      profiles: {
        Row: { id: string; role: "physician" | "patient"; full_name: string | null; invite_code: string | null; created_at: string }
        Insert: { id: string; role?: "physician" | "patient"; full_name?: string | null; invite_code?: string | null; created_at?: string }
        Update: { id?: string; role?: "physician" | "patient"; full_name?: string | null; invite_code?: string | null; created_at?: string }
        Relationships: []
      }
      orientacoes_nutricionais: {
        Row: {
          id: string; user_id: string; versao: number; estado: string; conteudo: Json; entrada: Json; entrada_hash: string
          lang: string; modelo: string | null; versao_prompt: string | null; gerado_em: string
          conteudo_validado: Json | null; editado: boolean; observacao: string | null
          validado_por: string | null; validado_por_nome: string | null; validado_em: string | null
        }
        Insert: {
          id?: string; user_id: string; versao: number; estado: string; conteudo: Json; entrada: Json; entrada_hash: string
          lang?: string; modelo?: string | null; versao_prompt?: string | null; gerado_em?: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      pedidos_validacao_nutricao: {
        Row: { id: string; orientacao_id: string; user_id: string; estado: string; pedido_em: string; concluido_em: string | null; concluido_por: string | null }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      orientacoes_auditoria: {
        Row: { id: number; orientacao_id: string | null; user_id: string | null; ator_id: string | null; acao: string; detalhe: Json | null; criado_em: string }
        Insert: { id?: never; orientacao_id?: string | null; user_id?: string | null; ator_id?: string | null; acao: string; detalhe?: Json | null; criado_em?: string }
        Update: { [_ in never]: never }
        Relationships: []
      }
      meses_gratis: {
        Row: { id: string; beneficiario_id: string; recomendacao_id: string; ano: number; estado: string; referencia_prestador: string | null; criado_em: string; aplicado_em: string | null }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      medico_perfis: {
        Row: { user_id: string; nome: string; especialidade: string | null; cedula_profissional: string | null; clinica: string | null; cedula_validada: boolean; criado_em: string }
        Insert: { [_ in never]: never }
        Update: { [_ in never]: never }
        Relationships: []
      }
      consent_events: {
        Row: {
          id: number; user_id: string; consent_type: string; action: "granted" | "withdrawn"
          doc_version: string | null; checkbox_id: string | null; text_hash: string | null
          lang: string | null; ip: unknown; user_agent: string | null; created_at: string
        }
        Insert: {
          id?: never; user_id: string; consent_type: string; action: "granted" | "withdrawn"
          doc_version?: string | null; checkbox_id?: string | null; text_hash?: string | null
          lang?: string | null; ip?: string | null; user_agent?: string | null; created_at?: string
        }
        Update: { [_ in never]: never }
        Relationships: []
      }
      account_closures: {
        Row: { id: number; user_id: string; reason: string; requested_at: string; export_until: string; deleted_at: string | null }
        Insert: { id?: never; user_id: string; reason: string; requested_at?: string; export_until?: string; deleted_at?: string | null }
        Update: { deleted_at?: string | null }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      validar_codigo: { Args: { p_codigo: string }; Returns: boolean }
      pedir_validacao_nutricao: { Args: { p_orientacao: string }; Returns: string }
      tem_profissional_ligado: { Args: { p_user: string }; Returns: boolean }
      usar_codigo: { Args: { p_codigo: string }; Returns: string }
      aceitar_convite_app: { Args: { p_token: string }; Returns: string }
      meu_codigo_utente: { Args: Record<PropertyKey, never>; Returns: string }
      registar_primeiro_pagamento: { Args: { p_user: string }; Returns: undefined }
      marcar_mes_aplicado: { Args: { p_mes: string; p_referencia: string }; Returns: undefined }
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
