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
      complaint_history: {
        Row: {
          actor_id: string | null
          complaint_id: string
          created_at: string
          event_type: string
          id: string
          new_priority: Database["public"]["Enums"]["complaint_priority"] | null
          new_status: Database["public"]["Enums"]["complaint_status"] | null
          note: string | null
          previous_priority:
            | Database["public"]["Enums"]["complaint_priority"]
            | null
          previous_status:
            | Database["public"]["Enums"]["complaint_status"]
            | null
        }
        Insert: {
          actor_id?: string | null
          complaint_id: string
          created_at?: string
          event_type: string
          id?: string
          new_priority?:
            | Database["public"]["Enums"]["complaint_priority"]
            | null
          new_status?: Database["public"]["Enums"]["complaint_status"] | null
          note?: string | null
          previous_priority?:
            | Database["public"]["Enums"]["complaint_priority"]
            | null
          previous_status?:
            | Database["public"]["Enums"]["complaint_status"]
            | null
        }
        Update: {
          actor_id?: string | null
          complaint_id?: string
          created_at?: string
          event_type?: string
          id?: string
          new_priority?:
            | Database["public"]["Enums"]["complaint_priority"]
            | null
          new_status?: Database["public"]["Enums"]["complaint_status"] | null
          note?: string | null
          previous_priority?:
            | Database["public"]["Enums"]["complaint_priority"]
            | null
          previous_status?:
            | Database["public"]["Enums"]["complaint_status"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "complaint_history_complaint_id_fkey"
            columns: ["complaint_id"]
            isOneToOne: false
            referencedRelation: "complaints"
            referencedColumns: ["id"]
          },
        ]
      }
      complaints: {
        Row: {
          category: Database["public"]["Enums"]["complaint_category"]
          contact_phone: string | null
          created_at: string
          description: string
          id: string
          location: string | null
          photo_urls: string[]
          priority: Database["public"]["Enums"]["complaint_priority"]
          resident_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["complaint_status"]
          updated_at: string
        }
        Insert: {
          category: Database["public"]["Enums"]["complaint_category"]
          contact_phone?: string | null
          created_at?: string
          description: string
          id?: string
          location?: string | null
          photo_urls?: string[]
          priority?: Database["public"]["Enums"]["complaint_priority"]
          resident_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
        }
        Update: {
          category?: Database["public"]["Enums"]["complaint_category"]
          contact_phone?: string | null
          created_at?: string
          description?: string
          id?: string
          location?: string | null
          photo_urls?: string[]
          priority?: Database["public"]["Enums"]["complaint_priority"]
          resident_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["complaint_status"]
          updated_at?: string
        }
        Relationships: []
      }
      notices: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          important: boolean
          title: string
          updated_at: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          important?: boolean
          title: string
          updated_at?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          important?: boolean
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          block: string | null
          created_at: string
          email: string
          flat_number: string | null
          full_name: string
          id: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          block?: string | null
          created_at?: string
          email: string
          flat_number?: string | null
          full_name: string
          id: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          block?: string | null
          created_at?: string
          email?: string
          flat_number?: string | null
          full_name?: string
          id?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      society_settings: {
        Row: {
          id: number
          overdue_threshold_days: number
          updated_at: string
        }
        Insert: {
          id?: number
          overdue_threshold_days?: number
          updated_at?: string
        }
        Update: {
          id?: number
          overdue_threshold_days?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "resident"
      complaint_category:
        | "plumbing"
        | "electrical"
        | "cleaning"
        | "security"
        | "parking"
        | "lift"
        | "water_supply"
        | "gardening"
        | "common_area"
        | "other"
      complaint_priority: "low" | "medium" | "high"
      complaint_status: "open" | "in_progress" | "resolved"
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
      app_role: ["admin", "resident"],
      complaint_category: [
        "plumbing",
        "electrical",
        "cleaning",
        "security",
        "parking",
        "lift",
        "water_supply",
        "gardening",
        "common_area",
        "other",
      ],
      complaint_priority: ["low", "medium", "high"],
      complaint_status: ["open", "in_progress", "resolved"],
    },
  },
} as const
