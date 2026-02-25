export type Database = {
  public: {
    Tables: {
      clients: {
        Row: {
          id: string;
          name: string;
          industry: string | null;
          company_size: string | null;
          primary_contact_name: string | null;
          primary_contact_email: string | null;
          risk_tolerance: 'low' | 'medium' | 'high' | null;
          notes: string | null;
          share_token: string | null;
          share_enabled: boolean;
          share_expires_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          industry?: string | null;
          company_size?: string | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          risk_tolerance?: 'low' | 'medium' | 'high' | null;
          notes?: string | null;
          share_token?: string | null;
          share_enabled?: boolean;
          share_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          industry?: string | null;
          company_size?: string | null;
          primary_contact_name?: string | null;
          primary_contact_email?: string | null;
          risk_tolerance?: 'low' | 'medium' | 'high' | null;
          notes?: string | null;
          share_token?: string | null;
          share_enabled?: boolean;
          share_expires_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      processes: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          category: 'sales' | 'marketing' | 'operations' | 'customer support' | 'finance' | 'other' | null;
          description: string | null;
          owner_role: string | null;
          frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad hoc' | null;
          trigger: string | null;
          desired_outcome: string | null;
          is_customer_facing: boolean;
          is_compliance_sensitive: boolean;
          documentation_completeness_score: number;
          automation_potential_score: number;
          data_risk_score: number;
          literacy_fit_score: number;
          client_approved_description: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          category?: 'sales' | 'marketing' | 'operations' | 'customer support' | 'finance' | 'other' | null;
          description?: string | null;
          owner_role?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad hoc' | null;
          trigger?: string | null;
          desired_outcome?: string | null;
          is_customer_facing?: boolean;
          is_compliance_sensitive?: boolean;
          documentation_completeness_score?: number;
          automation_potential_score?: number;
          data_risk_score?: number;
          literacy_fit_score?: number;
          client_approved_description?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          category?: 'sales' | 'marketing' | 'operations' | 'customer support' | 'finance' | 'other' | null;
          description?: string | null;
          owner_role?: string | null;
          frequency?: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'ad hoc' | null;
          trigger?: string | null;
          desired_outcome?: string | null;
          is_customer_facing?: boolean;
          is_compliance_sensitive?: boolean;
          documentation_completeness_score?: number;
          automation_potential_score?: number;
          data_risk_score?: number;
          literacy_fit_score?: number;
          client_approved_description?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      process_steps: {
        Row: {
          id: string;
          process_id: string;
          step_order: number;
          title: string | null;
          description: string | null;
          tool_id: string | null;
          role_id: string | null;
          average_time_minutes: number | null;
          estimated_duration_minutes: number | null;
          is_rule_based: 'mostly_rules' | 'mixed' | 'mostly_judgment' | null;
          risk_notes: string | null;
        };
        Insert: {
          id?: string;
          process_id: string;
          step_order: number;
          title?: string | null;
          description?: string | null;
          tool_id?: string | null;
          role_id?: string | null;
          average_time_minutes?: number | null;
          estimated_duration_minutes?: number | null;
          is_rule_based?: 'mostly_rules' | 'mixed' | 'mostly_judgment' | null;
          risk_notes?: string | null;
        };
        Update: {
          id?: string;
          process_id?: string;
          step_order?: number;
          title?: string | null;
          description?: string | null;
          tool_id?: string | null;
          role_id?: string | null;
          average_time_minutes?: number | null;
          estimated_duration_minutes?: number | null;
          is_rule_based?: 'mostly_rules' | 'mixed' | 'mostly_judgment' | null;
          risk_notes?: string | null;
        };
      };
      tools: {
        Row: {
          id: string;
          name: string;
          type: string | null;
          vendor: string | null;
          plan_name: string | null;
          billing_cycle: 'monthly' | 'yearly' | null;
          subscription_cost: number | null;
          num_seats: number | null;
          contract_notes: string | null;
          monthly_cost: number | null;
        };
        Insert: {
          id?: string;
          name: string;
          type?: string | null;
          vendor?: string | null;
          plan_name?: string | null;
          billing_cycle?: 'monthly' | 'yearly' | null;
          subscription_cost?: number | null;
          num_seats?: number | null;
          contract_notes?: string | null;
          monthly_cost?: number | null;
        };
        Update: {
          id?: string;
          name?: string;
          type?: string | null;
          vendor?: string | null;
          plan_name?: string | null;
          billing_cycle?: 'monthly' | 'yearly' | null;
          subscription_cost?: number | null;
          num_seats?: number | null;
          contract_notes?: string | null;
          monthly_cost?: number | null;
        };
      };
      roles: {
        Row: {
          id: string;
          client_id: string;
          title: string;
          description: string | null;
          hourly_rate: number | null;
          employment_type: 'employee' | 'contractor' | null;
          department: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          title: string;
          description?: string | null;
          hourly_rate?: number | null;
          employment_type?: 'employee' | 'contractor' | null;
          department?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          title?: string;
          description?: string | null;
          hourly_rate?: number | null;
          employment_type?: 'employee' | 'contractor' | null;
          department?: string | null;
        };
      };
      people: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          email: string | null;
          role_id: string | null;
          hourly_rate_override: number | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          email?: string | null;
          role_id?: string | null;
          hourly_rate_override?: number | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          email?: string | null;
          role_id?: string | null;
          hourly_rate_override?: number | null;
        };
      };
      literacy_assessments: {
        Row: {
          id: string;
          person_id: string;
          assessment_date: string;
          overall_level: 'novice' | 'basic' | 'applied' | 'optimizer' | null;
          score_numeric: number | null;
          self_confidence_level: 'low' | 'medium' | 'high' | null;
          notes: string | null;
        };
        Insert: {
          id?: string;
          person_id: string;
          assessment_date?: string;
          overall_level?: 'novice' | 'basic' | 'applied' | 'optimizer' | null;
          score_numeric?: number | null;
          self_confidence_level?: 'low' | 'medium' | 'high' | null;
          notes?: string | null;
        };
        Update: {
          id?: string;
          person_id?: string;
          assessment_date?: string;
          overall_level?: 'novice' | 'basic' | 'applied' | 'optimizer' | null;
          score_numeric?: number | null;
          self_confidence_level?: 'low' | 'medium' | 'high' | null;
          notes?: string | null;
        };
      };
      data_sources: {
        Row: {
          id: string;
          client_id: string;
          name: string;
          system_name: string | null;
          data_type: 'structured' | 'documents' | 'email/messages' | 'audio/video' | 'other' | null;
          owner_role: string | null;
          update_frequency: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'ad hoc' | null;
          is_source_of_truth: boolean;
          description: string | null;
        };
        Insert: {
          id?: string;
          client_id: string;
          name: string;
          system_name?: string | null;
          data_type?: 'structured' | 'documents' | 'email/messages' | 'audio/video' | 'other' | null;
          owner_role?: string | null;
          update_frequency?: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'ad hoc' | null;
          is_source_of_truth?: boolean;
          description?: string | null;
        };
        Update: {
          id?: string;
          client_id?: string;
          name?: string;
          system_name?: string | null;
          data_type?: 'structured' | 'documents' | 'email/messages' | 'audio/video' | 'other' | null;
          owner_role?: string | null;
          update_frequency?: 'real-time' | 'daily' | 'weekly' | 'monthly' | 'ad hoc' | null;
          is_source_of_truth?: boolean;
          description?: string | null;
        };
      };
      data_trust_profiles: {
        Row: {
          id: string;
          data_source_id: string;
          completeness: 'low' | 'medium' | 'high' | null;
          accuracy: 'low' | 'medium' | 'high' | null;
          timeliness: 'low' | 'medium' | 'high' | null;
          governance: 'low' | 'medium' | 'high' | null;
          overall_risk_score: number;
          notes: string | null;
        };
        Insert: {
          id?: string;
          data_source_id: string;
          completeness?: 'low' | 'medium' | 'high' | null;
          accuracy?: 'low' | 'medium' | 'high' | null;
          timeliness?: 'low' | 'medium' | 'high' | null;
          governance?: 'low' | 'medium' | 'high' | null;
          overall_risk_score?: number;
          notes?: string | null;
        };
        Update: {
          id?: string;
          data_source_id?: string;
          completeness?: 'low' | 'medium' | 'high' | null;
          accuracy?: 'low' | 'medium' | 'high' | null;
          timeliness?: 'low' | 'medium' | 'high' | null;
          governance?: 'low' | 'medium' | 'high' | null;
          overall_risk_score?: number;
          notes?: string | null;
        };
      };
      process_data_sources: {
        Row: {
          id: string;
          process_id: string;
          data_source_id: string;
        };
        Insert: {
          id?: string;
          process_id: string;
          data_source_id: string;
        };
        Update: {
          id?: string;
          process_id?: string;
          data_source_id?: string;
        };
      };
    };
  };
};
