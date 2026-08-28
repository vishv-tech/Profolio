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
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      deployments: {
        Row: {
          content_snapshot: Json
          created_at: string
          id: string
          portfolio_id: string
          published_by: string | null
          status: string
          theme_config_snapshot: Json
          theme_id: string
          version: number
        }
        Insert: {
          content_snapshot: Json
          created_at?: string
          id?: string
          portfolio_id: string
          published_by?: string | null
          status: string
          theme_config_snapshot: Json
          theme_id: string
          version: number
        }
        Update: {
          content_snapshot?: Json
          created_at?: string
          id?: string
          portfolio_id?: string
          published_by?: string | null
          status?: string
          theme_config_snapshot?: Json
          theme_id?: string
          version?: number
        }
        Relationships: [
          {
            foreignKeyName: "deployments_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_published_by_fkey"
            columns: ["published_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deployments_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          portfolio_id: string
          referrer: string | null
          visitor_identifier: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          portfolio_id: string
          referrer?: string | null
          visitor_identifier?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          portfolio_id?: string
          referrer?: string | null
          visitor_identifier?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_events_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolios: {
        Row: {
          created_at: string
          draft_content: Json
          id: string
          published_at: string | null
          published_content: Json | null
          slug: string
          status: string
          theme_config: Json
          theme_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          draft_content: Json
          id?: string
          published_at?: string | null
          published_content?: Json | null
          slug: string
          status?: string
          theme_config?: Json
          theme_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          draft_content?: Json
          id?: string
          published_at?: string | null
          published_content?: Json | null
          slug?: string
          status?: string
          theme_config?: Json
          theme_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolios_theme_id_fkey"
            columns: ["theme_id"]
            isOneToOne: false
            referencedRelation: "themes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portfolios_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_status: string
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          username: string | null
        }
        Insert: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          account_status?: string
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      resumes: {
        Row: {
          created_at: string
          extracted_data: Json | null
          file_name: string
          file_path: string
          id: string
          improve_with_ai: boolean
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          extracted_data?: Json | null
          file_name: string
          file_path: string
          id?: string
          improve_with_ai?: boolean
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          extracted_data?: Json | null
          file_name?: string
          file_path?: string
          id?: string
          improve_with_ai?: boolean
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resumes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      themes: {
        Row: {
          created_at: string
          default_config: Json
          description: string | null
          id: string
          is_active: boolean
          layout_key: string
          name: string
          preview_image_url: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          default_config?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          layout_key: string
          name: string
          preview_image_url?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          default_config?: Json
          description?: string | null
          id?: string
          is_active?: boolean
          layout_key?: string
          name?: string
          preview_image_url?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_published_portfolio: {
        Args: { p_slug: string }
        Returns: {
          portfolio_id: string
          portfolio_slug: string
          portfolio_title: string
          published_content: Json
          theme_id: string
          theme_config: Json
          published_at: string
          theme_slug: string
          theme_name: string
          theme_layout_key: string
        }[]
      }
      publish_portfolio: {
        Args: {
          p_draft_content: Json
          p_portfolio_id: string
          p_theme_config: Json
          p_theme_id: string
        }
        Returns: {
          portfolio_id: string
          portfolio_slug: string
          deployment_version: number
          publication_time: string
        }[]
      }
      save_resume_review_as_draft: {
        Args: {
          p_draft_content: Json
          p_resume_id: string
          p_slug_base: string
          p_title: string
        }
        Returns: {
          portfolio_id: string
          portfolio_slug: string
          portfolio_status: string
        }[]
      }
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
