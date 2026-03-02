"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { logFood, logHealthMetrics, getHealthMetrics, type FoodLog } from "@/lib/db/health";
import { getHabits, toggleHabitToday } from "@/lib/db/habits";
import { createTask } from "@/lib/db/tasks";
import { getGeminiClient, hasApiKeys } from "@/lib/ai/gemini-client";
import { getChatHistory, saveChatMessage, clearChatHistory } from "@/lib/db/chat";

// ─── Cross-Domain Context Types ──────────────────────────────────────────
export interface DailyContext {
    finance: {
        budgetUsedPct: number | null;
        topCategories: string[];
        monthSpend: number;
        budget: number | null;
    };
    health: {
        calories: number;
        calorieGoal: number;
        protein: number;
        sleep: number | null;
        water: number | null;
    };
    habits: {
        completedToday: number;
        totalToday: number;
        pendingToday: string[];
        atRiskStreaks: string[];
    };
    mood: {
        todayMood: number | null;
        yesterdayNotes: string | null;
    };
    tasks: {
        overdueCount: number;
        dueTodayTitles: string[];
        highPriorityOpen: number;
    };
    study: {
        dueForReviewCount: number;
        topicsDue: string[];
    };
}

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
    imageBase64?: string; // Optional base64 image for vision
}

const SYSTEM_PROMPT = `You are a helpful and intelligent AI assistant for the "Daily Tracker" app.
Your goal is to assist the user with a wide range of tasks, including tracking habits, health, finances, and completing tasks.
You can also answer general questions, provide advice, and chat casually.

You have access to specific tools to perform actions in the app.
ALWAYS use tools when the user expressly asks to perform an action like "log food", "add task", "track habit", "log health stats", or "log expense".

For food logging:
- You are a knowledgeable nutritionist.
- ALWAYS estimate and provide all details: calories, protein, carbs, and fats.
- If the user provides a food name but no details, estimate based on standard portions.
- Ensure all nutritional values (calories, protein, carbs, fats) are provided as INTEGERS.

For habits:
- Find the habit by name.

For tasks:
- Assist in creating tasks with titles and optional priorities.

For finances:
- Help users log expenses or income by providing the amount and a description.

If you don't have enough information for a tool, ask for clarification.
If the user asks a general question (e.g., "How do I make pasta?", "Tell me a joke"), answer it directly without using tools.
Keep responses concise and helpful.`;

// Tool Definitions for Gemini
const tools = {
    functionDeclarations: [
        {
            name: "log_food",
            description: "Log a food item consumed by the user. Estimate calories/macros if not provided.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    food_item: { type: SchemaType.STRING, description: "Name of the food" },
                    quantity: { type: SchemaType.STRING, description: "Quantity consumed e.g. '1 large', '100g'" },
                    calories: { type: SchemaType.NUMBER, description: "Estimated calories" },
                    protein: { type: SchemaType.NUMBER, description: "Protein in grams" },
                    carbs: { type: SchemaType.NUMBER, description: "Carbs in grams" },
                    fats: { type: SchemaType.NUMBER, description: "Fats in grams" },
                    meal_type: { type: SchemaType.STRING, enum: ["breakfast", "lunch", "dinner", "snack"] }
                },
                required: ["food_item", "calories"]
            }
        },
        {
            name: "track_habit",
            description: "Mark a habit as completed (or incomplete) for today",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    habit_name: { type: SchemaType.STRING, description: "Name of the habit to toggle" },
                    action: { type: SchemaType.STRING, enum: ["complete", "undo"], description: "Action to perform" }
                },
                required: ["habit_name"]
            }
        },
        {
            name: "log_health",
            description: "Log health metrics like weight, sleep, water",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    weight: { type: SchemaType.NUMBER, description: "Weight in kg" },
                    sleep_hours: { type: SchemaType.NUMBER, description: "Sleep in hours" },
                    water_intake: { type: SchemaType.NUMBER, description: "Water in ml" },
                    mood: { type: SchemaType.STRING, description: "Current mood" },
                    notes: { type: SchemaType.STRING, description: "Any health notes" }
                }
            }
        },
        {
            name: "add_task",
            description: "Create a new task for the user.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING, description: "Title of the task" },
                    priority: { type: SchemaType.STRING, enum: ["low", "medium", "high"], description: "Priority level" },
                    due_date: { type: SchemaType.STRING, description: "Optional due date (YYYY-MM-DD)" }
                },
                required: ["title"]
            }
        },
        {
            name: "log_expense",
            description: "Log a financial expense or income transaction.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    amount: { type: SchemaType.NUMBER, description: "Amount of the transaction" },
                    description: { type: SchemaType.STRING, description: "What the transaction was for" },
                    transaction_type: { type: SchemaType.STRING, enum: ["expense", "income"], description: "Whether it's an 'expense' or 'income'" },
                    category: { type: SchemaType.STRING, description: "Optional category name (e.g. 'Food', 'Transport')" }
                },
                required: ["amount", "description", "transaction_type"]
            }
        },
        {
            name: "search_past_meals",
            description: "Search the user's past food logs using vector similarity to remember habits or find similar foods.",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    query: { type: SchemaType.STRING, description: "Description of the food to search for e.g. 'pasta', 'healthy breakfast'" }
                },
                required: ["query"]
            }
        }
    ]
};

