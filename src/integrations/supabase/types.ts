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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      ad_budget_reloads: {
        Row: {
          amount: number
          created_at: string
          failure_reason: string | null
          id: string
          last_retry_at: string | null
          payment_status: string
          platforms: string[]
          retry_count: number | null
          service_fee: number
          stripe_payment_intent_id: string | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          last_retry_at?: string | null
          payment_status?: string
          platforms: string[]
          retry_count?: number | null
          service_fee?: number
          stripe_payment_intent_id?: string | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          failure_reason?: string | null
          id?: string
          last_retry_at?: string | null
          payment_status?: string
          platforms?: string[]
          retry_count?: number | null
          service_fee?: number
          stripe_payment_intent_id?: string | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ad_spend_tracking: {
        Row: {
          amount: number
          billed: boolean
          billing_period_end: string
          billing_period_start: string
          campaign_id: string | null
          created_at: string
          currency: string
          id: string
          platform: string
          spend_date: string
          stripe_invoice_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          billed?: boolean
          billing_period_end: string
          billing_period_start: string
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform: string
          spend_date?: string
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          billed?: boolean
          billing_period_end?: string
          billing_period_start?: string
          campaign_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          platform?: string
          spend_date?: string
          stripe_invoice_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_spend_tracking_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_variants: {
        Row: {
          body_copy: string | null
          campaign_id: string
          created_at: string | null
          creative_url: string | null
          cta_text: string | null
          headline: string | null
          id: string
          predicted_roas: number | null
          variant_set: string | null
          variant_type: string
        }
        Insert: {
          body_copy?: string | null
          campaign_id: string
          created_at?: string | null
          creative_url?: string | null
          cta_text?: string | null
          headline?: string | null
          id?: string
          predicted_roas?: number | null
          variant_set?: string | null
          variant_type: string
        }
        Update: {
          body_copy?: string | null
          campaign_id?: string
          created_at?: string | null
          creative_url?: string | null
          cta_text?: string | null
          headline?: string | null
          id?: string
          predicted_roas?: number | null
          variant_set?: string | null
          variant_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "ad_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ad_wallets: {
        Row: {
          balance: number
          created_at: string
          id: string
          total_deposited: number
          total_spent: number
          updated_at: string
          user_id: string
        }
        Insert: {
          balance?: number
          created_at?: string
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          balance?: number
          created_at?: string
          id?: string
          total_deposited?: number
          total_spent?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_overrides: {
        Row: {
          created_at: string | null
          id: string
          override_political_mode: boolean | null
          override_realtor_mode: boolean | null
          override_tier: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          override_political_mode?: boolean | null
          override_realtor_mode?: boolean | null
          override_tier?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          override_political_mode?: boolean | null
          override_realtor_mode?: boolean | null
          override_tier?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      affiliate_banners: {
        Row: {
          created_at: string | null
          id: string
          image_url: string
          is_featured: boolean | null
          size: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          image_url: string
          is_featured?: boolean | null
          size: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          image_url?: string
          is_featured?: boolean | null
          size?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliate_bonus_rewards: {
        Row: {
          affiliate_id: string | null
          amount: number
          created_at: string | null
          earned_at: string | null
          id: string
          milestone_level: number | null
          paid_at: string | null
          reward_type: string
          status: string | null
        }
        Insert: {
          affiliate_id?: string | null
          amount: number
          created_at?: string | null
          earned_at?: string | null
          id?: string
          milestone_level?: number | null
          paid_at?: string | null
          reward_type: string
          status?: string | null
        }
        Update: {
          affiliate_id?: string | null
          amount?: number
          created_at?: string | null
          earned_at?: string | null
          id?: string
          milestone_level?: number | null
          paid_at?: string | null
          reward_type?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_bonus_rewards_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_clicks: {
        Row: {
          affiliate_id: string | null
          created_at: string | null
          fraud_reason: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          referrer: string | null
          user_agent: string | null
          visitor_id: string | null
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string | null
          fraud_reason?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string | null
          fraud_reason?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          referrer?: string | null
          user_agent?: string | null
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_clicks_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_content_swipes: {
        Row: {
          anonymized_creator: string | null
          content: string
          content_type: string
          created_at: string | null
          file_url: string | null
          id: string
          performance_score: number | null
          title: string
          week_end: string
          week_start: string
        }
        Insert: {
          anonymized_creator?: string | null
          content: string
          content_type: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          performance_score?: number | null
          title: string
          week_end: string
          week_start: string
        }
        Update: {
          anonymized_creator?: string | null
          content?: string
          content_type?: string
          created_at?: string | null
          file_url?: string | null
          id?: string
          performance_score?: number | null
          title?: string
          week_end?: string
          week_start?: string
        }
        Relationships: []
      }
      affiliate_leaderboard: {
        Row: {
          affiliate_id: string | null
          growth_percentage: number | null
          id: string
          period_end: string
          period_start: string
          rank: number | null
          total_commissions: number | null
          total_conversions: number | null
          total_revenue: number | null
          updated_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          growth_percentage?: number | null
          id?: string
          period_end: string
          period_start: string
          rank?: number | null
          total_commissions?: number | null
          total_conversions?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          growth_percentage?: number | null
          id?: string
          period_end?: string
          period_start?: string
          rank?: number | null
          total_commissions?: number | null
          total_conversions?: number | null
          total_revenue?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_leaderboard_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_milestones: {
        Row: {
          achieved_at: string | null
          affiliate_id: string
          id: string
          milestone_type: string
        }
        Insert: {
          achieved_at?: string | null
          affiliate_id: string
          id?: string
          milestone_type: string
        }
        Update: {
          achieved_at?: string | null
          affiliate_id?: string
          id?: string
          milestone_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_milestones_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_onboarding_progress: {
        Row: {
          affiliate_id: string | null
          completed: boolean | null
          created_at: string | null
          day_number: number
          email_clicked_at: string | null
          email_opened_at: string | null
          email_sent_at: string | null
          id: string
        }
        Insert: {
          affiliate_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          day_number: number
          email_clicked_at?: string | null
          email_opened_at?: string | null
          email_sent_at?: string | null
          id?: string
        }
        Update: {
          affiliate_id?: string | null
          completed?: boolean | null
          created_at?: string | null
          day_number?: number
          email_clicked_at?: string | null
          email_opened_at?: string | null
          email_sent_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_onboarding_progress_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_payouts: {
        Row: {
          admin_note: string | null
          affiliate_id: string | null
          amount: number
          id: string
          method: string | null
          processed_at: string | null
          requested_at: string | null
          status: string | null
          transaction_id: string | null
        }
        Insert: {
          admin_note?: string | null
          affiliate_id?: string | null
          amount: number
          id?: string
          method?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Update: {
          admin_note?: string | null
          affiliate_id?: string | null
          amount?: number
          id?: string
          method?: string | null
          processed_at?: string | null
          requested_at?: string | null
          status?: string | null
          transaction_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_payouts_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_referrals: {
        Row: {
          affiliate_earnings: number | null
          affiliate_id: string | null
          fingerprint: string | null
          first_payment_at: string | null
          fraud_reason: string | null
          id: string
          ip_address: string | null
          is_suspicious: boolean | null
          notes: string | null
          referred_at: string | null
          referred_user_id: string | null
          stripe_customer_id: string | null
          total_revenue: number | null
        }
        Insert: {
          affiliate_earnings?: number | null
          affiliate_id?: string | null
          fingerprint?: string | null
          first_payment_at?: string | null
          fraud_reason?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          notes?: string | null
          referred_at?: string | null
          referred_user_id?: string | null
          stripe_customer_id?: string | null
          total_revenue?: number | null
        }
        Update: {
          affiliate_earnings?: number | null
          affiliate_id?: string | null
          fingerprint?: string | null
          first_payment_at?: string | null
          fraud_reason?: string | null
          id?: string
          ip_address?: string | null
          is_suspicious?: boolean | null
          notes?: string | null
          referred_at?: string | null
          referred_user_id?: string | null
          stripe_customer_id?: string | null
          total_revenue?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_referrals_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliate_tiers: {
        Row: {
          affiliate_id: string | null
          created_at: string | null
          id: string
          previous_tier: string | null
          tier: string
          tier_changed_at: string | null
        }
        Insert: {
          affiliate_id?: string | null
          created_at?: string | null
          id?: string
          previous_tier?: string | null
          tier: string
          tier_changed_at?: string | null
        }
        Update: {
          affiliate_id?: string | null
          created_at?: string | null
          id?: string
          previous_tier?: string | null
          tier?: string
          tier_changed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "affiliate_tiers_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: false
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      affiliates: {
        Row: {
          code: string
          commission_duration_months: number | null
          created_at: string | null
          current_tier: string | null
          fraud_flags: Json | null
          fraud_score: number | null
          growth_rate: number | null
          id: string
          is_blocked: boolean | null
          last_fraud_check: string | null
          last_tier_check: string | null
          monthly_revenue: number | null
          onboarding_completed: boolean | null
          payout_email: string | null
          payout_method: string | null
          stripe_account_id: string | null
          stripe_account_status: string | null
          stripe_onboarding_complete: boolean | null
          super_affiliate_eligible: boolean | null
          total_earned: number | null
          total_paid: number | null
          user_id: string | null
        }
        Insert: {
          code: string
          commission_duration_months?: number | null
          created_at?: string | null
          current_tier?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          growth_rate?: number | null
          id?: string
          is_blocked?: boolean | null
          last_fraud_check?: string | null
          last_tier_check?: string | null
          monthly_revenue?: number | null
          onboarding_completed?: boolean | null
          payout_email?: string | null
          payout_method?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          super_affiliate_eligible?: boolean | null
          total_earned?: number | null
          total_paid?: number | null
          user_id?: string | null
        }
        Update: {
          code?: string
          commission_duration_months?: number | null
          created_at?: string | null
          current_tier?: string | null
          fraud_flags?: Json | null
          fraud_score?: number | null
          growth_rate?: number | null
          id?: string
          is_blocked?: boolean | null
          last_fraud_check?: string | null
          last_tier_check?: string | null
          monthly_revenue?: number | null
          onboarding_completed?: boolean | null
          payout_email?: string | null
          payout_method?: string | null
          stripe_account_id?: string | null
          stripe_account_status?: string | null
          stripe_onboarding_complete?: boolean | null
          super_affiliate_eligible?: boolean | null
          total_earned?: number | null
          total_paid?: number | null
          user_id?: string | null
        }
        Relationships: []
      }
      agency_clients: {
        Row: {
          agency_user_id: string
          client_name: string
          client_user_id: string
          created_at: string
          id: string
          is_active: boolean | null
          markup_percentage: number | null
        }
        Insert: {
          agency_user_id: string
          client_name: string
          client_user_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          markup_percentage?: number | null
        }
        Update: {
          agency_user_id?: string
          client_name?: string
          client_user_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          markup_percentage?: number | null
        }
        Relationships: []
      }
      agency_config: {
        Row: {
          agency_name: string
          created_at: string
          custom_domain: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          primary_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agency_name: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agency_name?: string
          created_at?: string
          custom_domain?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          primary_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      agent_tasks: {
        Row: {
          attempts: number | null
          campaign_id: string | null
          created_at: string | null
          error_message: string | null
          id: string
          last_run: string | null
          max_attempts: number | null
          next_run: string | null
          payload: Json | null
          priority: number | null
          project_id: string | null
          result: Json | null
          status: string | null
          task_type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          attempts?: number | null
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_run?: string | null
          max_attempts?: number | null
          next_run?: string | null
          payload?: Json | null
          priority?: number | null
          project_id?: string | null
          result?: Json | null
          status?: string | null
          task_type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          attempts?: number | null
          campaign_id?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          last_run?: string | null
          max_attempts?: number | null
          next_run?: string | null
          payload?: Json | null
          priority?: number | null
          project_id?: string | null
          result?: Json | null
          status?: string | null
          task_type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "agent_tasks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_generation_queue: {
        Row: {
          campaign_id: string | null
          completed_at: string | null
          created_at: string
          error_message: string | null
          estimated_wait_seconds: number | null
          id: string
          lease_expires_at: string | null
          lease_id: string | null
          next_attempt_at: string | null
          queue_position: number | null
          request_payload: Json
          request_type: string
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          estimated_wait_seconds?: number | null
          id?: string
          lease_expires_at?: string | null
          lease_id?: string | null
          next_attempt_at?: string | null
          queue_position?: number | null
          request_payload: Json
          request_type: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string | null
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          estimated_wait_seconds?: number | null
          id?: string
          lease_expires_at?: string | null
          lease_id?: string | null
          next_attempt_at?: string | null
          queue_position?: number | null
          request_payload?: Json
          request_type?: string
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_generation_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_training_signals: {
        Row: {
          context: Json | null
          created_at: string | null
          id: string
          signal_content: string
          signal_type: string
          training_category: string | null
          used_for_training: boolean | null
          user_id: string
        }
        Insert: {
          context?: Json | null
          created_at?: string | null
          id?: string
          signal_content: string
          signal_type: string
          training_category?: string | null
          used_for_training?: boolean | null
          user_id: string
        }
        Update: {
          context?: Json | null
          created_at?: string | null
          id?: string
          signal_content?: string
          signal_type?: string
          training_category?: string | null
          used_for_training?: boolean | null
          user_id?: string
        }
        Relationships: []
      }
      batch_funding_queue: {
        Row: {
          amount: number
          batch_id: string | null
          campaign_id: string
          created_at: string
          id: string
          platform: string
          processed_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          batch_id?: string | null
          campaign_id: string
          created_at?: string
          id?: string
          platform: string
          processed_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          batch_id?: string | null
          campaign_id?: string
          created_at?: string
          id?: string
          platform?: string
          processed_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "batch_funding_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_assets: {
        Row: {
          asset_text: string | null
          asset_type: string
          asset_url: string | null
          campaign_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          asset_text?: string | null
          asset_type: string
          asset_url?: string | null
          campaign_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          asset_text?: string | null
          asset_type?: string
          asset_url?: string | null
          campaign_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaign_assets_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_budget_events: {
        Row: {
          campaign_id: string
          created_at: string | null
          created_by: string | null
          event_type: string
          id: string
          new_daily_budget: number | null
          new_lifetime_budget: number | null
          new_status: string | null
          old_daily_budget: number | null
          old_lifetime_budget: number | null
          old_status: string | null
          reason: string | null
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          created_by?: string | null
          event_type: string
          id?: string
          new_daily_budget?: number | null
          new_lifetime_budget?: number | null
          new_status?: string | null
          old_daily_budget?: number | null
          old_lifetime_budget?: number | null
          old_status?: string | null
          reason?: string | null
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          created_by?: string | null
          event_type?: string
          id?: string
          new_daily_budget?: number | null
          new_lifetime_budget?: number | null
          new_status?: string | null
          old_daily_budget?: number | null
          old_lifetime_budget?: number | null
          old_status?: string | null
          reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_budget_events_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_channels: {
        Row: {
          campaign_id: string
          channel: string
          channel_campaign_id: string | null
          created_at: string | null
          id: string
          is_connected: boolean | null
        }
        Insert: {
          campaign_id: string
          channel: string
          channel_campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
        }
        Update: {
          campaign_id?: string
          channel?: string
          channel_campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_connected?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_channels_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_performance: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          cpc: number | null
          created_at: string | null
          ctr: number | null
          date: string
          id: string
          impressions: number | null
          is_demo: boolean | null
          platform: string
          revenue: number | null
          roas: number | null
          spend: number | null
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          is_demo?: boolean | null
          platform: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          cpc?: number | null
          created_at?: string | null
          ctr?: number | null
          date?: string
          id?: string
          impressions?: number | null
          is_demo?: boolean | null
          platform?: string
          revenue?: number | null
          roas?: number | null
          spend?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_performance_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_platform_status: {
        Row: {
          campaign_id: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          last_sync: string | null
          platform: string
          platform_campaign_id: string | null
          sync_error: string | null
          updated_at: string | null
        }
        Insert: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          platform: string
          platform_campaign_id?: string | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_sync?: string | null
          platform?: string
          platform_campaign_id?: string | null
          sync_error?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_platform_status_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_spend_daily: {
        Row: {
          campaign_id: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          date: string
          id: string
          impressions: number | null
          platform: string
          spend: number
          updated_at: string | null
        }
        Insert: {
          campaign_id: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          date: string
          id?: string
          impressions?: number | null
          platform: string
          spend?: number
          updated_at?: string | null
        }
        Update: {
          campaign_id?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          date?: string
          id?: string
          impressions?: number | null
          platform?: string
          spend?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "campaign_spend_daily_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      campaign_templates: {
        Row: {
          ai_prompt: string
          category: string
          created_at: string
          example_output: Json | null
          id: string
          is_active: boolean | null
          name: string
        }
        Insert: {
          ai_prompt: string
          category: string
          created_at?: string
          example_output?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
        }
        Update: {
          ai_prompt?: string
          category?: string
          created_at?: string
          example_output?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
        }
        Relationships: []
      }
      campaigns: {
        Row: {
          audience_suggestion: Json | null
          auto_targeted: boolean | null
          contact_email: string | null
          contact_phone: string | null
          created_at: string | null
          daily_budget: number | null
          detected_product_type: string | null
          end_date: string | null
          has_watermark: boolean | null
          id: string
          is_active: boolean | null
          landing_url: string | null
          last_payment_check: string | null
          lifetime_budget: number | null
          media_rights_confirmed_at: string | null
          meta_sub_platforms: Json | null
          name: string
          paused_at: string | null
          paused_reason: string | null
          payment_failures: number | null
          primary_goal: string | null
          property_details: Json | null
          real_estate_mode: boolean | null
          start_date: string | null
          status: string | null
          status_reason: string | null
          stripe_payment_id: string | null
          suggested_daily_budget: number | null
          target_audience: string | null
          target_location: string | null
          total_spent: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          audience_suggestion?: Json | null
          auto_targeted?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          daily_budget?: number | null
          detected_product_type?: string | null
          end_date?: string | null
          has_watermark?: boolean | null
          id?: string
          is_active?: boolean | null
          landing_url?: string | null
          last_payment_check?: string | null
          lifetime_budget?: number | null
          media_rights_confirmed_at?: string | null
          meta_sub_platforms?: Json | null
          name: string
          paused_at?: string | null
          paused_reason?: string | null
          payment_failures?: number | null
          primary_goal?: string | null
          property_details?: Json | null
          real_estate_mode?: boolean | null
          start_date?: string | null
          status?: string | null
          status_reason?: string | null
          stripe_payment_id?: string | null
          suggested_daily_budget?: number | null
          target_audience?: string | null
          target_location?: string | null
          total_spent?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          audience_suggestion?: Json | null
          auto_targeted?: boolean | null
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string | null
          daily_budget?: number | null
          detected_product_type?: string | null
          end_date?: string | null
          has_watermark?: boolean | null
          id?: string
          is_active?: boolean | null
          landing_url?: string | null
          last_payment_check?: string | null
          lifetime_budget?: number | null
          media_rights_confirmed_at?: string | null
          meta_sub_platforms?: Json | null
          name?: string
          paused_at?: string | null
          paused_reason?: string | null
          payment_failures?: number | null
          primary_goal?: string | null
          property_details?: Json | null
          real_estate_mode?: boolean | null
          start_date?: string | null
          status?: string | null
          status_reason?: string | null
          stripe_payment_id?: string | null
          suggested_daily_budget?: number | null
          target_audience?: string | null
          target_location?: string | null
          total_spent?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "campaigns_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      competitor_ads: {
        Row: {
          ad_image_url: string | null
          ad_text: string | null
          brand_name: string | null
          category: string
          created_at: string | null
          id: string
          last_seen_at: string | null
          platform: string | null
          style_embedding: string | null
        }
        Insert: {
          ad_image_url?: string | null
          ad_text?: string | null
          brand_name?: string | null
          category: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string | null
          style_embedding?: string | null
        }
        Update: {
          ad_image_url?: string | null
          ad_text?: string | null
          brand_name?: string | null
          category?: string
          created_at?: string | null
          id?: string
          last_seen_at?: string | null
          platform?: string | null
          style_embedding?: string | null
        }
        Relationships: []
      }
      config_system_costs: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string
          value: number
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string
          value: number
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string
          value?: number
        }
        Relationships: []
      }
      creative_memory: {
        Row: {
          ad_image_url: string | null
          ad_text: string | null
          body_copy: string | null
          campaign_id: string | null
          clicks: number | null
          conversions: number | null
          created_at: string | null
          cta_text: string | null
          headline: string | null
          id: string
          impressions: number | null
          performance_score: number | null
          performance_vector: string | null
          project_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_image_url?: string | null
          ad_text?: string | null
          body_copy?: string | null
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          cta_text?: string | null
          headline?: string | null
          id?: string
          impressions?: number | null
          performance_score?: number | null
          performance_vector?: string | null
          project_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_image_url?: string | null
          ad_text?: string | null
          body_copy?: string | null
          campaign_id?: string | null
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          cta_text?: string | null
          headline?: string | null
          id?: string
          impressions?: number | null
          performance_score?: number | null
          performance_vector?: string | null
          project_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "creative_memory_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_bug_reports: {
        Row: {
          actual_behavior: string | null
          assigned_to: string | null
          bug_description: string
          bug_location: string
          created_at: string | null
          expected_behavior: string | null
          id: string
          intake_form_id: string | null
          resolved_at: string | null
          screenshots: string[] | null
          severity: string | null
          status: string | null
          steps_to_reproduce: string | null
          user_id: string
        }
        Insert: {
          actual_behavior?: string | null
          assigned_to?: string | null
          bug_description: string
          bug_location: string
          created_at?: string | null
          expected_behavior?: string | null
          id?: string
          intake_form_id?: string | null
          resolved_at?: string | null
          screenshots?: string[] | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          user_id: string
        }
        Update: {
          actual_behavior?: string | null
          assigned_to?: string | null
          bug_description?: string
          bug_location?: string
          created_at?: string | null
          expected_behavior?: string | null
          id?: string
          intake_form_id?: string | null
          resolved_at?: string | null
          screenshots?: string[] | null
          severity?: string | null
          status?: string | null
          steps_to_reproduce?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_bug_reports_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "customer_intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_intake_forms: {
        Row: {
          advertising_goals: string[] | null
          ai_assistance_needs: string[] | null
          ai_training_permission: boolean | null
          bug_description: string | null
          bug_expected_behavior: string | null
          bug_location: string | null
          bug_screenshots: string[] | null
          business_name: string | null
          country: string | null
          created_at: string | null
          current_challenges: string[] | null
          email: string
          feature_request: string | null
          full_name: string
          has_bugs: boolean | null
          id: string
          industry_category: string | null
          monthly_budget: string | null
          onboarding_rating: number | null
          product_description: string | null
          questions_for_us: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          advertising_goals?: string[] | null
          ai_assistance_needs?: string[] | null
          ai_training_permission?: boolean | null
          bug_description?: string | null
          bug_expected_behavior?: string | null
          bug_location?: string | null
          bug_screenshots?: string[] | null
          business_name?: string | null
          country?: string | null
          created_at?: string | null
          current_challenges?: string[] | null
          email: string
          feature_request?: string | null
          full_name: string
          has_bugs?: boolean | null
          id?: string
          industry_category?: string | null
          monthly_budget?: string | null
          onboarding_rating?: number | null
          product_description?: string | null
          questions_for_us?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          advertising_goals?: string[] | null
          ai_assistance_needs?: string[] | null
          ai_training_permission?: boolean | null
          bug_description?: string | null
          bug_expected_behavior?: string | null
          bug_location?: string | null
          bug_screenshots?: string[] | null
          business_name?: string | null
          country?: string | null
          created_at?: string | null
          current_challenges?: string[] | null
          email?: string
          feature_request?: string | null
          full_name?: string
          has_bugs?: boolean | null
          id?: string
          industry_category?: string | null
          monthly_budget?: string | null
          onboarding_rating?: number | null
          product_description?: string | null
          questions_for_us?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      customer_questions: {
        Row: {
          answer: string | null
          answered: boolean | null
          answered_at: string | null
          answered_by: string | null
          created_at: string | null
          id: string
          intake_form_id: string | null
          question: string
          used_for_ai_training: boolean | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered?: boolean | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          id?: string
          intake_form_id?: string | null
          question: string
          used_for_ai_training?: boolean | null
          user_id: string
        }
        Update: {
          answer?: string | null
          answered?: boolean | null
          answered_at?: string | null
          answered_by?: string | null
          created_at?: string | null
          id?: string
          intake_form_id?: string | null
          question?: string
          used_for_ai_training?: boolean | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_questions_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "customer_intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      customer_suggestions: {
        Row: {
          category: string | null
          created_at: string | null
          id: string
          implemented_at: string | null
          intake_form_id: string | null
          priority: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          suggestion: string
          user_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string | null
          id?: string
          implemented_at?: string | null
          intake_form_id?: string | null
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggestion: string
          user_id: string
        }
        Update: {
          category?: string | null
          created_at?: string | null
          id?: string
          implemented_at?: string | null
          intake_form_id?: string | null
          priority?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          suggestion?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_suggestions_intake_form_id_fkey"
            columns: ["intake_form_id"]
            isOneToOne: false
            referencedRelation: "customer_intake_forms"
            referencedColumns: ["id"]
          },
        ]
      }
      elasticity_tests: {
        Row: {
          baseline_conversion_rate: number | null
          baseline_price: number
          calculated_elasticity: number | null
          clicks: number | null
          completed_at: string | null
          conversions: number | null
          created_at: string
          demand_change_percent: number | null
          id: string
          impressions: number | null
          price_change_percent: number | null
          product_id: string
          revenue: number | null
          started_at: string | null
          status: string | null
          test_conversion_rate: number | null
          test_duration_hours: number | null
          test_price: number
          user_id: string
        }
        Insert: {
          baseline_conversion_rate?: number | null
          baseline_price: number
          calculated_elasticity?: number | null
          clicks?: number | null
          completed_at?: string | null
          conversions?: number | null
          created_at?: string
          demand_change_percent?: number | null
          id?: string
          impressions?: number | null
          price_change_percent?: number | null
          product_id: string
          revenue?: number | null
          started_at?: string | null
          status?: string | null
          test_conversion_rate?: number | null
          test_duration_hours?: number | null
          test_price: number
          user_id: string
        }
        Update: {
          baseline_conversion_rate?: number | null
          baseline_price?: number
          calculated_elasticity?: number | null
          clicks?: number | null
          completed_at?: string | null
          conversions?: number | null
          created_at?: string
          demand_change_percent?: number | null
          id?: string
          impressions?: number | null
          price_change_percent?: number | null
          product_id?: string
          revenue?: number | null
          started_at?: string | null
          status?: string | null
          test_conversion_rate?: number | null
          test_duration_hours?: number | null
          test_price?: number
          user_id?: string
        }
        Relationships: []
      }
      fraud_checks: {
        Row: {
          action_taken: string | null
          check_type: string
          created_at: string
          details: Json | null
          id: string
          risk_level: string
          user_id: string
        }
        Insert: {
          action_taken?: string | null
          check_type: string
          created_at?: string
          details?: Json | null
          id?: string
          risk_level: string
          user_id: string
        }
        Update: {
          action_taken?: string | null
          check_type?: string
          created_at?: string
          details?: Json | null
          id?: string
          risk_level?: string
          user_id?: string
        }
        Relationships: []
      }
      free_ads: {
        Row: {
          ad_variant_id: string
          charged: boolean | null
          created_at: string | null
          fingerprint: string
          id: string
          image_url: string | null
          published_at: string | null
          tampered: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ad_variant_id: string
          charged?: boolean | null
          created_at?: string | null
          fingerprint: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          tampered?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ad_variant_id?: string
          charged?: boolean | null
          created_at?: string | null
          fingerprint?: string
          id?: string
          image_url?: string | null
          published_at?: string | null
          tampered?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "free_ads_ad_variant_id_fkey"
            columns: ["ad_variant_id"]
            isOneToOne: false
            referencedRelation: "ad_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      gemini_reflections: {
        Row: {
          created_at: string | null
          id: string
          improvements: string | null
          metrics_summary: Json | null
          prompt_rewrites: Json | null
          reflection_type: string | null
          what_failed: string | null
          what_worked: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          improvements?: string | null
          metrics_summary?: Json | null
          prompt_rewrites?: Json | null
          reflection_type?: string | null
          what_failed?: string | null
          what_worked?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          improvements?: string | null
          metrics_summary?: Json | null
          prompt_rewrites?: Json | null
          reflection_type?: string | null
          what_failed?: string | null
          what_worked?: string | null
        }
        Relationships: []
      }
      optimization_logs: {
        Row: {
          action: string
          after_value: number | null
          auto_executed: boolean | null
          before_value: number | null
          campaign_id: string | null
          confidence: number | null
          created_at: string | null
          decision_type: string | null
          id: string
          payload: Json | null
          project_id: string | null
          reason: string | null
          user_id: string
        }
        Insert: {
          action: string
          after_value?: number | null
          auto_executed?: boolean | null
          before_value?: number | null
          campaign_id?: string | null
          confidence?: number | null
          created_at?: string | null
          decision_type?: string | null
          id?: string
          payload?: Json | null
          project_id?: string | null
          reason?: string | null
          user_id: string
        }
        Update: {
          action?: string
          after_value?: number | null
          auto_executed?: boolean | null
          before_value?: number | null
          campaign_id?: string | null
          confidence?: number | null
          created_at?: string | null
          decision_type?: string | null
          id?: string
          payload?: Json | null
          project_id?: string | null
          reason?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "optimization_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string | null
          currency: string | null
          id: string
          payment_type: string
          status: string
          stripe_payment_intent_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_type: string
          status: string
          stripe_payment_intent_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string | null
          currency?: string | null
          id?: string
          payment_type?: string
          status?: string
          stripe_payment_intent_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      payouts: {
        Row: {
          affiliate: number | null
          agency: number | null
          created_at: string | null
          id: string
          month: string
          net: number | null
          subscription_id: string | null
          total: number | null
        }
        Insert: {
          affiliate?: number | null
          agency?: number | null
          created_at?: string | null
          id?: string
          month: string
          net?: number | null
          subscription_id?: string | null
          total?: number | null
        }
        Update: {
          affiliate?: number | null
          agency?: number | null
          created_at?: string | null
          id?: string
          month?: string
          net?: number | null
          subscription_id?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payouts_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      performance_alerts: {
        Row: {
          acted_at: string | null
          alert_type: string
          campaign_id: string
          created_at: string
          current_value: number | null
          id: string
          message: string
          read_at: string | null
          status: string
          threshold_value: number | null
          user_id: string
        }
        Insert: {
          acted_at?: string | null
          alert_type: string
          campaign_id: string
          created_at?: string
          current_value?: number | null
          id?: string
          message: string
          read_at?: string | null
          status?: string
          threshold_value?: number | null
          user_id: string
        }
        Update: {
          acted_at?: string | null
          alert_type?: string
          campaign_id?: string
          created_at?: string
          current_value?: number | null
          id?: string
          message?: string
          read_at?: string | null
          status?: string
          threshold_value?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "performance_alerts_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_ad_accounts: {
        Row: {
          created_at: string
          id: string
          parent_business_manager_id: string | null
          platform: string
          platform_ad_account_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          parent_business_manager_id?: string | null
          platform: string
          platform_ad_account_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          parent_business_manager_id?: string | null
          platform?: string
          platform_ad_account_id?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      platform_credentials: {
        Row: {
          access_token: string
          account_name: string | null
          created_at: string | null
          expires_at: string | null
          id: string
          owner_id: string | null
          owner_type: string | null
          page_id: string | null
          platform: string
          platform_account_id: string
          refresh_token: string | null
          status: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          access_token: string
          account_name?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_id?: string | null
          owner_type?: string | null
          page_id?: string | null
          platform: string
          platform_account_id: string
          refresh_token?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          access_token?: string
          account_name?: string | null
          created_at?: string | null
          expires_at?: string | null
          id?: string
          owner_id?: string | null
          owner_type?: string | null
          page_id?: string | null
          platform?: string
          platform_account_id?: string
          refresh_token?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      political_ads: {
        Row: {
          ad_copy: string
          campaign_id: string | null
          candidate_id: string | null
          compliance_checked: boolean | null
          compliance_issues: Json | null
          created_at: string | null
          id: string
          image_url: string | null
          platform: string
          policy_focus: string | null
          published: boolean | null
          published_at: string | null
          signature_base58: string | null
          tone: string | null
          updated_at: string | null
          user_id: string
          watermark_url: string | null
        }
        Insert: {
          ad_copy: string
          campaign_id?: string | null
          candidate_id?: string | null
          compliance_checked?: boolean | null
          compliance_issues?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          platform: string
          policy_focus?: string | null
          published?: boolean | null
          published_at?: string | null
          signature_base58?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id: string
          watermark_url?: string | null
        }
        Update: {
          ad_copy?: string
          campaign_id?: string | null
          candidate_id?: string | null
          compliance_checked?: boolean | null
          compliance_issues?: Json | null
          created_at?: string | null
          id?: string
          image_url?: string | null
          platform?: string
          policy_focus?: string | null
          published?: boolean | null
          published_at?: string | null
          signature_base58?: string | null
          tone?: string | null
          updated_at?: string | null
          user_id?: string
          watermark_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "political_ads_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "political_ads_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "political_candidates"
            referencedColumns: ["id"]
          },
        ]
      }
      political_candidates: {
        Row: {
          address: string | null
          approved: boolean | null
          approved_at: string | null
          created_at: string | null
          election_year: number | null
          fec_id: string | null
          full_name: string
          id: string
          id_document_back_url: string | null
          id_document_front_url: string | null
          office_sought: string | null
          party: string | null
          race: string | null
          selfie_url: string | null
          updated_at: string | null
          user_id: string
          wallet_address: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          approved?: boolean | null
          approved_at?: string | null
          created_at?: string | null
          election_year?: number | null
          fec_id?: string | null
          full_name: string
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          office_sought?: string | null
          party?: string | null
          race?: string | null
          selfie_url?: string | null
          updated_at?: string | null
          user_id: string
          wallet_address?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          approved?: boolean | null
          approved_at?: string | null
          created_at?: string | null
          election_year?: number | null
          fec_id?: string | null
          full_name?: string
          id?: string
          id_document_back_url?: string | null
          id_document_front_url?: string | null
          office_sought?: string | null
          party?: string | null
          race?: string | null
          selfie_url?: string | null
          updated_at?: string | null
          user_id?: string
          wallet_address?: string | null
          website?: string | null
        }
        Relationships: []
      }
      product_profitability: {
        Row: {
          base_price: number
          cost_of_goods: number
          created_at: string
          elasticity_coefficient: number | null
          id: string
          last_tested_at: string | null
          margin: number | null
          margin_percentage: number | null
          max_tested_price: number | null
          min_viable_price: number | null
          optimal_price: number | null
          pricing_strategy: string | null
          product_id: string
          product_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          base_price?: number
          cost_of_goods?: number
          created_at?: string
          elasticity_coefficient?: number | null
          id?: string
          last_tested_at?: string | null
          margin?: number | null
          margin_percentage?: number | null
          max_tested_price?: number | null
          min_viable_price?: number | null
          optimal_price?: number | null
          pricing_strategy?: string | null
          product_id: string
          product_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          base_price?: number
          cost_of_goods?: number
          created_at?: string
          elasticity_coefficient?: number | null
          id?: string
          last_tested_at?: string | null
          margin?: number | null
          margin_percentage?: number | null
          max_tested_price?: number | null
          min_viable_price?: number | null
          optimal_price?: number | null
          pricing_strategy?: string | null
          product_id?: string
          product_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          brokerage_name: string | null
          created_at: string | null
          credits: number | null
          email: string
          full_name: string | null
          id: string
          is_realtor: boolean | null
          monthly_ad_spend_limit: number | null
          plan: string | null
          political_ads_limit: number | null
          political_ads_used: number | null
          political_tier: boolean | null
          quickstart_week_start_date: string | null
          quickstart_weekly_spend: number | null
          realtor_license_state: string | null
          realtor_name: string | null
          stripe_customer_id: string | null
          stripe_price_id: string | null
          updated_at: string | null
        }
        Insert: {
          brokerage_name?: string | null
          created_at?: string | null
          credits?: number | null
          email: string
          full_name?: string | null
          id: string
          is_realtor?: boolean | null
          monthly_ad_spend_limit?: number | null
          plan?: string | null
          political_ads_limit?: number | null
          political_ads_used?: number | null
          political_tier?: boolean | null
          quickstart_week_start_date?: string | null
          quickstart_weekly_spend?: number | null
          realtor_license_state?: string | null
          realtor_name?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Update: {
          brokerage_name?: string | null
          created_at?: string | null
          credits?: number | null
          email?: string
          full_name?: string | null
          id?: string
          is_realtor?: boolean | null
          monthly_ad_spend_limit?: number | null
          plan?: string | null
          political_ads_limit?: number | null
          political_ads_used?: number | null
          political_tier?: boolean | null
          quickstart_week_start_date?: string | null
          quickstart_weekly_spend?: number | null
          realtor_license_state?: string | null
          realtor_name?: string | null
          stripe_customer_id?: string | null
          stripe_price_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      profit_logs: {
        Row: {
          auto_executed: boolean | null
          campaign_id: string | null
          confidence: number | null
          created_at: string
          decision_rationale: string | null
          event_type: string
          id: string
          margin_after: number | null
          margin_before: number | null
          new_price: number | null
          old_price: number | null
          payload: Json | null
          product_id: string | null
          profit_impact: number | null
          revenue_impact: number | null
          user_id: string
        }
        Insert: {
          auto_executed?: boolean | null
          campaign_id?: string | null
          confidence?: number | null
          created_at?: string
          decision_rationale?: string | null
          event_type: string
          id?: string
          margin_after?: number | null
          margin_before?: number | null
          new_price?: number | null
          old_price?: number | null
          payload?: Json | null
          product_id?: string | null
          profit_impact?: number | null
          revenue_impact?: number | null
          user_id: string
        }
        Update: {
          auto_executed?: boolean | null
          campaign_id?: string | null
          confidence?: number | null
          created_at?: string
          decision_rationale?: string | null
          event_type?: string
          id?: string
          margin_after?: number | null
          margin_before?: number | null
          new_price?: number | null
          old_price?: number | null
          payload?: Json | null
          product_id?: string | null
          profit_impact?: number | null
          revenue_impact?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profit_logs_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      quick_start_publish_queue: {
        Row: {
          campaign_id: string
          completed_at: string | null
          created_at: string
          error_message: string | null
          estimated_start_time: string | null
          id: string
          lease_expires_at: string | null
          lease_id: string | null
          next_attempt_at: string | null
          platform: string
          queue_position: number | null
          retry_count: number | null
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          estimated_start_time?: string | null
          id?: string
          lease_expires_at?: string | null
          lease_id?: string | null
          next_attempt_at?: string | null
          platform: string
          queue_position?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          completed_at?: string | null
          created_at?: string
          error_message?: string | null
          estimated_start_time?: string | null
          id?: string
          lease_expires_at?: string | null
          lease_id?: string | null
          next_attempt_at?: string | null
          platform?: string
          queue_position?: number | null
          retry_count?: number | null
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "quick_start_publish_queue_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_images: {
        Row: {
          created_at: string
          id: string
          image_type: string
          image_url: string
          last_used_at: string | null
          prompt_used: string | null
          usage_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_type?: string
          image_url: string
          last_used_at?: string | null
          prompt_used?: string | null
          usage_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_type?: string
          image_url?: string
          last_used_at?: string | null
          prompt_used?: string | null
          usage_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          created_at: string | null
          email: string
          id: string
          stripe_customer_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: string
          stripe_customer_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
          stripe_customer_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status: string
          stripe_customer_id: string
          stripe_subscription_id: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string
          stripe_subscription_id?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      super_affiliate_pages: {
        Row: {
          affiliate_id: string | null
          bio: string | null
          conversions: number | null
          cookie_duration_days: number | null
          created_at: string | null
          custom_cta: string | null
          custom_slug: string
          discount_code: string | null
          hero_image_url: string | null
          id: string
          is_active: boolean | null
          page_title: string | null
          social_links: Json | null
          updated_at: string | null
          views: number | null
        }
        Insert: {
          affiliate_id?: string | null
          bio?: string | null
          conversions?: number | null
          cookie_duration_days?: number | null
          created_at?: string | null
          custom_cta?: string | null
          custom_slug: string
          discount_code?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          page_title?: string | null
          social_links?: Json | null
          updated_at?: string | null
          views?: number | null
        }
        Update: {
          affiliate_id?: string | null
          bio?: string | null
          conversions?: number | null
          cookie_duration_days?: number | null
          created_at?: string | null
          custom_cta?: string | null
          custom_slug?: string
          discount_code?: string | null
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          page_title?: string | null
          social_links?: Json | null
          updated_at?: string | null
          views?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "super_affiliate_pages_affiliate_id_fkey"
            columns: ["affiliate_id"]
            isOneToOne: true
            referencedRelation: "affiliates"
            referencedColumns: ["id"]
          },
        ]
      }
      support_tickets: {
        Row: {
          ai_response: string | null
          created_at: string
          human_assigned_to: string | null
          id: string
          message: string
          resolved_at: string | null
          status: string
          subject: string
          user_id: string
        }
        Insert: {
          ai_response?: string | null
          created_at?: string
          human_assigned_to?: string | null
          id?: string
          message: string
          resolved_at?: string | null
          status?: string
          subject: string
          user_id: string
        }
        Update: {
          ai_response?: string | null
          created_at?: string
          human_assigned_to?: string | null
          id?: string
          message?: string
          resolved_at?: string | null
          status?: string
          subject?: string
          user_id?: string
        }
        Relationships: []
      }
      user_autopilot_settings: {
        Row: {
          auto_budget_adjustment: boolean | null
          auto_creative_rotation: boolean | null
          auto_pause_underperformers: boolean | null
          autopilot_mode: string | null
          confidence_threshold: number | null
          created_at: string | null
          id: string
          notifications_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          auto_budget_adjustment?: boolean | null
          auto_creative_rotation?: boolean | null
          auto_pause_underperformers?: boolean | null
          autopilot_mode?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          auto_budget_adjustment?: boolean | null
          auto_creative_rotation?: boolean | null
          auto_pause_underperformers?: boolean | null
          autopilot_mode?: string | null
          confidence_threshold?: number | null
          created_at?: string | null
          id?: string
          notifications_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_llm_usage: {
        Row: {
          api_calls: number
          autopilot_loops: number
          conductor_executions: number
          created_at: string
          creative_generations: number
          id: string
          llm_cost_usd: number
          llm_tokens_used: number
          month_start: string
          price_tests: number
          safety_checks: number
          total_infra_cost: number
          updated_at: string
          user_id: string
        }
        Insert: {
          api_calls?: number
          autopilot_loops?: number
          conductor_executions?: number
          created_at?: string
          creative_generations?: number
          id?: string
          llm_cost_usd?: number
          llm_tokens_used?: number
          month_start?: string
          price_tests?: number
          safety_checks?: number
          total_infra_cost?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          api_calls?: number
          autopilot_loops?: number
          conductor_executions?: number
          created_at?: string
          creative_generations?: number
          id?: string
          llm_cost_usd?: number
          llm_tokens_used?: number
          month_start?: string
          price_tests?: number
          safety_checks?: number
          total_infra_cost?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          campaign_id: string | null
          created_at: string
          description: string | null
          id: string
          stripe_payment_intent_id: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Insert: {
          amount: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          type: string
          user_id: string
          wallet_id: string
        }
        Update: {
          amount?: number
          campaign_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          stripe_payment_intent_id?: string | null
          type?: string
          user_id?: string
          wallet_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_wallet_id_fkey"
            columns: ["wallet_id"]
            isOneToOne: false
            referencedRelation: "ad_wallets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      admin_watermark_report: {
        Row: {
          ad_variant_id: string | null
          campaign_id: string | null
          campaign_name: string | null
          charged: boolean | null
          creative_url: string | null
          fingerprint: string | null
          id: string | null
          image_url: string | null
          platform: string | null
          published_at: string | null
          revenue: number | null
          stripe_customer_id: string | null
          tampered: boolean | null
          user_email: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ad_variants_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "free_ads_ad_variant_id_fkey"
            columns: ["ad_variant_id"]
            isOneToOne: false
            referencedRelation: "ad_variants"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      calculate_affiliate_tier: {
        Args: { conversions: number; monthly_rev: number }
        Returns: string
      }
      check_milestone_eligibility: {
        Args: { affiliate_id_param: string; conversions: number }
        Returns: {
          milestone_level: number
          reward_amount: number
        }[]
      }
      enforce_quickstart_cap: { Args: { requested: number }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_user_llm_usage: {
        Args: {
          p_api_calls?: number
          p_autopilot_loops?: number
          p_conductor_executions?: number
          p_cost?: number
          p_creative_generations?: number
          p_infra_cost?: number
          p_price_tests?: number
          p_safety_checks?: number
          p_tokens?: number
          p_user_id: string
        }
        Returns: {
          api_calls: number
          autopilot_loops: number
          conductor_executions: number
          created_at: string
          creative_generations: number
          id: string
          llm_cost_usd: number
          llm_tokens_used: number
          month_start: string
          price_tests: number
          safety_checks: number
          total_infra_cost: number
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "user_llm_usage"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      lease_ai_jobs: {
        Args: { batch_size?: number }
        Returns: {
          campaign_id: string
          created_at: string
          id: string
          request_payload: Json
          request_type: string
          user_id: string
        }[]
      }
      lease_publish_jobs: {
        Args: { batch_size?: number }
        Returns: {
          campaign_id: string
          created_at: string
          id: string
          platform: string
          retry_count: number
          user_id: string
        }[]
      }
      release_expired_leases: { Args: never; Returns: undefined }
      update_queue_positions: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
