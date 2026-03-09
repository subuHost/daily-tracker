import Anthropic from '@anthropic-ai/sdk';
import { Message } from '@/app/actions/ai';

export function createClaudeClient(apiKey: string) {
    return new Anthropic({
        apiKey,
    });
}

export async function claudeChat(
    client: Anthropic,
    messages: Message[],
    options?: {
        model?: string;
        systemPrompt?: string;
    }
) {
    const model = options?.model || 'claude-3-5-sonnet-20241022';

    // Map our Message type to Anthropic's message format
    const anthropicMessages: Anthropic.MessageParam[] = messages
        .filter(msg => msg.role === 'user' || msg.role === 'assistant') // Anthropic doesn't have a direct 'system' role in the messages array
        .map(msg => ({
            role: msg.role === 'user' ? 'user' : 'assistant',
            content: msg.content,
        }));

    const response = await client.messages.create({
        model,
        max_tokens: 2000,
        system: options?.systemPrompt,
        messages: anthropicMessages,
    });

    // Anthropic returns an array of content blocks, usually one text block
    const firstBlock = response.content[0];
    if (firstBlock && firstBlock.type === 'text') {
        return firstBlock.text;
    }

    return '';
}
