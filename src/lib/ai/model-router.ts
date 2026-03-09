import { Message } from "@/app/actions/ai";
import { UserAiSettings } from "@/lib/db/user-settings";
import { getGeminiClient, hasApiKeys } from "./gemini-client";
import { createOpenAIClient, openaiChat } from "./openai-client";
import { createClaudeClient, claudeChat } from "./claude-client";
import { createPerplexityClient, perplexitySearch } from "./perplexity-client";
import { getUserAiSettingsServer } from "@/lib/db/user-settings.server";

export type Provider = 'gemini' | 'openai' | 'claude' | 'grok';

export interface ModelConfig {
    provider: Provider;
    model: string;
    apiKey?: string;
}

export interface ModelOption {
    id: string;
    label: string;
    provider: Provider;
    tier: 'fast' | 'thinking';
    available?: boolean;
}

const MODEL_CATALOGUE: ModelOption[] = [
    { id: 'gemini-flash', label: 'Gemini Flash', provider: 'gemini', tier: 'fast' },
    { id: 'gemini-pro', label: 'Gemini Pro', provider: 'gemini', tier: 'thinking' },
    { id: 'gpt-4o-mini', label: 'GPT-4o mini', provider: 'openai', tier: 'fast' },
    { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai', tier: 'thinking' },
    { id: 'claude-3-haiku', label: 'Claude Haiku', provider: 'claude', tier: 'fast' },
    { id: 'claude-3-5-sonnet', label: 'Claude 3.5 Sonnet', provider: 'claude', tier: 'thinking' },
    { id: 'grok-2-mini', label: 'Grok-2 mini', provider: 'grok', tier: 'fast' },
    { id: 'grok-2', label: 'Grok-2', provider: 'grok', tier: 'thinking' },
];

export class ModelRouter {
    static getAvailableModels(settings: UserAiSettings | null): ModelOption[] {
        return MODEL_CATALOGUE.map(model => {
            let available = true;
            if (model.provider === 'openai' && !settings?.openai_api_key) available = false;
            if (model.provider === 'claude' && !settings?.claude_api_key) available = false;
            if (model.provider === 'grok' && !settings?.grok_api_key) available = false;

            return {
                ...model,
                available
            } as ModelOption & { available: boolean };
        });
    }

    static resolveConfig(modelId: string, settings: UserAiSettings | null): ModelConfig {
        // Map legacy values
        if (modelId === 'flash') modelId = 'gemini-flash';
        if (modelId === 'pro') modelId = 'gemini-pro';

        const modelOption = MODEL_CATALOGUE.find(m => m.id === modelId) || MODEL_CATALOGUE[0];
        const config: ModelConfig = {
            provider: modelOption.provider,
            model: modelOption.id,
        };

        if (settings) {
            if (config.provider === 'openai') config.apiKey = settings.openai_api_key || undefined;
            if (config.provider === 'claude') config.apiKey = settings.claude_api_key || undefined;
            if (config.provider === 'grok') config.apiKey = settings.grok_api_key || undefined;
        }

        return config;
    }

    static async chat(config: ModelConfig, messages: Message[], systemPrompt: string): Promise<string> {
        if (config.provider === 'gemini') {
            const { markKeyFailed, getCurrentKey, getKeyCount } = await import("./gemini-client");
            const maxRetries = Math.max(getKeyCount(), 3);
            let lastError: any = null;

            for (let attempt = 0; attempt < maxRetries; attempt++) {
                const genAI = getGeminiClient();
                if (!genAI) throw new Error("Gemini API key not configured");

                try {
                    // Map legacy resolution for gemini just in case
                    const resolvedModel = config.model === 'gemini-pro' ? 'gemini-1.5-pro-latest' : 'gemini-flash-latest';
                    const modelInstance = genAI.getGenerativeModel({
                        model: resolvedModel,
                        tools: [{
                            functionDeclarations: [
                                {
                                    name: "web_search",
                                    description: "Search the web for up-to-date information.",
                                    parameters: {
                                        type: "OBJECT" as any,
                                        properties: {
                                            query: { type: "STRING" as any, description: "The search query" }
                                        },
                                        required: ["query"]
                                    }
                                }
                            ]
                        } as any],
                    });

                    // Map messages
                    const chatHistory = [
                        { role: "user", parts: [{ text: "System: " + systemPrompt }] },
                        { role: "model", parts: [{ text: "Understood." }] }
                    ];

                    const allMessages = messages;
                    const lastMessage = allMessages[allMessages.length - 1];

                    if (allMessages.length > 1) {
                        const previousMessages = allMessages.slice(0, -1);
                        chatHistory.push(...previousMessages.map(msg => ({
                            role: msg.role === "user" ? "user" : "model",
                            parts: [{ text: msg.content }]
                        })));
                    }

                    const chat = modelInstance.startChat({ history: chatHistory as any });
                    const result = await chat.sendMessage(lastMessage.content);
                    const response = result.response;

                    const functionCalls = response.functionCalls();
                    if (functionCalls && functionCalls.length > 0) {
                        const call = functionCalls[0];
                        if (call.name === "web_search") {
                            const args = call.args as any;
                            const settings = await getUserAiSettingsServer();
                            if (settings?.perplexity_api_key) {
                                const perplexityResult = await perplexitySearch(createPerplexityClient(settings.perplexity_api_key), args.query);
                                return `I found some information from the web:\n\n${perplexityResult.content}\n\nCitations:\n${perplexityResult.citations?.join("\n") || "None"}`;
                            } else {
                                return "Web search is unavailable because Perplexity API key is not configured.";
                            }
                        }
                    }

                    return response.text();
                } catch (error: any) {
                    lastError = error;
                    const isTransient = error.status === 503 || error.status === 429 ||
                        error.message?.includes('503') || error.message?.includes('429') ||
                        error.message?.includes('quota') || error.message?.includes('demand');

                    if (isTransient && attempt < maxRetries - 1) {
                        const currentKey = getCurrentKey();
                        if (currentKey) markKeyFailed(currentKey);
                        console.warn(`Gemini transient error (attempt ${attempt + 1}/${maxRetries}):`, error.message);
                        // Wait briefly before retry
                        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                        continue;
                    }
                    break;
                }
            }

            // Fallback to other providers if Gemini failed
            const settings = await getUserAiSettingsServer().catch(() => null);
            if (settings) {
                if (settings.openai_api_key) {
                    console.info("Gemini failed, falling back to OpenAI...");
                    return ModelRouter.chat({ provider: 'openai', model: 'gpt-4o-mini', apiKey: settings.openai_api_key }, messages, systemPrompt);
                } else if (settings.claude_api_key) {
                    console.info("Gemini failed, falling back to Claude...");
                    return ModelRouter.chat({ provider: 'claude', model: 'claude-3-haiku', apiKey: settings.claude_api_key }, messages, systemPrompt);
                }
            }

            throw lastError || new Error("Gemini fetch failed after retries");

        } else if (config.provider === 'openai' || config.provider === 'grok') {
            if (!config.apiKey) throw new Error(`API key missing for ${config.provider}`);

            // For grok, baseURL is custom
            const authOptions: any = { apiKey: config.apiKey };
            if (config.provider === 'grok') {
                authOptions.baseURL = 'https://api.x.ai/v1';
            }
            // Temporarily use dynamically imported OpenAI client
            const { OpenAI } = await import("openai");
            const client = new OpenAI(authOptions);

            const openaiMessages = [
                { role: "system" as const, content: systemPrompt },
                ...messages.map(m => ({ role: m.role === "user" ? "user" as const : "assistant" as const, content: m.content }))
            ];

            const response = await client.chat.completions.create({
                model: config.model,
                messages: openaiMessages,
                tools: [
                    {
                        type: "function",
                        function: {
                            name: "web_search",
                            description: "Search the web for up-to-date information.",
                            parameters: {
                                type: "object",
                                properties: {
                                    query: { type: "string", description: "The search query" }
                                },
                                required: ["query"]
                            }
                        }
                    }
                ],
                tool_choice: "auto"
            });

            const choice = response.choices[0];
            if (choice.message?.tool_calls?.length) {
                const call: any = choice.message.tool_calls[0];
                if (call.function?.name === "web_search") {
                    const args = JSON.parse(call.function.arguments);
                    const settings = await getUserAiSettingsServer();
                    if (settings?.perplexity_api_key) {
                        const perplexityResult = await perplexitySearch(createPerplexityClient(settings.perplexity_api_key), args.query);
                        return `I found some information from the web:\n\n${perplexityResult.content}\n\nCitations:\n${perplexityResult.citations?.join("\n") || "None"}`;
                    } else {
                        return "Web search is unavailable because Perplexity API key is not configured.";
                    }
                }
            }

            return choice.message?.content || "";

        } else if (config.provider === 'claude') {
            if (!config.apiKey) throw new Error("Claude API key not configured");
            const client = createClaudeClient(config.apiKey);
            return await claudeChat(client, messages, {
                model: config.model,
                systemPrompt
            });
        }

        throw new Error("Unsupported provider");
    }
}