export async function chatWithAI(history: Message[], userContext?: string) {
    const genAI = getGeminiClient();

    if (!genAI) {
        console.error("Gemini API Key missing");
        return {
            role: "assistant",
            content: "I'm sorry, but no Gemini API keys are configured. Please add GEMINI_API_KEY to your .env.local file."
        };
    }

    try {
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            tools: [tools as any],
        });

        // Gemini history must start with a user message.
        // We also separate the current user message (last one) from the history.
        const allMessages = history;
        const lastMessage = allMessages[allMessages.length - 1];

        // Prepare history with System Prompt injected as the first user message
        let chatHistory: any[] = [];

        // Build system prompt with optional context injection
        let fullSystemPrompt = SYSTEM_PROMPT;
        if (userContext) {
            fullSystemPrompt += `\n\nHere is the user's current life snapshot for context. Use this to give more relevant, personalised answers:\n${userContext}`;
        }

        // Add System Prompt
        chatHistory.push({
            role: "user",
            parts: [{ text: "System: " + fullSystemPrompt }]
        });

        // Add a dummy model acknowledgement to maintain turn-taking (User -> Model -> User)
        chatHistory.push({
            role: "model",
            parts: [{ text: "Understood. I am ready to assist." }]
        });

        // Add remaining history (excluding the very last message which we send via sendMessage)
        if (allMessages.length > 1) {
            const previousMessages = allMessages.slice(0, -1);
            const mappedHistory = previousMessages.map(msg => ({
                role: msg.role === "user" ? "user" : "model",
                parts: [{ text: msg.content }]
            }));
            chatHistory = [...chatHistory, ...mappedHistory];
        }

        const chat = model.startChat({
            history: chatHistory,
        });

        const result = await chat.sendMessage(lastMessage.content);
        const response = result.response;
        const functionCalls = response.functionCalls();

        if (functionCalls && functionCalls.length > 0) {
            const call = functionCalls[0];
            const args = call.args as any;
            let output = {};
            let resultText = "";

            // Create server-side supabase client
            const { createClient } = await import("@/lib/supabase/server");
            const supabase = createClient();

            if (call.name === "log_food") {
                // Fix integer issue: ensure all numeric values are integers
                const foodData = {
                    ...args,
                    calories: Math.round(args.calories || 0),
                    protein: Math.round(args.protein || 0),
                    carbs: Math.round(args.carbs || 0),
                    fats: Math.round(args.fats || 0)
                };
                await logFood(foodData, supabase);
                resultText = `Logged ${args.food_item} (${foodData.calories} kcal, ${foodData.protein}g protein).`;
                output = { success: true, message: resultText };
            } else if (call.name === "add_task") {
                const { createTask } = await import("@/lib/db/tasks");
                await createTask(args, supabase);
                resultText = `Added task: "${args.title}"${args.priority ? ` with ${args.priority} priority` : ""}.`;
                output = { success: true, message: resultText };
            } else if (call.name === "log_expense") {
                const { createTransaction } = await import("@/lib/db/transactions");
                const { getOrCreateCategory } = await import("@/lib/db/categories");

                let categoryId = null;
                if (args.category) {
                    const category = await getOrCreateCategory(args.category, args.transaction_type);
                    categoryId = category.id;
                }

                await createTransaction({
                    type: args.transaction_type as "expense" | "income",
                    amount: args.amount,
                    description: args.description,
                    category_id: categoryId,
                    date: new Date().toISOString().split("T")[0]
                });
                resultText = `Logged ${args.transaction_type}: "${args.description}" for ${args.amount}.`;
                output = { success: true, message: resultText };
            } else if (call.name === "log_health") {
                await logHealthMetrics({ ...args, date: new Date().toISOString().split("T")[0] }, supabase);
                resultText = `Health metrics updated.`;
                output = { success: true, message: resultText };
            } else if (call.name === "track_habit") {
                const habits = await getHabits(supabase);
                const habit = habits.find((h: any) => h.name.toLowerCase().includes(args.habit_name.toLowerCase()));

                if (habit) {
                    await toggleHabitToday(habit.id, supabase);
                    resultText = `Toggled habit "${habit.name}".`;
                    output = { success: true, message: resultText };
                } else {
                    resultText = `Could not find habit "${args.habit_name}".`;
                    output = { success: false, message: resultText };
                }
            } else if (call.name === "search_past_meals") {
                const { generateEmbedding } = await import("@/lib/ai/embeddings");
                const vector = await generateEmbedding(args.query);

                const { data: pastMeals, error: searchError } = await supabase.rpc('match_food_logs', {
                    query_embedding: vector,
                    match_threshold: 0.5,
                    match_count: 5
                });

                if (searchError) throw searchError;

                if (pastMeals && pastMeals.length > 0) {
                    resultText = `Found ${pastMeals.length} similar meals in your history: ${pastMeals.map((m: any) => m.food_item).join(", ")}.`;
                } else {
                    resultText = "I couldn't find any similar meals in your history.";
                }
                output = { success: true, results: pastMeals };
            }

            // Persist the user message and assistant response to DB
            try {
                await saveChatMessage("user", lastMessage.content, supabase);
                await saveChatMessage("assistant", resultText, supabase);
            } catch (persistError) {
                console.error("Failed to persist chat messages:", persistError);
            }

            return {
                role: "assistant",
                content: resultText
            };
        }

        const assistantContent = response.text();

        // Persist the user message and assistant response to DB
        try {
            const { createClient } = await import("@/lib/supabase/server");
            const supabase = createClient();
            await saveChatMessage("user", lastMessage.content, supabase);
            await saveChatMessage("assistant", assistantContent, supabase);
        } catch (persistError) {
            console.error("Failed to persist chat messages:", persistError);
        }

        return {
            role: "assistant",
            content: assistantContent
        };

    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        return {
            role: "assistant",
            content: `Error: ${error.message || "Something went wrong."}`
        };
    }
}

