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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      analytics: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          ip_address: unknown
          referrer: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          ip_address?: unknown
          referrer?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "analytics_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      bookmarks: {
        Row: {
          content_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          content_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          content_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          name: string
          slug: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          slug: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      category_follows: {
        Row: {
          category_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          category_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          category_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "category_follows_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          comment_text: string
          content_id: string | null
          created_at: string | null
          id: string
          likes_count: number | null
          parent_id: string | null
          status: Database["public"]["Enums"]["comment_status"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          comment_text: string
          content_id?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          comment_text?: string
          content_id?: string | null
          created_at?: string | null
          id?: string
          likes_count?: number | null
          parent_id?: string | null
          status?: Database["public"]["Enums"]["comment_status"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comments_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      content: {
        Row: {
          author_id: string
          category_id: string | null
          content: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at: string | null
          excerpt: string | null
          featured_image: string | null
          id: string
          is_featured: boolean | null
          likes_count: number | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          reading_time: number | null
          slug: string
          status: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at: string | null
          views_count: number | null
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content?: string | null
          content_type: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug: string
          status?: Database["public"]["Enums"]["content_status"] | null
          title: string
          updated_at?: string | null
          views_count?: number | null
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content?: string | null
          content_type?: Database["public"]["Enums"]["content_type"]
          created_at?: string | null
          excerpt?: string | null
          featured_image?: string | null
          id?: string
          is_featured?: boolean | null
          likes_count?: number | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          reading_time?: number | null
          slug?: string
          status?: Database["public"]["Enums"]["content_status"] | null
          title?: string
          updated_at?: string | null
          views_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "content_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      content_sources: {
        Row: {
          content_id: string | null
          id: string
          last_updated: string | null
          scraped_at: string | null
          source_name: string
          source_type: string | null
          source_url: string
        }
        Insert: {
          content_id?: string | null
          id?: string
          last_updated?: string | null
          scraped_at?: string | null
          source_name: string
          source_type?: string | null
          source_url: string
        }
        Update: {
          content_id?: string | null
          id?: string
          last_updated?: string | null
          scraped_at?: string | null
          source_name?: string
          source_type?: string | null
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_sources_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      content_tags: {
        Row: {
          content_id: string
          tag_id: string
        }
        Insert: {
          content_id: string
          tag_id: string
        }
        Update: {
          content_id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_tags_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "content_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      newsletter_queue: {
        Row: {
          content_ids: string[]
          id: string
          recipient_count: number | null
          sent_at: string | null
          status: string | null
        }
        Insert: {
          content_ids: string[]
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Update: {
          content_ids?: string[]
          id?: string
          recipient_count?: number | null
          sent_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      newsletter_subscriptions: {
        Row: {
          email: string
          id: string
          is_active: boolean | null
          subscribed_at: string | null
          unsubscribed_at: string | null
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean | null
          subscribed_at?: string | null
          unsubscribed_at?: string | null
        }
        Relationships: []
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
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          link?: string | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      product_specs: {
        Row: {
          content_id: string | null
          created_at: string | null
          display_order: number | null
          id: string
          spec_category: string
          spec_name: string
          spec_unit: string | null
          spec_value: string
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          spec_category: string
          spec_name: string
          spec_unit?: string | null
          spec_value: string
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          display_order?: number | null
          id?: string
          spec_category?: string
          spec_name?: string
          spec_unit?: string | null
          spec_value?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_specs_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email_notifications: boolean | null
          full_name: string | null
          id: string
          is_active: boolean | null
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email_notifications?: boolean | null
          full_name?: string | null
          id?: string
          is_active?: boolean | null
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
      purchase_links: {
        Row: {
          availability_status: string | null
          content_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          is_primary: boolean | null
          price: number | null
          product_url: string
          retailer_name: string
          updated_at: string | null
        }
        Insert: {
          availability_status?: string | null
          content_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_primary?: boolean | null
          price?: number | null
          product_url: string
          retailer_name: string
          updated_at?: string | null
        }
        Update: {
          availability_status?: string | null
          content_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          is_primary?: boolean | null
          price?: number | null
          product_url?: string
          retailer_name?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_links_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      review_details: {
        Row: {
          brand: string | null
          cons: string[] | null
          content_id: string | null
          created_at: string | null
          id: string
          images: string[] | null
          model: string | null
          overall_rating: number | null
          price: number | null
          product_name: string
          pros: string[] | null
          specifications: Json | null
        }
        Insert: {
          brand?: string | null
          cons?: string[] | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          model?: string | null
          overall_rating?: number | null
          price?: number | null
          product_name: string
          pros?: string[] | null
          specifications?: Json | null
        }
        Update: {
          brand?: string | null
          cons?: string[] | null
          content_id?: string | null
          created_at?: string | null
          id?: string
          images?: string[] | null
          model?: string | null
          overall_rating?: number | null
          price?: number | null
          product_name?: string
          pros?: string[] | null
          specifications?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "review_details_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: Json
        }
        Relationships: []
      }
      tags: {
        Row: {
          created_at: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          content_id: string | null
          created_at: string | null
          id: string
          interaction_type: string
          user_id: string | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type: string
          user_id?: string | null
        }
        Update: {
          content_id?: string | null
          created_at?: string | null
          id?: string
          interaction_type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interactions_content_id_fkey"
            columns: ["content_id"]
            isOneToOne: false
            referencedRelation: "content"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_interactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_average_price: { Args: { content_id_param: string }; Returns: number }
      get_current_user_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      has_role: {
        Args: {
          required_role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Returns: boolean
      }
      increment_content_views: {
        Args: { content_id_param: string }
        Returns: undefined
      }
      is_admin_user: { Args: { user_id?: string }; Returns: boolean }
      promote_to_admin: { Args: { user_email: string }; Returns: undefined }
    }
    Enums: {
      comment_status: "pending" | "approved" | "rejected" | "spam"
      content_status: "draft" | "pending" | "published" | "archived"
      content_type: "news" | "review" | "video" | "how_to" | "comparison"
      user_role: "user" | "author" | "editor" | "admin"
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
      comment_status: ["pending", "approved", "rejected", "spam"],
      content_status: ["draft", "pending", "published", "archived"],
      content_type: ["news", "review", "video", "how_to", "comparison"],
      user_role: ["user", "author", "editor", "admin"],
    },
  },
} as const
