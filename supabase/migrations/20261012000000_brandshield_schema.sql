-- =============================================================================
-- BrandShield AI — Digital Risk Protection Platform
-- Supabase PostgreSQL Database Migration Schema
-- Version: 1.0.0
-- Created: 2026-10-12
-- Compatible with: PostgreSQL 14+, Supabase Realtime, PostgREST
-- =============================================================================

-- Enable essential extensions for UUID generation and crypto hashing
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- 1. TABLE: brands
-- Enterprise brand profiles monitored across digital perimeters
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.brands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL UNIQUE,
    industry VARCHAR(100),
    website VARCHAR(255),
    description TEXT,
    keywords TEXT[] DEFAULT '{}',
    aliases TEXT[] DEFAULT '{}',
    logo_url TEXT,
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'paused', 'archived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for brand lookups
CREATE INDEX IF NOT EXISTS idx_brands_name ON public.brands (name);
CREATE INDEX IF NOT EXISTS idx_brands_status ON public.brands (status);

-- =============================================================================
-- 2. TABLE: assets
-- Stores both official whitelisted assets (for false-positive immunity)
-- and candidate monitored entities (social handles, mobile app listings)
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('social', 'mobile_app', 'domain', 'generic')),
    platform_or_store VARCHAR(100) NOT NULL, -- 'twitter', 'instagram', 'facebook', 'telegram', 'google_play', 'apple_app_store', 'third_party_apk'
    identifier VARCHAR(255) NOT NULL,        -- Handle (e.g. 'NovaPay'), package_id ('com.novapay.app'), or domain
    display_name VARCHAR(255),
    url TEXT,
    publisher_name VARCHAR(255),             -- Registered mobile app publisher or owner
    is_official BOOLEAN NOT NULL DEFAULT false, -- TRUE = Official Whitelisted Asset (Zero False-Positive Protection)
    verified_badge BOOLEAN NOT NULL DEFAULT false, -- Platform verification checkmark
    follower_count BIGINT DEFAULT 0,
    download_count_estimate BIGINT DEFAULT 0,
    rating NUMERIC(3, 2) DEFAULT NULL,
    bio_or_description TEXT,
    data_source VARCHAR(100) NOT NULL DEFAULT 'live_monitoring' CHECK (data_source IN ('synthetic_demo', 'csv_upload', 'manual_entry', 'live_monitoring')),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for asset searches and exclusion matching
CREATE INDEX IF NOT EXISTS idx_assets_brand_id ON public.assets (brand_id);
CREATE INDEX IF NOT EXISTS idx_assets_identifier ON public.assets (identifier);
CREATE INDEX IF NOT EXISTS idx_assets_is_official ON public.assets (brand_id, is_official);
CREATE INDEX IF NOT EXISTS idx_assets_type_platform ON public.assets (asset_type, platform_or_store);

-- =============================================================================
-- 3. TABLE: scans
-- Telemetry logs for autonomous and on-demand detection engine sweeps
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    scan_type VARCHAR(50) NOT NULL DEFAULT 'full' CHECK (scan_type IN ('full', 'social', 'mobile_app')),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
    records_processed INT NOT NULL DEFAULT 0,
    threats_detected INT NOT NULL DEFAULT 0,
    alerts_generated INT NOT NULL DEFAULT 0,
    excluded_assets_count INT NOT NULL DEFAULT 0,
    duration_ms INT NOT NULL DEFAULT 0,
    started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    triggered_by VARCHAR(100) DEFAULT 'analyst' CHECK (triggered_by IN ('system', 'analyst', 'scheduled_job', 'demo_runner')),
    notes TEXT,
    telemetry JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_scans_brand_id ON public.scans (brand_id);
