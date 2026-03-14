"use server";

import { updateInvestment } from "@/lib/db/investments";
import { getStockQuote } from "./stocks";

interface InvestmentRef {
    id: string;
    symbol: string;
    type: "stock" | "crypto" | "mutual_fund" | "other";
}

/**
 * Fetches live prices for a list of investments and updates the database.
 * Returns a map of investment IDs to their new prices.
 *
 * Stocks & Mutual Funds: Now uses Finnhub (was Yahoo Finance).
 * Crypto: Still uses CoinGecko (free, reliable).
 */
export async function fetchLivePrices(investments: InvestmentRef[]): Promise<Record<string, number>> {
    const results: Record<string, number> = {};
    const stocks = investments.filter(inv => inv.type === "stock" || inv.type === "mutual_fund");
    const cryptos = investments.filter(inv => inv.type === "crypto");

    // Fetch Stocks & Mutual Funds
    // Pass symbol directly — getStockQuote handles .NS/.BO suffix routing to Yahoo
    const stockPromises = stocks.map(async (inv) => {
        try {
            const quote = await getStockQuote(inv.symbol);

            if (quote && quote.current > 0) {
                results[inv.id] = quote.current;
                await updateInvestment(inv.id, { current_price: quote.current });
            }
        } catch (error) {
            console.error(`Failed to fetch price for ${inv.symbol}:`, error);
        }
    });

    // Fetch Cryptos via CoinGecko (Batched)
    if (cryptos.length > 0) {
        try {
            const ids = cryptos.map(c => c.symbol.toLowerCase()).join(",");
            const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=inr`);
            const data = await res.json();

            for (const crypto of cryptos) {
                const price = data[crypto.symbol.toLowerCase()]?.inr;
                if (price) {
                    results[crypto.id] = price;
                    await updateInvestment(crypto.id, { current_price: price });
                }
            }
        } catch (error) {
            console.error("Failed to fetch crypto prices:", error);
        }
    }

    await Promise.all(stockPromises);

    return results;
}
