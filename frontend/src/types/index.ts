export interface OfficialSocialAsset {
  id: number;
  brand_id: number;
  platform: string;
  handle: string;
  url?: string;
  verified_badge: boolean;
  notes?: string;
  created_at: string;
}

export interface OfficialApplication {
  id: number;
  brand_id: number;
  app_name: string;
  package_id: string;
  store: string;
  store_url?: string;
  publisher_name: string;
  created_at: string;
}

export interface BrandProfile {
  id: number;
  name: string;
  industry?: string;
  website?: string;
  description?: string;
  keywords?: string;
  aliases?: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
  official_social_assets?: OfficialSocialAsset[];
  official_applications?: OfficialApplication[];
}

export interface SocialProfileRecord {
  id: number;
  brand_id: number;
  platform: string;
  username: string;
  display_name?: string;
  profile_url?: string;
  bio?: string;
  follower_count: number;
  account_created_at?: string;
  data_source?: string;
  created_at: string;
}

export interface AppListingRecord {
  id: number;
  brand_id: number;
  app_name: string;
  package_id: string;
  developer_name: string;
  store_name: string;
  store_url?: string;
  description?: string;
  icon_url?: string;
  permissions?: string;
  data_source?: string;
  created_at: string;
}

export interface Finding {
  id: number;
  brand_id: number;
  asset_type: string; // 'social' | 'app'
  record_id?: number;
  asset_name: string;
  platform_or_store: string;
  source_url?: string;
  risk_score: number;
  risk_category: 'critical' | 'high' | 'medium' | 'low' | 'safe';
  detection_reasons: string[];
  evidence_snippets?: Record<string, any>;
  matched_official_asset?: Record<string, any>;
  similarity_details?: Record<string, any>;
  review_status: 'unreviewed' | 'reviewed' | 'false_positive' | 'escalated';
  reviewer_notes?: string;
  recommended_action?: string;
  created_at: string;
  updated_at: string;
}

export interface ScanHistory {
  id: number;
  brand_id: number;
  scan_type: string;
  started_at: string;
  completed_at?: string;
  status: string;
  records_processed: number;
  alerts_generated: number;
  excluded_assets_count: number;
  notes?: string;
}

export interface DashboardStats {
  total_brands: number;
  total_monitored_social: number;
  total_monitored_apps: number;
  suspicious_social: number;
  suspicious_apps: number;
  high_critical_findings: number;
  official_assets_excluded: number;
  total_scans_completed: number;
  risk_distribution: Record<string, number>;
  platform_distribution: Record<string, number>;
  social_vs_app: Record<string, number>;
  recent_scans?: ScanHistory[];
  recent_findings?: Finding[];
}
