export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      disaster_events: {
        Row: {
          aftershocks_label: string | null;
          created_at: string;
          depth_km: number | null;
          epicenter_label: string | null;
          event_type: string;
          headline: string | null;
          id: string;
          latitude: number | null;
          longitude: number | null;
          magnitude: number | null;
          name: string;
          occurred_at: string;
          slug: string;
          status: Database["public"]["Enums"]["disaster_status"];
          summary: string | null;
          updated_at: string;
        };
        Insert: {
          aftershocks_label?: string | null;
          created_at?: string;
          depth_km?: number | null;
          epicenter_label?: string | null;
          event_type?: string;
          headline?: string | null;
          id?: string;
          latitude?: number | null;
          longitude?: number | null;
          magnitude?: number | null;
          name: string;
          occurred_at: string;
          slug: string;
          status?: Database["public"]["Enums"]["disaster_status"];
          summary?: string | null;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["disaster_events"]["Insert"]>;
        Relationships: [];
      };
      donation_destinations: {
        Row: {
          approved_hostname: string;
          created_at: string;
          destination_url: string;
          health_detail: string | null;
          health_status: Database["public"]["Enums"]["donation_health_status"];
          id: string;
          is_enabled: boolean;
          last_checked_at: string | null;
          last_health_error_at: string | null;
          needs_review: boolean;
          organization_id: string;
          updated_at: string;
          verification_status: Database["public"]["Enums"]["verification_status"];
          verified_at: string | null;
        };
        Insert: {
          approved_hostname: string;
          created_at?: string;
          destination_url: string;
          health_detail?: string | null;
          health_status?: Database["public"]["Enums"]["donation_health_status"];
          id?: string;
          is_enabled?: boolean;
          last_checked_at?: string | null;
          last_health_error_at?: string | null;
          needs_review?: boolean;
          organization_id: string;
          updated_at?: string;
          verification_status?: Database["public"]["Enums"]["verification_status"];
          verified_at?: string | null;
        };
        Update: Partial<
          Database["public"]["Tables"]["donation_destinations"]["Insert"]
        >;
        Relationships: [
          {
            foreignKeyName: "donation_destinations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      funding_flows: {
        Row: {
          id: string;
          disaster_id: string;
          external_id: string;
          donor: string | null;
          recipient: string | null;
          amount_usd: number;
          status: Database["public"]["Enums"]["funding_status"];
          upstream_status: string | null;
          sector: string | null;
          source_url: string | null;
          reported_at: string | null;
          retrieved_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          disaster_id: string;
          external_id: string;
          donor?: string | null;
          recipient?: string | null;
          amount_usd: number;
          status?: Database["public"]["Enums"]["funding_status"];
          upstream_status?: string | null;
          sector?: string | null;
          source_url?: string | null;
          reported_at?: string | null;
          retrieved_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["funding_flows"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "funding_flows_disaster_id_fkey";
            columns: ["disaster_id"];
            isOneToOne: false;
            referencedRelation: "disaster_events";
            referencedColumns: ["id"];
          },
        ];
      };
      ifrc_operations: {
        Row: {
          id: string;
          disaster_id: string;
          organization_id: string | null;
          external_event_id: string;
          external_appeal_id: string | null;
          appeal_code: string | null;
          appeal_name: string | null;
          appeal_status: string | null;
          event_name: string | null;
          target_population: number | null;
          people_reached: number | null;
          amount_requested: number | null;
          amount_funded: number | null;
          currency_code: string | null;
          activities: string[];
          activity_summary: string | null;
          source_url: string;
          reported_at: string | null;
          retrieved_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          disaster_id: string;
          organization_id?: string | null;
          external_event_id: string;
          external_appeal_id?: string | null;
          appeal_code?: string | null;
          appeal_name?: string | null;
          appeal_status?: string | null;
          event_name?: string | null;
          target_population?: number | null;
          people_reached?: number | null;
          amount_requested?: number | null;
          amount_funded?: number | null;
          currency_code?: string | null;
          activities?: string[];
          activity_summary?: string | null;
          source_url: string;
          reported_at?: string | null;
          retrieved_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ifrc_operations"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ifrc_operations_disaster_id_fkey";
            columns: ["disaster_id"];
            isOneToOne: false;
            referencedRelation: "disaster_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ifrc_operations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      ifrc_ops_updates: {
        Row: {
          id: string;
          disaster_id: string;
          operation_id: string | null;
          external_id: string;
          title: string;
          document_url: string | null;
          published_at: string | null;
          retrieved_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          disaster_id: string;
          operation_id?: string | null;
          external_id: string;
          title: string;
          document_url?: string | null;
          published_at?: string | null;
          retrieved_at?: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["ifrc_ops_updates"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "ifrc_ops_updates_disaster_id_fkey";
            columns: ["disaster_id"];
            isOneToOne: false;
            referencedRelation: "disaster_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "ifrc_ops_updates_operation_id_fkey";
            columns: ["operation_id"];
            isOneToOne: false;
            referencedRelation: "ifrc_operations";
            referencedColumns: ["id"];
          },
        ];
      };
      impact_metrics: {
        Row: {
          created_at: string;
          department: string | null;
          detail: string | null;
          disaster_id: string;
          display_value: string | null;
          id: string;
          metric_type: Database["public"]["Enums"]["metric_type"];
          municipality: string | null;
          reported_at: string | null;
          retrieved_at: string;
          source_id: string | null;
          source_url: string | null;
          unit: string;
          value: number;
        };
        Insert: {
          created_at?: string;
          department?: string | null;
          detail?: string | null;
          disaster_id: string;
          display_value?: string | null;
          id?: string;
          metric_type: Database["public"]["Enums"]["metric_type"];
          municipality?: string | null;
          reported_at?: string | null;
          retrieved_at?: string;
          source_id?: string | null;
          source_url?: string | null;
          unit?: string;
          value: number;
        };
        Update: Partial<Database["public"]["Tables"]["impact_metrics"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "impact_metrics_disaster_id_fkey";
            columns: ["disaster_id"];
            isOneToOne: false;
            referencedRelation: "disaster_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "impact_metrics_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          accent: string;
          active: boolean;
          created_at: string;
          id: string;
          logo_url: string | null;
          name: string;
          organization_type: string | null;
          short_description: string | null;
          slug: string;
          sort_order: number;
          updated_at: string;
          website_url: string | null;
        };
        Insert: {
          accent?: string;
          active?: boolean;
          created_at?: string;
          id?: string;
          logo_url?: string | null;
          name: string;
          organization_type?: string | null;
          short_description?: string | null;
          slug: string;
          sort_order?: number;
          updated_at?: string;
          website_url?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
        Relationships: [];
      };
      regions: {
        Row: {
          affected_count: number | null;
          affected_display: string | null;
          deaths: number | null;
          deaths_display: string | null;
          department_code: string | null;
          disaster_id: string;
          displaced: number | null;
          geometry: Json | null;
          id: string;
          injured: number | null;
          name: string;
          severity: Database["public"]["Enums"]["severity_level"];
          updated_at: string;
        };
        Insert: {
          affected_count?: number | null;
          affected_display?: string | null;
          deaths?: number | null;
          deaths_display?: string | null;
          department_code?: string | null;
          disaster_id: string;
          displaced?: number | null;
          geometry?: Json | null;
          id: string;
          injured?: number | null;
          name: string;
          severity?: Database["public"]["Enums"]["severity_level"];
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["regions"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "regions_disaster_id_fkey";
            columns: ["disaster_id"];
            isOneToOne: false;
            referencedRelation: "disaster_events";
            referencedColumns: ["id"];
          },
        ];
      };
      sources: {
        Row: {
          active: boolean;
          base_url: string | null;
          created_at: string;
          id: string;
          name: string;
          source_type: string;
          trust_tier: Database["public"]["Enums"]["trust_tier"];
        };
        Insert: {
          active?: boolean;
          base_url?: string | null;
          created_at?: string;
          id?: string;
          name: string;
          source_type?: string;
          trust_tier?: Database["public"]["Enums"]["trust_tier"];
        };
        Update: Partial<Database["public"]["Tables"]["sources"]["Insert"]>;
        Relationships: [];
      };
      updates: {
        Row: {
          accent: string;
          created_at: string;
          disaster_id: string;
          external_id: string | null;
          id: string;
          published_at: string | null;
          retrieved_at: string;
          source_id: string | null;
          source_url: string | null;
          summary: string | null;
          title: string;
        };
        Insert: {
          accent?: string;
          created_at?: string;
          disaster_id: string;
          external_id?: string | null;
          id?: string;
          published_at?: string | null;
          retrieved_at?: string;
          source_id?: string | null;
          source_url?: string | null;
          summary?: string | null;
          title: string;
        };
        Update: Partial<Database["public"]["Tables"]["updates"]["Insert"]>;
        Relationships: [
          {
            foreignKeyName: "updates_disaster_id_fkey";
            columns: ["disaster_id"];
            isOneToOne: false;
            referencedRelation: "disaster_events";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "updates_source_id_fkey";
            columns: ["source_id"];
            isOneToOne: false;
            referencedRelation: "sources";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      disaster_status: "draft" | "published" | "archived";
      metric_type:
        | "deaths"
        | "injured"
        | "affected"
        | "displaced"
        | "aftershocks";
      severity_level: "severe" | "high" | "moderate" | "low";
      trust_tier: "official" | "humanitarian" | "verified_media" | "other";
      verification_status: "pending" | "verified" | "disabled" | "rejected";
      donation_health_status: "unknown" | "healthy" | "unhealthy";
      funding_status: "pledged" | "committed" | "received" | "unknown";
    };
    CompositeTypes: Record<string, never>;
  };
};
