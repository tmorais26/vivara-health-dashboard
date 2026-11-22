export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

type Rel = {
  foreignKeyName: string
  columns: string[]
  isOneToOne: boolean
  referencedRelation: string
  referencedColumns: string[]
}

// Gerado a partir do projeto Supabase (generate_typescript_types). Relações omitidas por brevidade.
export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria: {
        Row: { acao: string; alvo: string | null; criado_em: string; detalhe: Json | null; espaco_id: string | null; id: number; user_id: string | null }
        Insert: { acao: string; alvo?: string | null; criado_em?: string; detalhe?: Json | null; espaco_id?: string | null; user_id?: string | null }
        Update: { acao?: string; alvo?: string | null; criado_em?: string; detalhe?: Json | null; espaco_id?: string | null; user_id?: string | null }
        Relationships: Rel[]
      }
      canal_mensagens: {
        Row: { autor_id: string; criado_em: string; espaco_id: string; id: string; para_id: string | null; texto: string }
        Insert: { autor_id: string; criado_em?: string; espaco_id: string; id?: string; para_id?: string | null; texto: string }
        Update: { autor_id?: string; criado_em?: string; espaco_id?: string; id?: string; para_id?: string | null; texto?: string }
        Relationships: Rel[]
      }
      chat_mensagens: {
        Row: { anexos: Json; autor_membro_id: string | null; criada_em: string; do_utente: boolean; espaco_id: string; id: string; texto: string; utente_id: string }
        Insert: { anexos?: Json; autor_membro_id?: string | null; criada_em?: string; do_utente?: boolean; espaco_id: string; id?: string; texto?: string; utente_id: string }
        Update: { anexos?: Json; autor_membro_id?: string | null; criada_em?: string; do_utente?: boolean; espaco_id?: string; id?: string; texto?: string; utente_id?: string }
        Relationships: Rel[]
      }
      codigos_recomendacao: {
        Row: { codigo: string; criado_em: string; titular: string; user_id: string }
        Insert: { codigo: string; criado_em?: string; titular: string; user_id: string }
        Update: { codigo?: string; criado_em?: string; titular?: string; user_id?: string }
        Relationships: Rel[]
      }
      analises: {
        Row: { atualizado_em: string; autor_id: string; criado_em: string; data_colheita: string; espaco_id: string; estado: string; ficheiro_nome: string | null; ficheiro_path: string | null; id: string; laboratorio: string | null; notas: string | null; tipo: string; titulo: string | null; utente_id: string }
        Insert: { atualizado_em?: string; autor_id: string; criado_em?: string; data_colheita: string; espaco_id: string; estado?: string; ficheiro_nome?: string | null; ficheiro_path?: string | null; id?: string; laboratorio?: string | null; notas?: string | null; tipo?: string; titulo?: string | null; utente_id: string }
        Update: { atualizado_em?: string; autor_id?: string; criado_em?: string; data_colheita?: string; espaco_id?: string; estado?: string; ficheiro_nome?: string | null; ficheiro_path?: string | null; id?: string; laboratorio?: string | null; notas?: string | null; tipo?: string; titulo?: string | null; utente_id?: string }
        Relationships: Rel[]
      }
      resultados: {
        Row: { analise_id: string; atualizado_em: string; autor_id: string; criado_em: string; espaco_id: string; id: string; marcador: string; ref_max: number | null; ref_min: number | null; unidade: string | null; utente_id: string; valor: number | null; valor_texto: string | null }
        Insert: { analise_id: string; atualizado_em?: string; autor_id: string; criado_em?: string; espaco_id: string; id?: string; marcador: string; ref_max?: number | null; ref_min?: number | null; unidade?: string | null; utente_id: string; valor?: number | null; valor_texto?: string | null }
        Update: { analise_id?: string; atualizado_em?: string; autor_id?: string; criado_em?: string; espaco_id?: string; id?: string; marcador?: string; ref_max?: number | null; ref_min?: number | null; unidade?: string | null; utente_id?: string; valor?: number | null; valor_texto?: string | null }
        Relationships: Rel[]
      }
      alvos_marcador: {
        Row: { alvo_max: number | null; alvo_min: number | null; atualizado_em: string; autor_id: string; criado_em: string; espaco_id: string; id: string; justificacao: string | null; marcador: string; utente_id: string }
        Insert: { alvo_max?: number | null; alvo_min?: number | null; atualizado_em?: string; autor_id: string; criado_em?: string; espaco_id: string; id?: string; justificacao?: string | null; marcador: string; utente_id: string }
        Update: { alvo_max?: number | null; alvo_min?: number | null; atualizado_em?: string; autor_id?: string; criado_em?: string; espaco_id?: string; id?: string; justificacao?: string | null; marcador?: string; utente_id?: string }
        Relationships: Rel[]
      }
      medicacoes: {
        Row: { autor_id: string; criado_em: string; atualizado_em: string; cronica: boolean; dci: string; dosagem: string | null; embalagens: number | null; espaco_id: string; estado: string; estado_em: string | null; estado_motivo: string | null; fim: string | null; forma: string | null; id: string; inicio: string; motivo: string | null; nome_comercial: string | null; numero_receita: string | null; origem: string; posologia: string; utente_id: string; via: string | null }
        Insert: { autor_id: string; criado_em?: string; atualizado_em?: string; cronica?: boolean; dci: string; dosagem?: string | null; embalagens?: number | null; espaco_id: string; estado?: string; estado_em?: string | null; estado_motivo?: string | null; fim?: string | null; forma?: string | null; id?: string; inicio?: string; motivo?: string | null; nome_comercial?: string | null; numero_receita?: string | null; origem?: string; posologia: string; utente_id: string; via?: string | null }
        Update: { autor_id?: string; criado_em?: string; atualizado_em?: string; cronica?: boolean; dci?: string; dosagem?: string | null; embalagens?: number | null; espaco_id?: string; estado?: string; estado_em?: string | null; estado_motivo?: string | null; fim?: string | null; forma?: string | null; id?: string; inicio?: string; motivo?: string | null; nome_comercial?: string | null; numero_receita?: string | null; origem?: string; posologia?: string; utente_id?: string; via?: string | null }
        Relationships: Rel[]
      }
      alergias: {
        Row: { ativa: boolean; atualizado_em: string; autor_id: string; criado_em: string; espaco_id: string; gravidade: string; id: string; reacao: string | null; substancia: string; utente_id: string }
        Insert: { ativa?: boolean; atualizado_em?: string; autor_id: string; criado_em?: string; espaco_id: string; gravidade?: string; id?: string; reacao?: string | null; substancia: string; utente_id: string }
        Update: { ativa?: boolean; atualizado_em?: string; autor_id?: string; criado_em?: string; espaco_id?: string; gravidade?: string; id?: string; reacao?: string | null; substancia?: string; utente_id?: string }
        Relationships: Rel[]
      }
      modelos_documento: {
        Row: { alterado_em: string; autor_id: string; corpo: string; criado_em: string; espaco_id: string; id: string; nome: string; partilhado: boolean; tipo: string }
        Insert: { alterado_em?: string; autor_id: string; corpo: string; criado_em?: string; espaco_id: string; id?: string; nome: string; partilhado?: boolean; tipo: string }
        Update: { alterado_em?: string; autor_id?: string; corpo?: string; criado_em?: string; espaco_id?: string; id?: string; nome?: string; partilhado?: boolean; tipo?: string }
        Relationships: Rel[]
      }
      documentos_emitidos: {
        Row: { autor_id: string; cabecalho: Json; consulta_id: string | null; corpo: string; emitido_em: string; espaco_id: string; id: string; tipo: string; titulo: string; utente_id: string }
        Insert: { autor_id: string; cabecalho?: Json; consulta_id?: string | null; corpo: string; emitido_em?: string; espaco_id: string; id?: string; tipo: string; titulo: string; utente_id: string }
        Update: { autor_id?: string; cabecalho?: Json; consulta_id?: string | null; corpo?: string; emitido_em?: string; espaco_id?: string; id?: string; tipo?: string; titulo?: string; utente_id?: string }
        Relationships: Rel[]
      }
      convites_app: {
        Row: { convidante_id: string; criado_em: string; token: string; usado_em: string | null; usado_por: string | null; utente_id: string | null }
        Insert: { convidante_id: string; criado_em?: string; token?: string; usado_em?: string | null; usado_por?: string | null; utente_id?: string | null }
        Update: { convidante_id?: string; criado_em?: string; token?: string; usado_em?: string | null; usado_por?: string | null; utente_id?: string | null }
        Relationships: Rel[]
      }
      recomendacao_declaracoes: {
        Row: { aceite_em: string; ip: string | null; texto: string; user_id: string }
        Insert: { aceite_em?: string; ip?: string | null; texto: string; user_id: string }
        Update: { aceite_em?: string; ip?: string | null; texto?: string; user_id?: string }
        Relationships: Rel[]
      }
      consultas: {
        Row: { criado_em: string; criado_por: string | null; duracao_min: number; espaco_id: string; estado: string; id: string; inicio: string; motivo: string | null; profissional_id: string; tipo: string; utente_id: string }
        Insert: { criado_em?: string; criado_por?: string | null; duracao_min?: number; espaco_id: string; estado?: string; id?: string; inicio: string; motivo?: string | null; profissional_id: string; tipo?: string; utente_id: string }
        Update: { criado_em?: string; criado_por?: string | null; duracao_min?: number; espaco_id?: string; estado?: string; id?: string; inicio?: string; motivo?: string | null; profissional_id?: string; tipo?: string; utente_id?: string }
        Relationships: Rel[]
      }
      diario_partilhas: {
        Row: { diario_id: string; membro_id: string }
        Insert: { diario_id: string; membro_id: string }
        Update: { diario_id?: string; membro_id?: string }
        Relationships: Rel[]
      }
      diarios: {
        Row: { atualizado_em: string; autor_id: string; consulta_id: string | null; criado_em: string; espaco_id: string; id: string; texto: string; utente_id: string; visibilidade: string }
        Insert: { atualizado_em?: string; autor_id: string; consulta_id?: string | null; criado_em?: string; espaco_id: string; id?: string; texto: string; utente_id: string; visibilidade?: string }
        Update: { atualizado_em?: string; autor_id?: string; consulta_id?: string | null; criado_em?: string; espaco_id?: string; id?: string; texto?: string; utente_id?: string; visibilidade?: string }
        Relationships: Rel[]
      }
      espacos: {
        Row: { criado_em: string; criado_por: string; id: string; nome: string; tipo: string }
        Insert: { criado_em?: string; criado_por: string; id?: string; nome: string; tipo: string }
        Update: { criado_em?: string; criado_por?: string; id?: string; nome?: string; tipo?: string }
        Relationships: Rel[]
      }
      medico_consentimento_marketing: {
        Row: { aceite: boolean; alterado_em: string; id: string; ip: string | null; texto_caixa: string | null; user_id: string }
        Insert: { aceite: boolean; alterado_em?: string; id?: string; ip?: string | null; texto_caixa?: string | null; user_id: string }
        Update: { aceite?: boolean; alterado_em?: string; id?: string; ip?: string | null; texto_caixa?: string | null; user_id?: string }
        Relationships: Rel[]
      }
      medico_consentimentos: {
        Row: { aceite_em: string; caixa_id: string; codigo: string; id: string; ip: string | null; texto_caixa: string; tipo: string; user_id: string; versao: string }
        Insert: { aceite_em?: string; caixa_id: string; codigo: string; id?: string; ip?: string | null; texto_caixa: string; tipo: string; user_id: string; versao: string }
        Update: { aceite_em?: string; caixa_id?: string; codigo?: string; id?: string; ip?: string | null; texto_caixa?: string; tipo?: string; user_id?: string; versao?: string }
        Relationships: Rel[]
      }
      medico_perfis: {
        Row: { cedula_profissional: string | null; cedula_validada: boolean; clinica: string | null; criado_em: string; especialidade: string | null; nome: string | null; user_id: string }
        Insert: { cedula_profissional?: string | null; cedula_validada?: boolean; clinica?: string | null; criado_em?: string; especialidade?: string | null; nome?: string | null; user_id: string }
        Update: { cedula_profissional?: string | null; cedula_validada?: boolean; clinica?: string | null; criado_em?: string; especialidade?: string | null; nome?: string | null; user_id?: string }
        Relationships: Rel[]
      }
      medico_utente_fundamento: {
        Row: { confirmado_em: string; id: string; ip: string | null; texto_confirmado: string; user_id: string; utente_ref: string }
        Insert: { confirmado_em?: string; id?: string; ip?: string | null; texto_confirmado: string; user_id: string; utente_ref: string }
        Update: { confirmado_em?: string; id?: string; ip?: string | null; texto_confirmado?: string; user_id?: string; utente_ref?: string }
        Relationships: Rel[]
      }
      membros: {
        Row: { criado_em: string; espaco_id: string; estado: string; funcao: string; id: string; nome_exibicao: string; papel_admin: string | null; profissao: string | null; user_id: string }
        Insert: { criado_em?: string; espaco_id: string; estado?: string; funcao: string; id?: string; nome_exibicao: string; papel_admin?: string | null; profissao?: string | null; user_id: string }
        Update: { criado_em?: string; espaco_id?: string; estado?: string; funcao?: string; id?: string; nome_exibicao?: string; papel_admin?: string | null; profissao?: string | null; user_id?: string }
        Relationships: Rel[]
      }
      notificacoes: {
        Row: { criada_em: string; detalhe: Json | null; espaco_id: string | null; id: string; lida: boolean; ref_id: string | null; tipo: string; user_id: string; utente_id: string | null }
        Insert: { criada_em?: string; detalhe?: Json | null; espaco_id?: string | null; id?: string; lida?: boolean; ref_id?: string | null; tipo: string; user_id: string; utente_id?: string | null }
        Update: { criada_em?: string; detalhe?: Json | null; espaco_id?: string | null; id?: string; lida?: boolean; ref_id?: string | null; tipo?: string; user_id?: string; utente_id?: string | null }
        Relationships: Rel[]
      }
      observacao_partilhas: {
        Row: { membro_id: string; observacao_id: string }
        Insert: { membro_id: string; observacao_id: string }
        Update: { membro_id?: string; observacao_id?: string }
        Relationships: Rel[]
      }
      observacoes: {
        Row: { autor_id: string; consulta_id: string | null; criado_em: string; espaco_id: string; id: string; texto: string; utente_id: string; visibilidade: string }
        Insert: { autor_id: string; consulta_id?: string | null; criado_em?: string; espaco_id: string; id?: string; texto: string; utente_id: string; visibilidade?: string }
        Update: { autor_id?: string; consulta_id?: string | null; criado_em?: string; espaco_id?: string; id?: string; texto?: string; utente_id?: string; visibilidade?: string }
        Relationships: Rel[]
      }
      pedidos_exportacao: {
        Row: { ambito: string; criado_em: string; decidido_em: string | null; decidido_por: string | null; espaco_id: string; estado: string; expira_em: string | null; id: string; motivo: string | null; requerente_id: string; usado_em: string | null; utente_id: string | null }
        Insert: { ambito: string; criado_em?: string; decidido_em?: string | null; decidido_por?: string | null; espaco_id: string; estado?: string; expira_em?: string | null; id?: string; motivo?: string | null; requerente_id: string; usado_em?: string | null; utente_id?: string | null }
        Update: { ambito?: string; criado_em?: string; decidido_em?: string | null; decidido_por?: string | null; espaco_id?: string; estado?: string; expira_em?: string | null; id?: string; motivo?: string | null; requerente_id?: string; usado_em?: string | null; utente_id?: string | null }
        Relationships: Rel[]
      }
      registos_clinicos: {
        Row: { autor_id: string | null; criado_em: string; dados: Json; espaco_id: string; id: string; tipo: string; utente_id: string }
        Insert: { autor_id?: string | null; criado_em?: string; dados?: Json; espaco_id: string; id?: string; tipo: string; utente_id: string }
        Update: { autor_id?: string | null; criado_em?: string; dados?: Json; espaco_id?: string; id?: string; tipo?: string; utente_id?: string }
        Relationships: Rel[]
      }
      seguimentos: {
        Row: { desde: string; membro_id: string; origem: string; utente_id: string }
        Insert: { desde?: string; membro_id: string; origem: string; utente_id: string }
        Update: { desde?: string; membro_id?: string; origem?: string; utente_id?: string }
        Relationships: Rel[]
      }
      utentes: {
        Row: { chat_estado: string; cidade: string | null; clinica_onde_visto: string | null; criado_em: string; criado_por: string | null; data_nascimento: string | null; email: string | null; espaco_id: string; id: string; nome: string; sexo: string | null; telefone: string | null }
        Insert: { chat_estado?: string; cidade?: string | null; clinica_onde_visto?: string | null; criado_em?: string; criado_por?: string | null; data_nascimento?: string | null; email?: string | null; espaco_id: string; id?: string; nome: string; sexo?: string | null; telefone?: string | null }
        Update: { chat_estado?: string; cidade?: string | null; clinica_onde_visto?: string | null; criado_em?: string; criado_por?: string | null; data_nascimento?: string | null; email?: string | null; espaco_id?: string; id?: string; nome?: string; sexo?: string | null; telefone?: string | null }
        Relationships: Rel[]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      convidar_membro: { Args: { p_email: string; p_espaco: string; p_funcao: string; p_nome_exibicao: string; p_profissao?: string }; Returns: string }
      criar_espaco: { Args: { p_funcao: string; p_nome: string; p_nome_exibicao: string; p_profissao?: string; p_tipo: string }; Returns: string }
      decidir_exportacao: { Args: { p_aprovar: boolean; p_pedido: string }; Returns: undefined }
      definir_chat: { Args: { p_estado: string; p_utente: string }; Returns: undefined }
      definir_estado_membro: { Args: { p_estado: string; p_membro: string }; Returns: undefined }
      definir_manager: { Args: { p_manager: boolean; p_membro: string }; Returns: undefined }
      eliminar_conversa: { Args: { p_utente: string }; Returns: undefined }
      guardar_perfil: { Args: { p_cedula: string; p_clinica: string; p_especialidade: string; p_nome: string }; Returns: undefined }
      pedir_exportacao: { Args: { p_ambito: string; p_espaco: string; p_motivo?: string; p_utente?: string }; Returns: string }
      segue_utente: { Args: { p_utente: string }; Returns: boolean }
      usar_exportacao: { Args: { p_pedido: string }; Returns: undefined }
      meu_codigo: { Args: never; Returns: string }
      validar_codigo: { Args: { p_codigo: string }; Returns: boolean }
      ja_declarou_recomendacao: { Args: never; Returns: boolean }
      resumo_recomendacoes: { Args: never; Returns: Json }
      resumo_recomendacoes_clinica: { Args: { p_espaco: string }; Returns: Json }
      registar_recomendacao: { Args: { p_codigo: string; p_convidado: string; p_convidado_tipo: string }; Returns: string }
      usar_codigo: { Args: { p_codigo: string }; Returns: string }
    }
    Enums: {
      user_role: "physician" | "patient"
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
    Enums: {
      user_role: ["physician", "patient"],
    },
  },
} as const