/**
 * Analyze a food image and log it to the database.
 * Uses Gemini's vision capabilities to identify food and estimate nutrition.
 * Includes retry logic with key rotation on quota errors.
 */
export async function analyzeAndLogFoodImage(
    imageBase64: string,
    mimeType: string = "image/jpeg",
    mealType?: "breakfast" | "lunch" | "dinner" | "snack"
): Promise<{ success: boolean; message: string; foods?: any[] }> {
    const { markKeyFailed, getCurrentKey, getKeyCount } = await import("@/lib/ai/gemini-client");

    const maxRetries = Math.min(getKeyCount(), 3); // Try up to 3 different keys
    let lastError: any = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
        const genAI = getGeminiClient();

        if (!genAI) {
            return {
                success: false,
                message: "No Gemini API keys are configured. Please add GEMINI_API_KEY to your .env.local file."
            };
        }

        try {
            const model = genAI.getGenerativeModel({
                model: "gemini-flash-latest",
            });

            // Determine meal type based on current time if not provided
            const currentHour = new Date().getHours();
            const autoMealType = mealType || (
                currentHour < 11 ? "breakfast" :
                    currentHour < 15 ? "lunch" :
                        currentHour < 20 ? "dinner" : "snack"
            );

            const prompt = `You are an expert nutritionist analyzing a food image.

Identify ALL food items visible in this image and provide detailed nutritional estimates.

For EACH food item, provide:
1. Food name (be specific, e.g., "grilled chicken breast" not just "chicken")
2. Estimated quantity/portion size
3. Calories (as an integer)
4. Protein in grams (as an integer)
5. Carbs in grams (as an integer)
6. Fats in grams (as an integer)

Respond in this exact JSON format:
{
    "foods": [
        {
            "food_item": "food name",
            "quantity": "portion description",
            "calories": 250,
            "protein": 20,
            "carbs": 15,
            "fats": 10
        }
    ],
    "summary": "Brief description of the meal"
}

Be accurate with Indian foods, international cuisines, and common dishes.
If you cannot identify the food clearly, make your best estimate based on visual cues.
Always provide integer values for nutritional data.`;

            const result = await model.generateContent([
                { text: prompt },
                {
                    inlineData: {
                        mimeType: mimeType,
                        data: imageBase64
                    }
                }
            ]);

            const response = result.response;
            const text = response.text();

            // Parse the JSON response
            let parsed;
            try {
                // Extract JSON from the response (handle markdown code blocks)
                const jsonMatch = text.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    parsed = JSON.parse(jsonMatch[0]);
                } else {
                    throw new Error("No JSON found in response");
                }
            } catch (parseError) {
                console.error("Failed to parse AI response:", text);
                return {
                    success: false,
                    message: "Could not parse the food analysis. Please try again with a clearer image."
                };
            }

            // Log each food item to the database
            const { createClient } = await import("@/lib/supabase/server");
            const supabase = createClient();

            const loggedFoods: any[] = [];

            for (const food of parsed.foods || []) {
                const foodData = {
                    food_item: food.food_item,
                    quantity: food.quantity,
                    calories: Math.round(food.calories || 0),
                    protein: Math.round(food.protein || 0),
                    carbs: Math.round(food.carbs || 0),
                    fats: Math.round(food.fats || 0),
                    meal_type: autoMealType
                };

                await logFood(foodData, supabase);
                loggedFoods.push(foodData);
            }

            // Create a summary message
            const totalCalories = loggedFoods.reduce((sum, f) => sum + f.calories, 0);
            const totalProtein = loggedFoods.reduce((sum, f) => sum + f.protein, 0);

            const foodNames = loggedFoods.map(f => f.food_item).join(", ");
            const message = loggedFoods.length > 0
                ? `📸 Logged ${loggedFoods.length} item(s): ${foodNames}\n\n📊 Total: ${totalCalories} kcal, ${totalProtein}g protein\n\n${parsed.summary || ""}`
                : "Could not identify any food items in the image. Please try with a clearer photo.";

            return {
                success: loggedFoods.length > 0,
                message,
                foods: loggedFoods
            };

        } catch (error: any) {
            lastError = error;
            console.error(`Food image analysis error (attempt ${attempt + 1}/${maxRetries}):`, error);

            // Check if it's a quota/rate limit error (429)
            if (error.status === 429 || error.message?.includes('429') || error.message?.includes('quota')) {
                // Mark this key as failed so it's skipped temporarily
                const failedKey = getCurrentKey();
                if (failedKey) {
                    markKeyFailed(failedKey);
                    console.log(`Marked key as failed, will try another key...`);
                }

                // Small delay before retry
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue; // Try next key
            }

            // For non-quota errors, don't retry
            break;
        }
    }

    // All retries failed
    return {
        success: false,
        message: `Error analyzing image: ${lastError?.message || "All API keys are exhausted. Please try again in a minute."}`
    };
}

