import type { LLMAdapter } from './adapter';

const CLAUDE_API_URL = 'https://api.anthropic.com/v1/messages';
const CLAUDE_MODEL = 'claude-sonnet-4-20250514';
const ANTHROPIC_VERSION = '2023-06-01';

/**
 * LLM adapter that calls the Anthropic Messages API.
 */
export class ClaudeAdapter implements LLMAdapter {
  private apiKey: string;

  constructor() {
    const key = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
    if (!key) {
      throw new Error(
        'EXPO_PUBLIC_CLAUDE_API_KEY is not set. Cannot initialise ClaudeAdapter.',
      );
    }
    this.apiKey = key;
  }

  async predict(prompt: string): Promise<string> {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Claude API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();

    // The Messages API returns content blocks; concatenate all text blocks.
    const textBlocks: string[] = (data.content ?? [])
      .filter((block: { type: string }) => block.type === 'text')
      .map((block: { text: string }) => block.text);

    return textBlocks.join('');
  }

  async stream(
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const response = await fetch(CLAUDE_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify({
        model: CLAUDE_MODEL,
        max_tokens: 4096,
        stream: true,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Claude streaming error (${response.status}): ${errorBody}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream available from Claude response.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process SSE lines
        const lines = buffer.split('\n');
        // Keep the last (possibly incomplete) line in the buffer
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (payload === '[DONE]') return;

          try {
            const event = JSON.parse(payload);
            if (
              event.type === 'content_block_delta' &&
              event.delta?.type === 'text_delta'
            ) {
              onChunk(event.delta.text);
            }
          } catch {
            // Skip malformed JSON lines
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
