CREATE TABLE IF NOT EXISTS organization_notification_settings (
    organization_id UUID PRIMARY KEY REFERENCES organizations(id) ON DELETE CASCADE,
    low_stock_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    waste_alerts_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    weekly_report_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    report_email TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
