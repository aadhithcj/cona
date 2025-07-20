export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      admin_users: {
        Row: {
          id: string
          is_admin: boolean | null
        }
        Insert: {
          id: string
          is_admin?: boolean | null
        }
        Update: {
          id?: string
          is_admin?: boolean | null
        }
        Relationships: []
      }
      cvs: {
        Row: {
          address: string | null
          applicant_name: string
          application_date: string | null
          availability_for_remote_work: boolean | null
          avatar_url: string | null
          career_goals: string | null
          certifications: string | null
          created_at: string | null
          current_job_title: string | null
          desired_salary: string | null
          education: string | null
          email: string | null
          github_profile: string | null
          id: string
          industry_experience: string | null
          job_id: string | null
          languages_known: string[] | null
          linkedin_profile: string | null
          phone: string | null
          pipeline_status: string | null
          portfolio_link: string | null
          rating: number | null
          references: string | null
          requirements_match: number | null
          skills: string[]
          status: string | null
          theme: string | null
          updated_at: string | null
          user_id: string | null
          willingness_to_relocate: boolean | null
          years_experience: number
        }
        Insert: {
          address?: string | null
          applicant_name: string
          application_date?: string | null
          availability_for_remote_work?: boolean | null
          avatar_url?: string | null
          career_goals?: string | null
          certifications?: string | null
          created_at?: string | null
          current_job_title?: string | null
          desired_salary?: string | null
          education?: string | null
          email?: string | null
          github_profile?: string | null
          id?: string
          industry_experience?: string | null
          job_id?: string | null
          languages_known?: string[] | null
          linkedin_profile?: string | null
          phone?: string | null
          pipeline_status?: string | null
          portfolio_link?: string | null
          rating?: number | null
          references?: string | null
          requirements_match?: number | null
          skills: string[]
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
          willingness_to_relocate?: boolean | null
          years_experience: number
        }
        Update: {
          address?: string | null
          applicant_name?: string
          application_date?: string | null
          availability_for_remote_work?: boolean | null
          avatar_url?: string | null
          career_goals?: string | null
          certifications?: string | null
          created_at?: string | null
          current_job_title?: string | null
          desired_salary?: string | null
          education?: string | null
          email?: string | null
          github_profile?: string | null
          id?: string
          industry_experience?: string | null
          job_id?: string | null
          languages_known?: string[] | null
          linkedin_profile?: string | null
          phone?: string | null
          pipeline_status?: string | null
          portfolio_link?: string | null
          rating?: number | null
          references?: string | null
          requirements_match?: number | null
          skills?: string[]
          status?: string | null
          theme?: string | null
          updated_at?: string | null
          user_id?: string | null
          willingness_to_relocate?: boolean | null
          years_experience?: number
        }
        Relationships: [
          {
            foreignKeyName: "cvs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "job_postings"
            referencedColumns: ["id"]
          },
        ]
      }
      interviews: {
        Row: {
          created_at: string | null
          cv_id: string | null
          feedback: string | null
          id: string
          recruiter_id: string | null
          scheduled_at: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          cv_id?: string | null
          feedback?: string | null
          id?: string
          recruiter_id?: string | null
          scheduled_at: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          cv_id?: string | null
          feedback?: string | null
          id?: string
          recruiter_id?: string | null
          scheduled_at?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "interviews_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_postings: {
        Row: {
          applications: number
          applications_count: number | null
          created_at: string | null
          deadline: string | null
          department: string
          description: string
          id: string
          location: string
          office_location: string | null
          requirements: string
          salary_max: number | null
          salary_min: number | null
          status: string
          title: string
          type: string
          updated_at: string | null
        }
        Insert: {
          applications?: number
          applications_count?: number | null
          created_at?: string | null
          deadline?: string | null
          department: string
          description: string
          id?: string
          location: string
          office_location?: string | null
          requirements: string
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title: string
          type: string
          updated_at?: string | null
        }
        Update: {
          applications?: number
          applications_count?: number | null
          created_at?: string | null
          deadline?: string | null
          department?: string
          description?: string
          id?: string
          location?: string
          office_location?: string | null
          requirements?: string
          salary_max?: number | null
          salary_min?: number | null
          status?: string
          title?: string
          type?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          created_at: string | null
          cv_id: string | null
          id: string
          message: string
          read: boolean | null
        }
        Insert: {
          created_at?: string | null
          cv_id?: string | null
          id?: string
          message: string
          read?: boolean | null
        }
        Update: {
          created_at?: string | null
          cv_id?: string | null
          id?: string
          message?: string
          read?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_cv_id_fkey"
            columns: ["cv_id"]
            isOneToOne: false
            referencedRelation: "cvs"
            referencedColumns: ["id"]
          },
        ]
      }
      positions: {
        Row: {
          created_at: string | null
          department: string | null
          id: string
          requirements: string[] | null
          status: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          department?: string | null
          id?: string
          requirements?: string[] | null
          status?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          department?: string | null
          id?: string
          requirements?: string[] | null
          status?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      settings: {
        Row: {
          company_name: string
          created_at: string | null
          default_sort_criteria: string | null
          default_sort_order: string | null
          id: string
          recruiter_avatar_url: string | null
          recruiter_name: string | null
          updated_at: string | null
        }
        Insert: {
          company_name?: string
          created_at?: string | null
          default_sort_criteria?: string | null
          default_sort_order?: string | null
          id?: string
          recruiter_avatar_url?: string | null
          recruiter_name?: string | null
          updated_at?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string | null
          default_sort_criteria?: string | null
          default_sort_order?: string | null
          id?: string
          recruiter_avatar_url?: string | null
          recruiter_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_is_admin: {
        Args: { user_id: string }
        Returns: boolean
      }
      increment_job_applications: {
        Args: { job_id: string }
        Returns: undefined
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