// Load chat history for the current user (called by ChatWidget on mount)
export async function loadChatHistory(): Promise<Message[]> {
    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = createClient();
        const rows = await getChatHistory(supabase, 50);
        return rows.map(row => ({
            role: row.role as "user" | "assistant",
            content: row.content,
        }));
    } catch (error) {
        console.error("Failed to load chat history:", error);
        return [];
    }
}

// ─── Cross-Domain Context Aggregation ────────────────────────────────────
// Runs 6 parallel Supabase queries and returns a typed DailyContext object
export async function getDailyContext(): Promise<DailyContext> {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const today = new Date().toISOString().split("T")[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];
    const now = new Date();
    const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const endDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${lastDay}`;

    // Run 6 domain queries in parallel
    const [tasksResult, habitsResult, budgetResult, expensesResult, foodResult, journalResult] = await Promise.all([
        // 1. Tasks
        supabase.from("tasks").select("id, title, due_date, priority").eq("user_id", user.id).eq("completed", false),
        // 2. Habits
        getHabits(supabase),
        // 3. Budget
        supabase.from("budgets").select("amount").eq("user_id", user.id).eq("month", monthStr).single(),
        // 4. Expenses
        supabase.from("transactions").select("amount, description").eq("user_id", user.id).eq("type", "expense").gte("date", monthStr).lte("date", endDate),
        // 5. Food logs
        supabase.from("food_logs").select("calories, protein").eq("user_id", user.id).eq("date", today),
        // 6. Journal (today + yesterday)
        supabase.from("daily_entries").select("mood, notes, date").eq("user_id", user.id).in("date", [today, yesterday]),
    ]);

    // 7. Study (SRS due) — may not have the columns, handled gracefully
    let studyProblems: any[] = [];
    try {
        const { data: studyData } = await supabase.from("problems").select("id, title, topic").eq("user_id", user.id).lte("next_review_at", now.toISOString());
        studyProblems = studyData || [];
    } catch {
        // Table or column may not exist — ignore
    }

    const incompleteTasks: any[] = tasksResult.data || [];
    const overdueTasks = incompleteTasks.filter((t: any) => t.due_date && t.due_date < today);
    const dueTodayTasks = incompleteTasks.filter((t: any) => t.due_date === today);
    const highPriorityTasks = incompleteTasks.filter((t: any) => t.priority === "high");

    const habits = habitsResult;
    const completedHabits = habits.filter((h: any) => h.completedToday);
    const pendingHabits = habits.filter((h: any) => !h.completedToday);
    const atRiskStreaks = habits.filter((h: any) => h.streak >= 3 && !h.completedToday).map((h: any) => h.name);

    const budget = budgetResult.data?.amount ? Number(budgetResult.data.amount) : null;
    const spent = (expensesResult.data || []).reduce((sum: number, t: any) => sum + Number(t.amount), 0);
    const budgetUsedPct = budget && budget > 0 ? Math.round((spent / budget) * 100) : null;

    const foodLogs: any[] = foodResult.data || [];
    const totalCalories = foodLogs.reduce((sum: number, f: any) => sum + Number(f.calories || 0), 0);
    const totalProtein = foodLogs.reduce((sum: number, f: any) => sum + Number(f.protein || 0), 0);

    const journalEntries: any[] = journalResult.data || [];
    const todayEntry = journalEntries.find((e: any) => e.date === today);
    const yesterdayEntry = journalEntries.find((e: any) => e.date === yesterday);

    return {
        finance: {
            budgetUsedPct,
            topCategories: [],
            monthSpend: spent,
            budget,
        },
        health: {
            calories: totalCalories,
            calorieGoal: 2000,
            protein: totalProtein,
            sleep: null,
            water: null,
        },
        habits: {
            completedToday: completedHabits.length,
            totalToday: habits.length,
            pendingToday: pendingHabits.map((h: any) => h.name),
            atRiskStreaks,
        },
        mood: {
            todayMood: todayEntry?.mood ?? null,
            yesterdayNotes: yesterdayEntry?.notes ?? null,
        },
        tasks: {
            overdueCount: overdueTasks.length,
            dueTodayTitles: dueTodayTasks.map((t: any) => t.title),
            highPriorityOpen: highPriorityTasks.length,
        },
        study: {
            dueForReviewCount: studyProblems.length,
            topicsDue: studyProblems.slice(0, 5).map((p: any) => p.topic || p.title),
        },
    };
}

// Serialize DailyContext into a human-readable string for the AI system prompt
function serializeDailyContext(ctx: DailyContext): string {
    const parts: string[] = [];

    // Tasks
    parts.push(`Tasks: ${ctx.tasks.dueTodayTitles.length} due today, ${ctx.tasks.overdueCount} overdue, ${ctx.tasks.highPriorityOpen} high-priority open.`);
    if (ctx.tasks.dueTodayTitles.length > 0) {
        parts.push(`  Due today: ${ctx.tasks.dueTodayTitles.join(", ")}`);
    }

    // Habits
    parts.push(`Habits: ${ctx.habits.completedToday}/${ctx.habits.totalToday} completed today.`);
    if (ctx.habits.atRiskStreaks.length > 0) {
        parts.push(`  Streaks at risk: ${ctx.habits.atRiskStreaks.join(", ")}`);
    }

    // Finance
    if (ctx.finance.budget !== null && ctx.finance.budget > 0 && ctx.finance.budgetUsedPct !== null) {
        parts.push(`Budget: ₹${ctx.finance.monthSpend.toFixed(0)} spent of ₹${ctx.finance.budget.toFixed(0)} this month (${ctx.finance.budgetUsedPct}% used).`);
    } else {
        parts.push(`Spending: ₹${ctx.finance.monthSpend.toFixed(0)} this month${ctx.finance.budget === 0 ? " (budget set to ₹0)" : " (no budget set)"}.`);
    }

    // Health
    parts.push(`Nutrition: ${ctx.health.calories} kcal, ${ctx.health.protein}g protein logged today.`);

    // Journal mood
    if (ctx.mood.todayMood !== null) {
        parts.push(`Mood today: ${ctx.mood.todayMood}/5.`);
    }

    // Study
    if (ctx.study.dueForReviewCount > 0) {
        parts.push(`Study: ${ctx.study.dueForReviewCount} problem(s) due for review.`);
    }

    return parts.join("\n");
}

// ─── Daily Briefing with Caching ─────────────────────────────────────────
export async function generateDailyBriefing(): Promise<{ briefing: string }> {
    const genAI = getGeminiClient();

    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { briefing: "Please sign in to see your daily briefing." };

        const today = new Date().toISOString().split("T")[0];

        // 1. Check cache first
        const { data: cached } = await supabase
            .from("daily_briefings")
            .select("content")
            .eq("user_id", user.id)
            .eq("date", today)
            .single();

        if (cached?.content) {
            return { briefing: cached.content };
        }

        // 2. Get cross-domain context
        const ctx = await getDailyContext();
        const contextString = serializeDailyContext(ctx);

        // 3. Try AI generation, fall back to deterministic if no API key or failure
        let briefing: string;

        if (genAI) {
            try {
                const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
                const prompt = `You are a concise, motivational personal assistant. Based on the user's data snapshot below, write a 3-4 sentence morning briefing. Be encouraging but realistic. Mention specific numbers. Do NOT use markdown formatting — plain text only.\n\nUser data:\n${contextString}`;
                const result = await model.generateContent(prompt);
                briefing = result.response.text().trim();
            } catch (aiError) {
                console.error("Gemini briefing generation failed, using fallback:", aiError);
                briefing = buildFallbackBriefing(ctx);
            }
        } else {
            briefing = buildFallbackBriefing(ctx);
        }

        // 4. Cache the result
        try {
            await supabase.from("daily_briefings").insert({
                user_id: user.id,
                date: today,
                content: briefing,
                context_snapshot: ctx,
            });
        } catch (cacheError) {
            console.error("Failed to cache briefing:", cacheError);
        }

        return { briefing };
    } catch (error: any) {
        console.error("Daily briefing error:", error);
        return { briefing: "Could not generate your briefing right now. Check back later!" };
    }
}

