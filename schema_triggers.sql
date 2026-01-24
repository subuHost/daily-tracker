-- ============================================
-- POSTGRES TRIGGERS FOR AUTO-CALCULATIONS
-- ============================================

-- 1. AUTO-UPDATE ACCOUNT BALANCE ON TRANSACTION
-- This trigger updates the balance when expenses/income are added

-- First, ensure accounts table has current_balance
-- ALTER TABLE accounts ADD COLUMN IF NOT EXISTS current_balance DECIMAL(12,2) DEFAULT 0;

-- Create the trigger function
CREATE OR REPLACE FUNCTION update_account_balance()
RETURNS TRIGGER AS $$
BEGIN
    -- For new transactions
    IF TG_OP = 'INSERT' THEN
        IF NEW.type = 'expense' THEN
            UPDATE accounts 
            SET current_balance = current_balance - NEW.amount
            WHERE id = NEW.account_id AND user_id = NEW.user_id;
        ELSIF NEW.type = 'income' THEN
            UPDATE accounts 
            SET current_balance = current_balance + NEW.amount
            WHERE id = NEW.account_id AND user_id = NEW.user_id;
        END IF;
        RETURN NEW;
    
    -- For deleted transactions (reverse the effect)
    ELSIF TG_OP = 'DELETE' THEN
        IF OLD.type = 'expense' THEN
            UPDATE accounts 
            SET current_balance = current_balance + OLD.amount
            WHERE id = OLD.account_id AND user_id = OLD.user_id;
        ELSIF OLD.type = 'income' THEN
            UPDATE accounts 
            SET current_balance = current_balance - OLD.amount
            WHERE id = OLD.account_id AND user_id = OLD.user_id;
        END IF;
        RETURN OLD;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create the trigger (only if account_id column exists)
-- DROP TRIGGER IF EXISTS trigger_update_balance ON transactions;
-- CREATE TRIGGER trigger_update_balance
-- AFTER INSERT OR DELETE ON transactions
-- FOR EACH ROW EXECUTE FUNCTION update_account_balance();


-- 2. HABIT STREAK CALCULATION
-- This function calculates the current streak for a habit

CREATE OR REPLACE FUNCTION calculate_habit_streak(p_habit_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak INTEGER := 0;
    check_date DATE := CURRENT_DATE;
    log_exists BOOLEAN;
BEGIN
    LOOP
        SELECT EXISTS(
            SELECT 1 FROM habit_logs 
            WHERE habit_id = p_habit_id 
            AND date = check_date 
            AND completed = true
        ) INTO log_exists;
        
        IF log_exists THEN
            streak := streak + 1;
            check_date := check_date - INTERVAL '1 day';
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak;
END;
$$ LANGUAGE plpgsql;


-- 3. MONTHLY BUDGET REMAINING VIEW
-- Create a view for easy budget tracking
-- NOTE: This view assumes budgets.month is stored as 'YYYY-MM-DD' string.
-- If your schema differs, adjust the casting accordingly.

-- Skip if budgets table schema is different
-- You can run this query manually after verifying your budgets.month format:

-- CREATE OR REPLACE VIEW monthly_budget_status AS
-- SELECT 
--     b.user_id,
--     b.amount as budget_amount,
--     COALESCE(SUM(t.amount), 0) as spent_amount,
--     b.amount - COALESCE(SUM(t.amount), 0) as remaining_amount,
--     ROUND((COALESCE(SUM(t.amount), 0) / NULLIF(b.amount, 0)) * 100, 2) as percentage_used
-- FROM budgets b
-- LEFT JOIN transactions t ON t.user_id = b.user_id 
--     AND t.type = 'expense'
--     AND EXTRACT(MONTH FROM t.date::date) = EXTRACT(MONTH FROM CURRENT_DATE)
--     AND EXTRACT(YEAR FROM t.date::date) = EXTRACT(YEAR FROM CURRENT_DATE)
-- WHERE EXTRACT(MONTH FROM b.month::date) = EXTRACT(MONTH FROM CURRENT_DATE)
--     AND EXTRACT(YEAR FROM b.month::date) = EXTRACT(YEAR FROM CURRENT_DATE)
-- GROUP BY b.user_id, b.amount;


-- ============================================
-- PGVECTOR SETUP FOR SEMANTIC SEARCH
-- ============================================

-- Enable the pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to transactions for semantic search
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create an index for fast similarity search
CREATE INDEX IF NOT EXISTS transactions_embedding_idx 
ON transactions USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search transactions by semantic similarity
CREATE OR REPLACE FUNCTION search_transactions_semantic(
    p_user_id UUID,
    p_query_embedding vector(1536),
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    description TEXT,
    amount DECIMAL,
    date DATE,
    type TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        t.id,
        t.description,
        t.amount,
        t.date::date,
        t.type::text,
        1 - (t.embedding <=> p_query_embedding) as similarity
    FROM transactions t
    WHERE t.user_id = p_user_id
    AND t.embedding IS NOT NULL
    ORDER BY t.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;


-- ============================================
-- AUTO-CATEGORIZATION HELPER
-- ============================================

-- Store common patterns for auto-categorization
CREATE TABLE IF NOT EXISTS categorization_patterns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    pattern TEXT NOT NULL,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- RLS for categorization_patterns
ALTER TABLE categorization_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their patterns"
ON categorization_patterns FOR ALL
USING (auth.uid() = user_id);


-- ============================================
-- DAILY AGGREGATES (for fast dashboard)
-- ============================================

CREATE TABLE IF NOT EXISTS daily_aggregates (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL,
    total_expenses DECIMAL(12,2) DEFAULT 0,
    total_income DECIMAL(12,2) DEFAULT 0,
    transaction_count INTEGER DEFAULT 0,
    habits_completed INTEGER DEFAULT 0,
    tasks_completed INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, date)
);

-- Trigger to update daily aggregates on transaction changes
CREATE OR REPLACE FUNCTION update_daily_aggregates()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        INSERT INTO daily_aggregates (user_id, date, total_expenses, total_income, transaction_count)
        VALUES (
            NEW.user_id,
            NEW.date::date,
            CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
            CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END,
            1
        )
        ON CONFLICT (user_id, date) DO UPDATE SET
            total_expenses = daily_aggregates.total_expenses + 
                CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
            total_income = daily_aggregates.total_income + 
                CASE WHEN NEW.type = 'income' THEN NEW.amount ELSE 0 END,
            transaction_count = daily_aggregates.transaction_count + 1,
            updated_at = NOW();
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE daily_aggregates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their aggregates"
ON daily_aggregates FOR SELECT
USING (auth.uid() = user_id);
