-- Migration: Add user_entitlements table for cross-platform entitlement sync
-- Date: 2026-01-29
-- Description: Stores purchase entitlements synced from native app (RevenueCat)
--              for offline access and web platform parity.

-- =============================================================================
-- CREATE USER_ENTITLEMENTS TABLE
-- =============================================================================

CREATE TABLE IF NOT EXISTS user_entitlements (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    tier TEXT NOT NULL CHECK (tier IN ('standard', 'advanced')),
    purchase_type TEXT NOT NULL CHECK (purchase_type IN ('lifetime', 'subscription')),
    purchased_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,  -- null for lifetime purchases
    will_renew BOOLEAN NOT NULL DEFAULT false,
    product_id TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- ROW LEVEL SECURITY
-- =============================================================================

ALTER TABLE user_entitlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own entitlement" ON user_entitlements
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own entitlement" ON user_entitlements
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own entitlement" ON user_entitlements
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own entitlement" ON user_entitlements
    FOR DELETE USING (auth.uid() = user_id);

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_user_entitlements_updated_at ON user_entitlements(updated_at);

-- =============================================================================
-- TRIGGERS
-- =============================================================================

CREATE OR REPLACE FUNCTION update_user_entitlements_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_entitlements_updated_at
    BEFORE UPDATE ON user_entitlements
    FOR EACH ROW
    EXECUTE FUNCTION update_user_entitlements_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON TABLE user_entitlements IS 'Purchase entitlements synced from native app for cross-platform and offline access';
COMMENT ON COLUMN user_entitlements.user_id IS 'User ID (PK, FK to auth.users)';
COMMENT ON COLUMN user_entitlements.tier IS 'Purchased tier: standard or advanced';
COMMENT ON COLUMN user_entitlements.purchase_type IS 'Purchase type: lifetime or subscription';
COMMENT ON COLUMN user_entitlements.purchased_at IS 'When the purchase was made';
COMMENT ON COLUMN user_entitlements.expires_at IS 'Subscription expiry date (null for lifetime)';
COMMENT ON COLUMN user_entitlements.will_renew IS 'Whether subscription will auto-renew';
COMMENT ON COLUMN user_entitlements.product_id IS 'App Store product identifier';
COMMENT ON COLUMN user_entitlements.updated_at IS 'Last sync timestamp';
