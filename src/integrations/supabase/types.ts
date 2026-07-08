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
      activity_logs: {
        Row: {
          action: string
          created_at: string
          entity: string | null
          entity_id: string | null
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          entity?: string | null
          entity_id?: string | null
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: []
      }
      announcements: {
        Row: {
          body: string
          created_at: string
          created_by: string | null
          id: string
          is_active: boolean
          title: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by?: string | null
          id?: string
          is_active?: boolean
          title?: string
        }
        Relationships: []
      }
      deposit_requests: {
        Row: {
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          processed_at: string | null
          processed_by: string | null
          proof_url: string | null
          status: Database["public"]["Enums"]["request_status"]
          txn_id: string | null
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method: string
          processed_at?: string | null
          processed_by?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          txn_id?: string | null
          user_id: string
        }
        Update: {
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          processed_by?: string | null
          proof_url?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          txn_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deposit_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "deposit_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deposit_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      match_results: {
        Row: {
          created_at: string
          id: string
          kills: number
          mvp: boolean
          points: number
          position: number | null
          prize: number
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kills?: number
          mvp?: boolean
          points?: number
          position?: number | null
          prize?: number
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kills?: number
          mvp?: boolean
          points?: number
          position?: number | null
          prize?: number
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "match_results_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          id: string
          is_read: boolean
          link: string | null
          title: string
          type: Database["public"]["Enums"]["notif_type"]
          user_id: string | null
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title: string
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string | null
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          is_read?: boolean
          link?: string | null
          title?: string
          type?: Database["public"]["Enums"]["notif_type"]
          user_id?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          processed_at: string | null
          processed_by: string | null
          rejection_reason: string | null
          screenshot_url: string
          status: Database["public"]["Enums"]["payment_status"]
          tournament_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          screenshot_url: string
          status?: Database["public"]["Enums"]["payment_status"]
          tournament_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          processed_at?: string | null
          processed_by?: string | null
          rejection_reason?: string | null
          screenshot_url?: string
          status?: Database["public"]["Enums"]["payment_status"]
          tournament_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          game_name: string | null
          game_uid: string | null
          id: string
          phone: string | null
          status: Database["public"]["Enums"]["user_status"]
          uid: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          game_name?: string | null
          game_uid?: string | null
          id: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          uid?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          game_name?: string | null
          game_uid?: string | null
          id?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["user_status"]
          uid?: string
          updated_at?: string
        }
        Relationships: []
      }
      rooms: {
        Row: {
          created_at: string
          id: string
          reveal_at: string
          room_id: string
          room_password: string
          tournament_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          reveal_at: string
          room_id: string
          room_password: string
          tournament_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          reveal_at?: string
          room_id?: string
          room_password?: string
          tournament_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: true
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          created_at: string
          id: string
          message: string
          status: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_response?: string | null
          created_at?: string
          id?: string
          message?: string
          status?: Database["public"]["Enums"]["ticket_status"]
          subject?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tournament_registrations: {
        Row: {
          created_at: string
          ff_uid: string | null
          id: string
          paid_amount: number
          players: Json
          slot_number: number | null
          team_name: string | null
          tournament_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          ff_uid?: string | null
          id?: string
          paid_amount?: number
          players?: Json
          slot_number?: number | null
          team_name?: string | null
          tournament_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          ff_uid?: string | null
          id?: string
          paid_amount?: number
          players?: Json
          slot_number?: number | null
          team_name?: string | null
          tournament_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tournament_registrations_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      tournaments: {
        Row: {
          banner_url: string | null
          created_at: string
          created_by: string | null
          description: string | null
          entry_fee: number
          filled_slots: number
          id: string
          map: string | null
          max_slots: number
          mode: string | null
          per_kill_prize: number | null
          prize_pool: number
          registration_deadline: string | null
          registration_open: boolean
          rules: string | null
          start_time: string
          status: Database["public"]["Enums"]["tournament_status"]
          title: string
          type: Database["public"]["Enums"]["tournament_type"]
          updated_at: string
        }
        Insert: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_fee?: number
          filled_slots?: number
          id?: string
          map?: string | null
          max_slots: number
          mode?: string | null
          per_kill_prize?: number | null
          prize_pool?: number
          registration_deadline?: string | null
          registration_open?: boolean
          rules?: string | null
          start_time: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title: string
          type: Database["public"]["Enums"]["tournament_type"]
          updated_at?: string
        }
        Update: {
          banner_url?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          entry_fee?: number
          filled_slots?: number
          id?: string
          map?: string | null
          max_slots?: number
          mode?: string | null
          per_kill_prize?: number | null
          prize_pool?: number
          registration_deadline?: string | null
          registration_open?: boolean
          rules?: string | null
          start_time?: string
          status?: Database["public"]["Enums"]["tournament_status"]
          title?: string
          type?: Database["public"]["Enums"]["tournament_type"]
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
      wallet_transactions: {
        Row: {
          amount: number
          balance_after: number
          created_at: string
          id: string
          note: string | null
          reference: string | null
          status: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Insert: {
          amount: number
          balance_after: number
          created_at?: string
          id?: string
          note?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          type: Database["public"]["Enums"]["tx_type"]
          user_id: string
        }
        Update: {
          amount?: number
          balance_after?: number
          created_at?: string
          id?: string
          note?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["tx_status"]
          type?: Database["public"]["Enums"]["tx_type"]
          user_id?: string
        }
        Relationships: []
      }
      wallets: {
        Row: {
          balance: number
          id: string
          locked: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          id?: string
          locked?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          id?: string
          locked?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      winners: {
        Row: {
          avatar_url: string | null
          created_at: string
          featured: boolean
          ff_uid: string | null
          id: string
          image_url: string | null
          player_name: string | null
          position: number
          prize: number
          published_at: string
          tournament_id: string
          tournament_title: string | null
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          featured?: boolean
          ff_uid?: string | null
          id?: string
          image_url?: string | null
          player_name?: string | null
          position: number
          prize: number
          published_at?: string
          tournament_id: string
          tournament_title?: string | null
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          featured?: boolean
          ff_uid?: string | null
          id?: string
          image_url?: string | null
          player_name?: string | null
          position?: number
          prize?: number
          published_at?: string
          tournament_id?: string
          tournament_title?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "winners_tournament_id_fkey"
            columns: ["tournament_id"]
            isOneToOne: false
            referencedRelation: "tournaments"
            referencedColumns: ["id"]
          },
        ]
      }
      withdraw_requests: {
        Row: {
          account_details: Json
          admin_note: string | null
          amount: number
          created_at: string
          id: string
          method: string
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          account_details?: Json
          admin_note?: string | null
          amount: number
          created_at?: string
          id?: string
          method: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          account_details?: Json
          admin_note?: string | null
          amount?: number
          created_at?: string
          id?: string
          method?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "withdraw_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "leaderboard"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "withdraw_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "withdraw_requests_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      leaderboard: {
        Row: {
          avatar_url: string | null
          kills: number | null
          matches: number | null
          mvps: number | null
          name: string | null
          points: number | null
          total_prize: number | null
          uid: string | null
          user_id: string | null
          wins: number | null
        }
        Relationships: []
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          full_name: string | null
          game_name: string | null
          id: string | null
          uid: string | null
        }
        Insert: {
          avatar_url?: string | null
          full_name?: string | null
          game_name?: string | null
          id?: string | null
          uid?: string | null
        }
        Update: {
          avatar_url?: string | null
          full_name?: string | null
          game_name?: string | null
          id?: string | null
          uid?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_update_reg_ff_uid: {
        Args: { _ff_uid: string; _reg_id: string }
        Returns: undefined
      }
      approve_deposit: { Args: { _id: string }; Returns: undefined }
      approve_payment: { Args: { _pid: string }; Returns: undefined }
      approve_withdrawal: { Args: { _id: string }; Returns: undefined }
      cancel_and_refund_tournament: {
        Args: { _delete?: boolean; _tid: string }
        Returns: Json
      }
      distribute_prize: {
        Args: { _amount: number; _position: number; _tid: string; _uid: string }
        Returns: string
      }
      get_room_meta: {
        Args: { _tid: string }
        Returns: {
          published: boolean
          reveal_at: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
      publish_tournament_results: {
        Args: { _rows: Json; _tid: string }
        Returns: undefined
      }
      register_for_tournament:
        | {
            Args: { _players?: Json; _team_name?: string; _tour_id: string }
            Returns: string
          }
        | {
            Args: {
              _ff_uid?: string
              _players?: Json
              _team_name?: string
              _tour_id: string
            }
            Returns: string
          }
      reject_deposit: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      reject_payment: {
        Args: { _pid: string; _reason: string }
        Returns: undefined
      }
      reject_withdrawal: {
        Args: { _id: string; _reason: string }
        Returns: undefined
      }
      request_withdrawal: {
        Args: {
          _account_holder: string
          _amount: number
          _notes?: string
          _upi_id: string
        }
        Returns: string
      }
      set_registration_open: {
        Args: { _open: boolean; _tid: string }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      notif_type:
        | "info"
        | "success"
        | "warning"
        | "error"
        | "tournament"
        | "wallet"
      payment_status: "pending" | "approved" | "rejected"
      request_status: "pending" | "approved" | "rejected"
      ticket_status: "open" | "in_progress" | "resolved" | "closed"
      tournament_status: "upcoming" | "live" | "completed" | "cancelled"
      tournament_type: "br_solo" | "br_duo" | "br_squad" | "cs_squad"
      tx_status: "pending" | "approved" | "rejected" | "completed"
      tx_type:
        | "deposit"
        | "withdraw"
        | "entry_fee"
        | "prize"
        | "refund"
        | "adjustment"
      user_status: "active" | "suspended" | "banned"
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
      app_role: ["admin", "moderator", "user"],
      notif_type: [
        "info",
        "success",
        "warning",
        "error",
        "tournament",
        "wallet",
      ],
      payment_status: ["pending", "approved", "rejected"],
      request_status: ["pending", "approved", "rejected"],
      ticket_status: ["open", "in_progress", "resolved", "closed"],
      tournament_status: ["upcoming", "live", "completed", "cancelled"],
      tournament_type: ["br_solo", "br_duo", "br_squad", "cs_squad"],
      tx_status: ["pending", "approved", "rejected", "completed"],
      tx_type: [
        "deposit",
        "withdraw",
        "entry_fee",
        "prize",
        "refund",
        "adjustment",
      ],
      user_status: ["active", "suspended", "banned"],
    },
  },
} as const
