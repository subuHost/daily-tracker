'use strict';

import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000');

/**
 * Cron endpoint — Daily portfolio research & alerts.
 * Runs at 4 AM UTC (9:30 AM IST) via Vercel Cron.
 *
 * For each user with investments/watchlist:
 * 1. Fetches live stock quotes
 * 2. Identifies significant movers (|changePercent| > 3%)
 * 3. Generates AI watchlist briefing (if API keys available)
 * 4. Stores research results
 * 5. Sends push notification for alerts
 */
export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const secret = request.headers.get('x-cron-secret') || searchParams.get('secret');

    if (secret !== process.env.CRON_SECRET) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = await createClient();
    const today = new Date().toISOString().split('T')[0];

    let usersProcessed = 0;
    let alertsSent = 0;

    try {
        // Get all users who have investments or watchlist items
        const { data: investmentUsers } = await supabase
            .from('investments')
            .select('user_id')
            .is('sell_date', null);

        const { data: watchlistUsers } = await supabase
            .from('watchlist')
            .select('user_id');

        // Unique user IDs
        const userIds = new Set<string>();
        (investmentUsers || []).forEach((r: any) => userIds.add(r.user_id));
        (watchlistUsers || []).forEach((r: any) => userIds.add(r.user_id));

        // Import stock functions
        const { getStockQuotes, generateWatchlistBriefing } = await import('@/app/actions/stocks');

        for (const userId of Array.from(userIds)) {
            try {
                // Check if already processed today (deduplication)
                const { data: existing } = await supabase
                    .from('daily_portfolio_research')
                    .select('id')
                    .eq('user_id', userId)
                    .eq('date', today)
                    .single();

                if (existing) continue;

                // Fetch user's investments
                const { data: investments } = await supabase
                    .from('investments')
                    .select('symbol, name, buy_price, quantity, type')
                    .eq('user_id', userId)
                    .is('sell_date', null);

                // Fetch user's watchlist
                const { data: watchlist } = await supabase
                    .from('watchlist')
                    .select('symbol, name, exchange, type')
                    .eq('user_id', userId);

                // Gather symbols
                const allSymbols: string[] = [];
                const suffixMap: Record<string, string> = {};

                for (const inv of investments || []) {
                    const sym = inv.symbol.toUpperCase();
                    const yahooSym = sym.endsWith('.NS') || sym.endsWith('.BO') ? sym : `${sym}.NS`;
                    allSymbols.push(yahooSym);
                    suffixMap[yahooSym] = sym;
                }

                for (const item of watchlist || []) {
                    let yahooSym = item.symbol;
                    if (item.exchange === 'NSE') yahooSym = `${item.symbol}.NS`;
                    else if (item.exchange === 'BSE') yahooSym = `${item.symbol}.BO`;
                    allSymbols.push(yahooSym);
                    suffixMap[yahooSym] = item.symbol;
                }

                if (allSymbols.length === 0) continue;

                // Fetch quotes
                const rawQuotes = await getStockQuotes(Array.from(new Set(allSymbols)));
                const quotes: Record<string, any> = {};
                for (const [key, quote] of Object.entries(rawQuotes)) {
                    const original = suffixMap[key] || key;
                    quotes[original] = quote;
                }

                // Identify significant movers (|changePercent| > 3%)
                const stockAlerts: Array<{ symbol: string; name: string; change: number; changePercent: number; current: number }> = [];
                for (const [symbol, quote] of Object.entries(quotes)) {
                    const q = quote as any;
                    if (Math.abs(q.changePercent) >= 3) {
                        const inv = (investments || []).find((i: any) => i.symbol === symbol);
                        const wl = (watchlist || []).find((w: any) => w.symbol === symbol);
                        stockAlerts.push({
                            symbol,
                            name: inv?.name || wl?.name || symbol,
                            change: q.change,
                            changePercent: q.changePercent,
                            current: q.current,
                        });
                    }
                }

                // Generate AI briefing (best-effort, non-blocking)
                let briefingData: any = null;
                try {
                    const stocks = [...(investments || []), ...(watchlist || [])].map((item: any) => ({
                        symbol: item.symbol,
                        name: item.name || item.symbol,
                    })).slice(0, 15); // Limit to 15 stocks

                    if (stocks.length > 0) {
                        briefingData = await generateWatchlistBriefing(stocks);
                    }
                } catch (error) {
                    console.error(`AI briefing failed for user ${userId}:`, error);
                }

                // Store research results
                await supabase
                    .from('daily_portfolio_research')
                    .upsert({
                        user_id: userId,
                        date: today,
                        market_overview: briefingData?.marketOverview || null,
                        stock_alerts: stockAlerts,
                        full_research: briefingData || {},
                    }, { onConflict: 'user_id,date' });

                usersProcessed++;

                // Send push notification if significant alerts
                if (stockAlerts.length > 0) {
                    const alertSummary = stockAlerts
                        .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
                        .slice(0, 3)
                        .map(a => `${a.name} ${a.changePercent >= 0 ? '+' : ''}${a.changePercent.toFixed(1)}%`)
                        .join(', ');

                    try {
                        await fetch(`${APP_URL}/api/push/send`, {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'x-cron-secret': process.env.CRON_SECRET || '',
                            },
                            body: JSON.stringify({
                                user_id: userId,
                                title: '📊 Stock Alert',
                                body: `Significant moves: ${alertSummary}`,
                                type: 'stock_alert',
                                action_url: '/finance/stocks',
                            }),
                        });
                        alertsSent++;
                    } catch (pushError) {
                        console.error(`Push notification failed for user ${userId}:`, pushError);
                    }
                }
            } catch (userError) {
                console.error(`Portfolio research failed for user ${userId}:`, userError);
            }
        }

        return NextResponse.json({
            success: true,
            date: today,
            users_processed: usersProcessed,
            alerts_sent: alertsSent,
            total_users: userIds.size,
        });
    } catch (error) {
        console.error('Portfolio research cron error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
