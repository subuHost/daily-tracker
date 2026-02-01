"use server";

import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { logFood, logHealthMetrics, getHealthMetrics, type FoodLog } from "@/lib/db/health";
import { getHabits, toggleHabitToday } from "@/lib/db/habits";
import { createTask } from "@/lib/db/tasks";

// Initialize Gemini client
// Note: This requires GEMINI_API_KEY in .env.local
const genAI = process.env.GEMINI_API_KEY
    ? new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
    : null;

export interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

const SYSTEM_PROMPT = `You are a helpful and intelligent AI assistant for the "Daily Tracker" app.
Your goal is to assist the user with a wide range of tasks, including tracking habits, health, finances, and completing tasks.
You can also answer general questions, provide advice, and chat casually.

You have access to specific tools to perform actions in the app.
ALWAYS use tools when the user expressly asks to perform an action like "log food", "add task", "track habit", or "log health stats".

For food logging:
- You are a knowledgeable nutritionist.
- If the user provides a food name but no details, estimate the calories and macros (protein, carbs, fats).

For habits:
- Find the habit by name.

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
            name: "add_task",
            description: "Add a new task to the todo list",
            parameters: {
                type: SchemaType.OBJECT,
                properties: {
                    title: { type: SchemaType.STRING, description: "Task title" }
                },
                required: ["title"]
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
        }
    ]
};

export async function chatWithAI(history: Message[]) {
    if (!genAI) {
        console.error("Gemini API Key missing");
        return {
            role: "assistant",
            content: "I'm sorry, but the Gemini API key is not configured. Please add GEMINI_API_KEY to your .env.local file."
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

        // Add System Prompt
        chatHistory.push({
            role: "user",
            parts: [{ text: "System System: " + SYSTEM_PROMPT }]
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

            if (call.name === "log_food") {
                await logFood(args);
                resultText = `Logged ${args.food_item} (${args.calories} kcal).`;
                output = { success: true, message: resultText };
            } else if (call.name === "add_task") {
                await createTask({ title: args.title });
                resultText = `Added task: "${args.title}".`;
                output = { success: true, message: resultText };
            } else if (call.name === "log_health") {
                await logHealthMetrics({ ...args, date: new Date().toISOString().split("T")[0] });
                resultText = `Health metrics updated.`;
                output = { success: true, message: resultText };
            } else if (call.name === "track_habit") {
                const habits = await getHabits();
                const habit = habits.find(h => h.name.toLowerCase().includes(args.habit_name.toLowerCase()));

                if (habit) {
                    await toggleHabitToday(habit.id);
                    resultText = `Toggled habit "${habit.name}".`;
                    output = { success: true, message: resultText };
                } else {
                    resultText = `Could not find habit "${args.habit_name}".`;
                    output = { success: false, message: resultText };
                }
            }

            // Send function result back to model to get final response
            // For simplicity in this widget, we can just return the result text as the assistant response
            // Or we can feed it back. Let's return the result text directly to keep it fast.
            return {
                role: "assistant",
                content: resultText
            };
        }

        return {
            role: "assistant",
            content: response.text()
        };

    } catch (error: any) {
        console.error("Gemini AI Error:", error);
        return {
            role: "assistant",
            content: `Error: ${error.message || "Something went wrong."}`
        };
    }
}
