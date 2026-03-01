/**
 * Provider-agnostic LLM adapter interface.
 *
 * Each adapter (Claude, Gemini, Mock) implements this interface so the rest of
 * the app never couples directly to a specific LLM vendor.
 */
export interface LLMAdapter {
  /** Send a prompt and receive the full response text. */
  predict(prompt: string): Promise<string>;

  /** Stream a response, calling `onChunk` as each piece of text arrives. */
  stream(prompt: string, onChunk: (chunk: string) => void): Promise<void>;
}

export type LLMProvider = 'claude' | 'gemini' | 'mock';

/**
 * Determine the active provider based on environment variables.
 *
 * Priority:
 * 1. EXPO_PUBLIC_LLM_PROVIDER if explicitly set
 * 2. Auto-detect based on which API key is present
 * 3. Fall back to 'mock'
 */
export function resolveProvider(): LLMProvider {
  const explicit = process.env.EXPO_PUBLIC_LLM_PROVIDER as
    | LLMProvider
    | undefined;

  if (explicit === 'claude' || explicit === 'gemini' || explicit === 'mock') {
    // Even if the provider is specified, if there is no key, use mock
    if (explicit === 'claude' && !process.env.EXPO_PUBLIC_CLAUDE_API_KEY) {
      return 'mock';
    }
    if (explicit === 'gemini' && !process.env.EXPO_PUBLIC_GEMINI_API_KEY) {
      return 'mock';
    }
    return explicit;
  }

  if (process.env.EXPO_PUBLIC_CLAUDE_API_KEY) return 'claude';
  if (process.env.EXPO_PUBLIC_GEMINI_API_KEY) return 'gemini';

  return 'mock';
}

/**
 * Factory: create the right adapter for the resolved (or specified) provider.
 *
 * Lazily imports the concrete adapter so we only pull in what we need.
 */
export async function createLLMAdapter(
  provider?: LLMProvider,
): Promise<LLMAdapter> {
  const resolved = provider ?? resolveProvider();

  switch (resolved) {
    case 'claude': {
      const { ClaudeAdapter } = await import('./claude');
      return new ClaudeAdapter();
    }
    case 'gemini': {
      const { GeminiAdapter } = await import('./gemini');
      return new GeminiAdapter();
    }
    case 'mock':
    default: {
      const { MockAdapter } = await import('./mock');
      return new MockAdapter();
    }
  }
}