CREATE INDEX IF NOT EXISTS idx_scans_started_at ON public.scans (started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scans_status ON public.scans (status);

-- =============================================================================
-- 4. TABLE: findings
-- Security incident queue tracking detected impersonations and anomalies
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.findings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    scan_id UUID REFERENCES public.scans(id) ON DELETE SET NULL,
    asset_id UUID REFERENCES public.assets(id) ON DELETE SET NULL,
    asset_type VARCHAR(50) NOT NULL CHECK (asset_type IN ('social', 'mobile_app')),
    asset_name VARCHAR(255) NOT NULL,
    platform_or_store VARCHAR(100) NOT NULL,
    source_url TEXT,
    risk_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0 CHECK (risk_score >= 0.0 AND risk_score <= 100.0),
    risk_category VARCHAR(50) NOT NULL DEFAULT 'low' CHECK (risk_category IN ('critical', 'high', 'medium', 'low', 'safe')),
    detection_reasons TEXT[] NOT NULL DEFAULT '{}',
    recommended_action VARCHAR(255),
    review_status VARCHAR(50) NOT NULL DEFAULT 'unreviewed' CHECK (review_status IN ('unreviewed', 'reviewed', 'escalated', 'false_positive', 'resolved')),
    reviewer_notes TEXT,
    reviewed_by VARCHAR(255),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Fast query indexes for SOC triage dashboards
CREATE INDEX IF NOT EXISTS idx_findings_brand_risk ON public.findings (brand_id, risk_category);
CREATE INDEX IF NOT EXISTS idx_findings_brand_status ON public.findings (brand_id, review_status);
CREATE INDEX IF NOT EXISTS idx_findings_created_at ON public.findings (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findings_score ON public.findings (risk_score DESC);

-- =============================================================================
-- 5. TABLE: risk_evidence
-- Explainable algorithmic breakdown and artifacts for each finding
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.risk_evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    finding_id UUID NOT NULL REFERENCES public.findings(id) ON DELETE CASCADE,
    lexical_similarity NUMERIC(5, 4) DEFAULT 0.0, -- Levenshtein / Jaccard normalized ratio (0.0000 - 1.0000)
    levenshtein_distance INT DEFAULT 0,
    jaccard_similarity NUMERIC(5, 4) DEFAULT 0.0,
    homoglyphs_detected BOOLEAN DEFAULT false,
    normalized_name VARCHAR(255),
    homoglyph_mappings JSONB DEFAULT '{}'::jsonb, -- e.g. {"0": "o", "ν": "v"}
    impersonation_modifiers TEXT[] DEFAULT '{}', -- e.g. ["support", "care", "official"]
    predatory_keywords TEXT[] DEFAULT '{}',     -- e.g. ["urgent kyc", "instant loan", "refund"]
    conflict_detected BOOLEAN DEFAULT false,     -- TRUE if unauthorized publisher registered an official package ID
    conflict_details JSONB DEFAULT '{}'::jsonb,
    evidence_payload JSONB DEFAULT '{}'::jsonb,  -- Full snapshot of raw profile bio, links, developer info
    raw_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_risk_evidence_finding_id ON public.risk_evidence (finding_id);
CREATE INDEX IF NOT EXISTS idx_risk_evidence_homoglyphs ON public.risk_evidence (homoglyphs_detected);
CREATE INDEX IF NOT EXISTS idx_risk_evidence_conflict ON public.risk_evidence (conflict_detected);

-- =============================================================================
-- 6. TABLE: alerts
-- Real-time incident escalations and takedown notifications
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    brand_id UUID NOT NULL REFERENCES public.brands(id) ON DELETE CASCADE,
    finding_id UUID REFERENCES public.findings(id) ON DELETE CASCADE,
    alert_type VARCHAR(100) NOT NULL, -- 'CRITICAL_CONFLICT', 'HOMOGLYPH_IMPERSONATOR', 'PREDATORY_APP', 'PHISHING_HANDLE'
    severity VARCHAR(50) NOT NULL DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    is_acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_at TIMESTAMPTZ,
    acknowledged_by VARCHAR(255),
    notification_channels TEXT[] DEFAULT '{"dashboard"}', -- e.g. '{"dashboard", "email", "slack", "webhook"}'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_alerts_brand_severity ON public.alerts (brand_id, severity);
CREATE INDEX IF NOT EXISTS idx_alerts_is_acknowledged ON public.alerts (is_acknowledged);
CREATE INDEX IF NOT EXISTS idx_alerts_created_at ON public.alerts (created_at DESC);

-- =============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER FUNCTION
-- =============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_brands_updated_at') THEN
        CREATE TRIGGER set_brands_updated_at
            BEFORE UPDATE ON public.brands
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_assets_updated_at') THEN
        CREATE TRIGGER set_assets_updated_at
            BEFORE UPDATE ON public.assets
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_findings_updated_at') THEN
        CREATE TRIGGER set_findings_updated_at
            BEFORE UPDATE ON public.findings
            FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
    END IF;
END $$;

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS across all 6 tables
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.findings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies: Allow authenticated users and anon clients (for dashboard monitoring)
DO $$
BEGIN
    -- 1. Brands Policies
    DROP POLICY IF EXISTS "Allow read access to all brands" ON public.brands;
    CREATE POLICY "Allow read access to all brands"
        ON public.brands FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Allow write access to authenticated users" ON public.brands;
    CREATE POLICY "Allow write access to authenticated users"
        ON public.brands FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);

    -- 2. Assets Policies
    DROP POLICY IF EXISTS "Allow read access to assets" ON public.assets;
    CREATE POLICY "Allow read access to assets"
        ON public.assets FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Allow write access to assets" ON public.assets;
    CREATE POLICY "Allow write access to assets"
        ON public.assets FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);

    -- 3. Scans Policies
    DROP POLICY IF EXISTS "Allow read access to scans" ON public.scans;
    CREATE POLICY "Allow read access to scans"
        ON public.scans FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Allow write access to scans" ON public.scans;
    CREATE POLICY "Allow write access to scans"
        ON public.scans FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);

    -- 4. Findings Policies
    DROP POLICY IF EXISTS "Allow read access to findings" ON public.findings;
    CREATE POLICY "Allow read access to findings"
        ON public.findings FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Allow write access to findings" ON public.findings;
    CREATE POLICY "Allow write access to findings"
        ON public.findings FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);

    -- 5. Risk Evidence Policies
    DROP POLICY IF EXISTS "Allow read access to risk_evidence" ON public.risk_evidence;
    CREATE POLICY "Allow read access to risk_evidence"
        ON public.risk_evidence FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Allow write access to risk_evidence" ON public.risk_evidence;
    CREATE POLICY "Allow write access to risk_evidence"
        ON public.risk_evidence FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);

    -- 6. Alerts Policies
    DROP POLICY IF EXISTS "Allow read access to alerts" ON public.alerts;
    CREATE POLICY "Allow read access to alerts"
        ON public.alerts FOR SELECT
        TO public
        USING (true);

    DROP POLICY IF EXISTS "Allow write access to alerts" ON public.alerts;
    CREATE POLICY "Allow write access to alerts"
        ON public.alerts FOR ALL
        TO public
        USING (true)
        WITH CHECK (true);
