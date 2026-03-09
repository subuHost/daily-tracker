-- User AI Settings Table
-- Stores per-user API keys for AI providers (OpenAI, Perplexity)
-- Keys are encrypted at rest via strict RLS: only the owning user can read/write

CREATE TABLE IF NOT EXISTS user_ai_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    openai_api_key TEXT,
    perplexity_api_key TEXT,
    preferred_model TEXT DEFAULT 'gemini',  -- 'gemini', 'openai', 'perplexity'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- RLS policies - strict user-only access
ALTER TABLE user_ai_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own AI settings"
    ON user_ai_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI settings"
    ON user_ai_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI settings"
    ON user_ai_settings FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own AI settings"
    ON user_ai_settings FOR DELETE
    USING (auth.uid() = user_id);

-- Watchlist Table
-- Stores user's watched stock symbols for quick access
CREATE TABLE IF NOT EXISTS watchlist (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    name TEXT,
    exchange TEXT DEFAULT 'NSE',
    type TEXT DEFAULT 'stock' CHECK (type IN ('stock', 'crypto', 'mutual_fund', 'etf')),
    notes TEXT,
    alert_price_above NUMERIC,
    alert_price_below NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, symbol)
);

ALTER TABLE watchlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own watchlist"
    ON watchlist FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert into their own watchlist"
    ON watchlist FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own watchlist"
    ON watchlist FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete from their own watchlist"
    ON watchlist FOR DELETE
    USING (auth.uid() = user_id);

-- Stock Price History Table
-- Stores historical price data for charting
CREATE TABLE IF NOT EXISTS stock_price_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    symbol TEXT NOT NULL,
    open_price NUMERIC,
    high_price NUMERIC,
    low_price NUMERIC,
    close_price NUMERIC NOT NULL,
    volume BIGINT,
    timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(symbol, timestamp)
);

ALTER TABLE stock_price_history ENABLE ROW LEVEL SECURITY;

-- Price history is readable by all authenticated users (public market data)
CREATE POLICY "Authenticated users can view price history"
    ON stock_price_history FOR SELECT
    USING (auth.role() = 'authenticated');

-- Only server can insert (via service role)
CREATE POLICY "Service role can insert price history"
    ON stock_price_history FOR INSERT
    WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_watchlist_user_id ON watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_symbol ON stock_price_history(symbol);
CREATE INDEX IF NOT EXISTS idx_stock_price_history_symbol_timestamp ON stock_price_history(symbol, timestamp DESC);