// Deterministic fallback briefing when Gemini is unavailable
function buildFallbackBriefing(ctx: DailyContext): string {
    const parts: string[] = [];

    if (ctx.tasks.dueTodayTitles.length > 0) {
        parts.push(`You have ${ctx.tasks.dueTodayTitles.length} task(s) due today.`);
    }
    if (ctx.tasks.overdueCount > 0) {
        parts.push(`${ctx.tasks.overdueCount} task(s) are overdue.`);
    }
    parts.push(`Habits: ${ctx.habits.completedToday}/${ctx.habits.totalToday} completed.`);
    if (ctx.finance.budget !== null && ctx.finance.budget > 0 && ctx.finance.budgetUsedPct !== null) {
        parts.push(`Budget at ${ctx.finance.budgetUsedPct}% for the month.`);
    }
    parts.push(`${ctx.health.calories} kcal logged so far today.`);

    return parts.join(" ");
}

// ─── Server Actions for Chat & Briefing ──────────────────────────────────

// Persist image-based chat messages (user + assistant) to the database
export async function persistImageChatMessages(
    userContent: string,
    assistantContent: string
): Promise<void> {
    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = createClient();
        await saveChatMessage("user", userContent, supabase);
        await saveChatMessage("assistant", assistantContent, supabase);
    } catch (error) {
        console.error("Failed to persist image chat messages:", error);
    }
}