END $$;

-- =============================================================================
-- OPTIONAL INITIAL SEED DATA FOR "NovaPay"
-- Seeds default brand and official whitelist protection for demonstration
-- =============================================================================
INSERT INTO public.brands (name, industry, website, description, keywords, aliases)
VALUES (
    'NovaPay',
    'Financial Technology / Banking',
    'https://novapay.io',
    'Next-generation mobile payment, digital wallet, and instant transfer platform.',
    ARRAY['novapay', 'mobile payments', 'instant credit', 'digital wallet', 'fintech'],
    ARRAY['NovaPay Global', 'NovaPay Inc', 'NovaPay Ltd']
)
ON CONFLICT (name) DO NOTHING;

-- Seed Official Whitelisted Assets (Zero False-Positive Protection)
DO $$
DECLARE
    v_brand_id UUID;
BEGIN
    SELECT id INTO v_brand_id FROM public.brands WHERE name = 'NovaPay' LIMIT 1;

    IF v_brand_id IS NOT NULL THEN
        -- Official Twitter handle
        INSERT INTO public.assets (brand_id, asset_type, platform_or_store, identifier, display_name, url, is_official, verified_badge, data_source)
        VALUES (v_brand_id, 'social', 'twitter', 'NovaPay', 'NovaPay Official', 'https://twitter.com/NovaPay', true, true, 'synthetic_demo')
        ON CONFLICT DO NOTHING;

        -- Official Instagram handle
        INSERT INTO public.assets (brand_id, asset_type, platform_or_store, identifier, display_name, url, is_official, verified_badge, data_source)
        VALUES (v_brand_id, 'social', 'instagram', 'novapay_official', 'NovaPay Official Bank', 'https://instagram.com/novapay_official', true, true, 'synthetic_demo')
        ON CONFLICT DO NOTHING;

        -- Official Mobile App (Google Play)
        INSERT INTO public.assets (brand_id, asset_type, platform_or_store, identifier, display_name, publisher_name, is_official, verified_badge, data_source)
        VALUES (v_brand_id, 'mobile_app', 'google_play', 'com.novapay.app', 'NovaPay: Mobile Banking & Pay', 'NovaPay Technologies Ltd', true, true, 'synthetic_demo')
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- =============================================================================
-- END OF MIGRATION
-- =============================================================================
