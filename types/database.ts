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
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_table: string | null
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_table?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_search_logs: {
        Row: {
          created_at: string
          id: string
          parsed_filters: Json | null
          query: string
          result_vendor_ids: string[] | null
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          parsed_filters?: Json | null
          query: string
          result_vendor_ids?: string[] | null
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          parsed_filters?: Json | null
          query?: string
          result_vendor_ids?: string[] | null
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_search_logs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_item_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          menu_item_id: string
          sort_order: number
          status: Database["public"]["Enums"]["media_status"]
          storage_path: string
          uploaded_by: string | null
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          menu_item_id: string
          sort_order?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_path: string
          uploaded_by?: string | null
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          menu_item_id?: string
          sort_order?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_item_media_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_item_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_items: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_available: boolean
          is_featured: boolean
          item_type: Database["public"]["Enums"]["item_type"]
          name: string
          price: number
          selling_date: string | null
          sort_order: number
          stock_quantity: number | null
          updated_at: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          name: string
          price: number
          selling_date?: string | null
          sort_order?: number
          stock_quantity?: number | null
          updated_at?: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_available?: boolean
          is_featured?: boolean
          item_type?: Database["public"]["Enums"]["item_type"]
          name?: string
          price?: number
          selling_date?: string | null
          sort_order?: number
          stock_quantity?: number | null
          updated_at?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_items_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          is_read: boolean | null
          link: string | null
          message: string
          title: string
          type: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          item_name: string
          item_price: number
          menu_item_id: string | null
          order_id: string
          quantity: number
          subtotal: number
        }
        Insert: {
          created_at?: string
          id?: string
          item_name: string
          item_price: number
          menu_item_id?: string | null
          order_id: string
          quantity?: number
          subtotal: number
        }
        Update: {
          created_at?: string
          id?: string
          item_name?: string
          item_price?: number
          menu_item_id?: string | null
          order_id?: string
          quantity?: number
          subtotal?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          buyer_name: string
          buyer_phone: string
          created_at: string
          fulfillment_method: Database["public"]["Enums"]["fulfillment_method"]
          id: string
          note: string | null
          status: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          buyer_name: string
          buyer_phone: string
          created_at?: string
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price: number
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          buyer_name?: string
          buyer_phone?: string
          created_at?: string
          fulfillment_method?: Database["public"]["Enums"]["fulfillment_method"]
          id?: string
          note?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          contact_info: Json | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_anonymous_by_default: boolean
          phone: string | null
          role: Database["public"]["Enums"]["user_role"]
          status: Database["public"]["Enums"]["user_status"]
          updated_at: string
          user_type: Database["public"]["Enums"]["user_type"]
        }
        Insert: {
          avatar_url?: string | null
          contact_info?: Json | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_anonymous_by_default?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Update: {
          avatar_url?: string | null
          contact_info?: Json | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_anonymous_by_default?: boolean
          phone?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          status?: Database["public"]["Enums"]["user_status"]
          updated_at?: string
          user_type?: Database["public"]["Enums"]["user_type"]
        }
        Relationships: []
      }
      review_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          review_id: string
          status: Database["public"]["Enums"]["media_status"]
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          review_id: string
          status?: Database["public"]["Enums"]["media_status"]
          storage_path: string
          uploaded_by: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          review_id?: string
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reporter_id: string
          review_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reporter_id: string
          review_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reporter_id?: string
          review_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "review_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      review_votes: {
        Row: {
          created_at: string
          id: string
          review_id: string
          score: number
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          review_id: string
          score: number
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          review_id?: string
          score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_votes_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_votes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          avg_vote_score: number | null
          content: string | null
          created_at: string
          id: string
          is_anonymous: boolean
          menu_item_id: string | null
          rating: number
          review_type: Database["public"]["Enums"]["review_type"]
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string
          vendor_id: string | null
          vote_count: number
        }
        Insert: {
          avg_vote_score?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          menu_item_id?: string | null
          rating: number
          review_type: Database["public"]["Enums"]["review_type"]
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id: string
          vendor_id?: string | null
          vote_count?: number
        }
        Update: {
          avg_vote_score?: number | null
          content?: string | null
          created_at?: string
          id?: string
          is_anonymous?: boolean
          menu_item_id?: string | null
          rating?: number
          review_type?: Database["public"]["Enums"]["review_type"]
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string
          vendor_id?: string | null
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "reviews_menu_item_id_fkey"
            columns: ["menu_item_id"]
            isOneToOne: false
            referencedRelation: "menu_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_vendors: {
        Row: {
          created_at: string
          id: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_vendors_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_vendors_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      seller_vendor_roles: {
        Row: {
          created_at: string
          id: string
          is_primary: boolean
          seller_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_primary?: boolean
          seller_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_primary?: boolean
          seller_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "seller_vendor_roles_seller_id_fkey"
            columns: ["seller_id"]
            isOneToOne: false
            referencedRelation: "sellers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "seller_vendor_roles_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      sellers: {
        Row: {
          avatar_url: string | null
          bio: string | null
          cover_image_url: string | null
          created_at: string
          display_name: string
          id: string
          is_student_verified: boolean
          phone: string | null
          seller_type: Database["public"]["Enums"]["seller_type"]
          status: Database["public"]["Enums"]["seller_status"]
          updated_at: string
          user_id: string
          zalo: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name: string
          id?: string
          is_student_verified?: boolean
          phone?: string | null
          seller_type: Database["public"]["Enums"]["seller_type"]
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
          user_id: string
          zalo?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          cover_image_url?: string | null
          created_at?: string
          display_name?: string
          id?: string
          is_student_verified?: boolean
          phone?: string | null
          seller_type?: Database["public"]["Enums"]["seller_type"]
          status?: Database["public"]["Enums"]["seller_status"]
          updated_at?: string
          user_id?: string
          zalo?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sellers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      student_verifications: {
        Row: {
          created_at: string
          id: string
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["verification_status"]
          student_email: string
          submitted_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_email: string
          submitted_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["verification_status"]
          student_email?: string
          submitted_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_verifications_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_verifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at: string | null
          reviewed_by: string | null
          status: Database["public"]["Enums"]["report_status"]
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_user_id: string
          reporter_id: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_user_id?: string
          reporter_id?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
        }
        Relationships: [
          {
            foreignKeyName: "user_reports_reported_user_id_fkey"
            columns: ["reported_user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reports_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      vendor_media: {
        Row: {
          caption: string | null
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          media_type: Database["public"]["Enums"]["vendor_media_type"]
          sort_order: number
          status: Database["public"]["Enums"]["media_status"]
          storage_path: string
          uploaded_by: string | null
          vendor_id: string
        }
        Insert: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          media_type?: Database["public"]["Enums"]["vendor_media_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_path: string
          uploaded_by?: string | null
          vendor_id: string
        }
        Update: {
          caption?: string | null
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          media_type?: Database["public"]["Enums"]["vendor_media_type"]
          sort_order?: number
          status?: Database["public"]["Enums"]["media_status"]
          storage_path?: string
          uploaded_by?: string | null
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_media_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_media_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          address: string | null
          area: string | null
          cover_image_url: string | null
          created_at: string
          delivery_note: string | null
          description: string | null
          food_categories: string[] | null
          has_delivery: boolean
          id: string
          is_partnered: boolean
          latitude: number | null
          logo_url: string | null
          longitude: number | null
          name: string
          opening_hours: Json | null
          phone: string | null
          price_range_max: number | null
          price_range_min: number | null
          source: Database["public"]["Enums"]["vendor_source"]
          status: Database["public"]["Enums"]["vendor_status"]
          updated_at: string
          vendor_type: Database["public"]["Enums"]["vendor_type"]
          zalo: string | null
        }
        Insert: {
          address?: string | null
          area?: string | null
          cover_image_url?: string | null
          created_at?: string
          delivery_note?: string | null
          description?: string | null
          food_categories?: string[] | null
          has_delivery?: boolean
          id?: string
          is_partnered?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name: string
          opening_hours?: Json | null
          phone?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          source?: Database["public"]["Enums"]["vendor_source"]
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          vendor_type: Database["public"]["Enums"]["vendor_type"]
          zalo?: string | null
        }
        Update: {
          address?: string | null
          area?: string | null
          cover_image_url?: string | null
          created_at?: string
          delivery_note?: string | null
          description?: string | null
          food_categories?: string[] | null
          has_delivery?: boolean
          id?: string
          is_partnered?: boolean
          latitude?: number | null
          logo_url?: string | null
          longitude?: number | null
          name?: string
          opening_hours?: Json | null
          phone?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          source?: Database["public"]["Enums"]["vendor_source"]
          status?: Database["public"]["Enums"]["vendor_status"]
          updated_at?: string
          vendor_type?: Database["public"]["Enums"]["vendor_type"]
          zalo?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin: { Args: never; Returns: boolean }
      is_vendor_seller: { Args: { p_vendor_id: string }; Returns: boolean }
    }
    Enums: {
      fulfillment_method: "pickup" | "seller_delivery"
      item_type: "food" | "drink" | "combo" | "display_product"
      media_status: "visible" | "hidden" | "pending" | "removed"
      order_status: "submitted" | "confirmed" | "completed" | "cancelled"
      report_status: "pending" | "reviewed" | "resolved"
      review_status: "visible" | "hidden" | "pending" | "removed"
      review_type: "vendor" | "menu_item"
      seller_status: "pending" | "active" | "rejected" | "suspended"
      seller_type: "fixed_shop_owner" | "student_seller" | "both"
      user_role: "user" | "seller" | "admin"
      user_status: "active" | "suspended" | "banned" | "deleted"
      user_type: "normal_user" | "student_user"
      vendor_media_type:
        | "cover"
        | "logo"
        | "menu"
        | "food"
        | "booth"
        | "signboard"
        | "space"
        | "other"
      vendor_source: "google_maps" | "manual" | "seller_submitted"
      vendor_status: "pending" | "active" | "hidden" | "rejected" | "duplicate"
      vendor_type: "fixed_shop" | "student_booth"
      verification_status: "pending" | "approved" | "rejected"
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
      fulfillment_method: ["pickup", "seller_delivery"],
      item_type: ["food", "drink", "combo", "display_product"],
      media_status: ["visible", "hidden", "pending", "removed"],
      order_status: ["submitted", "confirmed", "completed", "cancelled"],
      report_status: ["pending", "reviewed", "resolved"],
      review_status: ["visible", "hidden", "pending", "removed"],
      review_type: ["vendor", "menu_item"],
      seller_status: ["pending", "active", "rejected", "suspended"],
      seller_type: ["fixed_shop_owner", "student_seller", "both"],
      user_role: ["user", "seller", "admin"],
      user_status: ["active", "suspended", "banned", "deleted"],
      user_type: ["normal_user", "student_user"],
      vendor_media_type: [
        "cover",
        "logo",
        "menu",
        "food",
        "booth",
        "signboard",
        "space",
        "other",
      ],
      vendor_source: ["google_maps", "manual", "seller_submitted"],
      vendor_status: ["pending", "active", "hidden", "rejected", "duplicate"],
      vendor_type: ["fixed_shop", "student_booth"],
      verification_status: ["pending", "approved", "rejected"],
    },
  },
} as const