// Clear all chat history for the current user
export async function clearChatHistoryAction(): Promise<void> {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = createClient();
    await clearChatHistory(supabase);
}

// Get serialized daily context for chat context injection
export async function getDailyContextAction(): Promise<string> {
    try {
        const ctx = await getDailyContext();
        return serializeDailyContext(ctx);
    } catch (error) {
        console.error("Failed to get daily context:", error);
        return "";
    }
}

// Refresh the daily briefing (delete cached + regenerate)
export async function refreshBriefingAction(): Promise<{ briefing: string }> {
    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { briefing: "Please sign in." };

        const today = new Date().toISOString().split("T")[0];

        // Delete today's cached briefing
        await supabase
            .from("daily_briefings")
            .delete()
            .eq("user_id", user.id)
            .eq("date", today);

        // Regenerate
        return await generateDailyBriefing();
    } catch (error) {
        console.error("Refresh briefing error:", error);
        return { briefing: "Could not refresh briefing. Try again later." };
    }
}

/**
 * Suggests a category for an expense based on its description.
 */
export async function suggestCategory(description: string): Promise<string | null> {
    const genAI = getGeminiClient();
    if (!genAI || !description) return null;

    try {
        const { createClient } = await import("@/lib/supabase/server");
        const supabase = createClient();

        const { getCategories } = await import("@/lib/db/categories");
        const categories = await getCategories("expense");

        if (categories.length === 0) return null;

        const categoryNames = categories.map(c => c.name);

        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            generationConfig: {
                temperature: 0.1, // Low temperature for consistent classification
            }
        });

        const prompt = `Task: Categorize a financial expense.
        Expense Description: "${description}"
        Available Categories: ${categoryNames.join(", ")}
        
        Rule: Return ONLY the exact name of the best matching category from the list provided. Do not provide any explanation or extra text. If no category is a good match, return null.`;

        const result = await model.generateContent(prompt);
        const suggestion = result.response.text().trim();

        if (suggestion.toLowerCase() === 'null') return null;

        const matched = categories.find(c => c.name.toLowerCase() === suggestion.toLowerCase());
        return matched ? matched.id : null;
    } catch (error) {
        console.error("AI Category Suggestion Error:", error);
        return null;
    }
}
