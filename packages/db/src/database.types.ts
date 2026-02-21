// Bu dosya `npm run db:types` komutuyla otomatik üretilir.
// Supabase CLI kurulduktan ve proje bağlantısı yapıldıktan sonra
// manuel düzenleme yapmak yerine şu komutu çalıştır:
//   supabase gen types typescript --project-id <id> > packages/db/src/database.types.ts

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id:             string
          auth_id:        string | null
          role:           Database['public']['Enums']['user_role']
          first_name:     string
          last_name:      string
          email:          string
          phone:          string | null
          phone_verified: boolean
          avatar_url:     string | null
          preferred_lang: string
          is_active:      boolean
          last_seen_at:   string | null
          created_at:     string
          updated_at:     string
        }
        Insert: {
          id?:            string
          auth_id?:       string | null
          role?:          Database['public']['Enums']['user_role']
          first_name:     string
          last_name:      string
          email:          string
          phone?:         string | null
          phone_verified?: boolean
          avatar_url?:    string | null
          preferred_lang?: string
          is_active?:     boolean
          last_seen_at?:  string | null
          created_at?:    string
          updated_at?:    string
        }
        Update: Partial<Database['public']['Tables']['users']['Insert']>
      }
      captain_profiles: {
        Row: {
          id:               string
          user_id:          string
          is_online:        boolean
          current_location: unknown | null   // PostGIS geography
          rating_avg:       number
          rating_count:     number
          total_rides:      number
          commission_rate:  number
          bank_iban:        string | null
          bank_name:        string | null
          onboarded_at:     string | null
          created_at:       string
          updated_at:       string
        }
        Insert: {
          id?:              string
          user_id:          string
          is_online?:       boolean
          current_location?: unknown | null
          rating_avg?:      number
          rating_count?:    number
          total_rides?:     number
          commission_rate?: number
          bank_iban?:       string | null
          bank_name?:       string | null
          onboarded_at?:    string | null
        }
        Update: Partial<Database['public']['Tables']['captain_profiles']['Insert']>
      }
      boats: {
        Row: {
          id:          string
          captain_id:  string
          name:        string
          type:        string | null
          capacity:    number
          license_no:  string
          year_built:  number | null
          color:       string | null
          photo_urls:  string[]
          status:      Database['public']['Enums']['boat_status']
          created_at:  string
          updated_at:  string
        }
        Insert: {
          id?:         string
          captain_id:  string
          name:        string
          type?:       string | null
          capacity?:   number
          license_no:  string
          year_built?: number | null
          color?:      string | null
          photo_urls?: string[]
          status?:     Database['public']['Enums']['boat_status']
        }
        Update: Partial<Database['public']['Tables']['boats']['Insert']>
      }
      captain_documents: {
        Row: {
          id:             string
          user_id:        string
          document_type:  string
          file_url:       string
          status:         Database['public']['Enums']['document_status']
          expires_at:     string | null
          reviewed_by:    string | null
          reviewed_at:    string | null
          rejection_note: string | null
          created_at:     string
        }
        Insert: {
          id?:            string
          user_id:        string
          document_type:  string
          file_url:       string
          status?:        Database['public']['Enums']['document_status']
          expires_at?:    string | null
        }
        Update: Partial<Database['public']['Tables']['captain_documents']['Insert']>
      }
      rides: {
        Row: {
          id:                   string
          customer_id:          string
          captain_id:           string | null
          boat_id:              string | null
          status:               Database['public']['Enums']['ride_status']
          pickup_location:      unknown         // PostGIS geography
          pickup_label:         string | null
          dropoff_location:     unknown | null
          dropoff_label:        string | null
          distance_meters:      number | null
          estimated_price:      number | null
          final_price:          number | null
          currency:             string
          passenger_count:      number
          requested_at:         string
          accepted_at:          string | null
          captain_arrived_at:   string | null
          started_at:           string | null
          completed_at:         string | null
          cancelled_at:         string | null
          cancellation_reason:  string | null
          cancelled_by:         string | null
          customer_note:        string | null
          dispatcher_note:      string | null
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:               string
          customer_id:       string
          captain_id?:       string | null
          boat_id?:          string | null
          status?:           Database['public']['Enums']['ride_status']
          pickup_location:   unknown
          pickup_label?:     string | null
          dropoff_location?: unknown | null
          dropoff_label?:    string | null
          estimated_price?:  number | null
          currency?:         string
          passenger_count?:  number
          customer_note?:    string | null
        }
        Update: Partial<Database['public']['Tables']['rides']['Insert']>
      }
      payments: {
        Row: {
          id:                   string
          ride_id:              string
          customer_id:          string
          provider:             Database['public']['Enums']['payment_provider']
          provider_payment_id:  string | null
          provider_intent_id:   string | null
          amount:               number
          currency:             string
          status:               Database['public']['Enums']['payment_status']
          refund_amount:        number | null
          refund_reason:        string | null
          invoice_url:          string | null
          invoice_number:       string | null
          metadata:             Json
          captured_at:          string | null
          refunded_at:          string | null
          created_at:           string
          updated_at:           string
        }
        Insert: {
          id?:                  string
          ride_id:              string
          customer_id:          string
          provider:             Database['public']['Enums']['payment_provider']
          provider_payment_id?: string | null
          provider_intent_id?:  string | null
          amount:               number
          currency?:            string
          status?:              Database['public']['Enums']['payment_status']
          metadata?:            Json
        }
        Update: Partial<Database['public']['Tables']['payments']['Insert']>
      }
      payouts: {
        Row: {
          id:           string
          captain_id:   string
          period_start: string
          period_end:   string
          gross_amount: number
          commission:   number
          net_amount:   number
          ride_count:   number
          status:       string
          sent_at:      string | null
          reference_no: string | null
          created_at:   string
        }
        Insert: {
          id?:          string
          captain_id:   string
          period_start: string
          period_end:   string
          gross_amount: number
          commission:   number
          net_amount:   number
          ride_count?:  number
          status?:      string
        }
        Update: Partial<Database['public']['Tables']['payouts']['Insert']>
      }
      reviews: {
        Row: {
          id:          string
          ride_id:     string
          customer_id: string
          captain_id:  string
          rating:      number
          comment:     string | null
          is_visible:  boolean
          created_at:  string
        }
        Insert: {
          id?:         string
          ride_id:     string
          customer_id: string
          captain_id:  string
          rating:      number
          comment?:    string | null
          is_visible?: boolean
        }
        Update: Partial<Database['public']['Tables']['reviews']['Insert']>
      }
      notification_logs: {
        Row: {
          id:           string
          user_id:      string
          ride_id:      string | null
          type:         Database['public']['Enums']['notification_type']
          channel:      Database['public']['Enums']['notification_channel']
          title:        string | null
          body:         string | null
          data:         Json
          onesignal_id: string | null
          is_read:      boolean
          sent_at:      string
          read_at:      string | null
        }
        Insert: {
          id?:          string
          user_id:      string
          ride_id?:     string | null
          type:         Database['public']['Enums']['notification_type']
          channel:      Database['public']['Enums']['notification_channel']
          title?:       string | null
          body?:        string | null
          data?:        Json
          onesignal_id?: string | null
        }
        Update: Partial<Database['public']['Tables']['notification_logs']['Insert']>
      }
      pricing_rules: {
        Row: {
          id:          string
          name:        string
          base_fare:   number
          per_km_rate: number
          min_fare:    number
          currency:    string
          valid_from:  string
          valid_until: string | null
          is_active:   boolean
          created_at:  string
        }
        Insert: {
          id?:         string
          name:        string
          base_fare:   number
          per_km_rate: number
          min_fare:    number
          currency?:   string
          valid_from:  string
          valid_until?: string | null
          is_active?:  boolean
        }
        Update: Partial<Database['public']['Tables']['pricing_rules']['Insert']>
      }
    }
    Views: {
      v_active_rides: {
        Row: {
          id:               string
          status:           string
          pickup_label:     string | null
          dropoff_label:    string | null
          passenger_count:  number
          estimated_price:  number | null
          requested_at:     string
          accepted_at:      string | null
          customer_name:    string
          customer_phone:   string | null
          captain_name:     string | null
          captain_phone:    string | null
          boat_name:        string | null
          captain_location: unknown | null
        }
      }
      v_captain_earnings: {
        Row: {
          captain_id:          string
          captain_name:        string
          completed_rides:     number
          gross_earnings:      number | null
          platform_commission: number | null
          net_earnings:        number | null
        }
      }
    }
    Enums: {
      user_role:            'customer' | 'captain' | 'dispatcher' | 'admin'
      ride_status:          'pending' | 'accepted' | 'captain_en_route' | 'in_progress' | 'completed' | 'cancelled_by_customer' | 'cancelled_by_captain' | 'no_captain_found'
      payment_provider:     'stripe' | 'iyzico'
      payment_status:       'pending' | 'authorized' | 'captured' | 'failed' | 'refunded' | 'partially_refunded'
      notification_channel: 'push' | 'sms' | 'email'
      notification_type:    'ride_requested' | 'ride_accepted' | 'captain_en_route' | 'ride_started' | 'ride_completed' | 'ride_cancelled' | 'payment_received' | 'payment_failed' | 'payout_sent' | 'review_received'
      boat_status:          'active' | 'inactive' | 'suspended'
      document_status:      'pending' | 'approved' | 'rejected' | 'expired'
    }
  }
}
