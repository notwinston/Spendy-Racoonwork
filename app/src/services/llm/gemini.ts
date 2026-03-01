import type { LLMAdapter } from './adapter';

const GEMINI_MODEL = 'gemini-2.5-flash';
const GEMINI_BASE_URL =
  'https://generativelanguage.googleapis.com/v1beta/models';

/**
 * LLM adapter that calls the Google Gemini (Generative Language) API.
 */
export class GeminiAdapter implements LLMAdapter {
  private apiKey: string;

  constructor() {
    const key = process.env.EXPO_PUBLIC_GEMINI_API_KEY;
    if (!key) {
      throw new Error(
        'EXPO_PUBLIC_GEMINI_API_KEY is not set. Cannot initialise GeminiAdapter.',
      );
    }
    this.apiKey = key;
  }

  // ----- predict -----

  async predict(prompt: string): Promise<string> {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();

    // Gemini returns candidates[].content.parts[].text
    const parts =
      data?.candidates?.[0]?.content?.parts ?? [];
    return parts
      .map((p: { text?: string }) => p.text ?? '')
      .join('');
  }

  // ----- predictWithImage (multimodal) -----

  /**
   * Send a prompt with an image and receive the full response text.
   * Uses Gemini's multimodal content format with inlineData.
   * This is GeminiAdapter-specific (not on the LLMAdapter interface).
   */
  async predictWithImage(
    prompt: string,
    imageBase64: string,
    mimeType: string = 'image/jpeg',
  ): Promise<string> {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:generateContent?key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { inlineData: { mimeType, data: imageBase64 } },
              { text: prompt },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini Vision API error (${response.status}): ${errorBody}`,
      );
    }

    const data = await response.json();
    const parts =
      data?.candidates?.[0]?.content?.parts ?? [];
    return parts
      .map((p: { text?: string }) => p.text ?? '')
      .join('');
  }

  // ----- stream -----

  async stream(
    prompt: string,
    onChunk: (chunk: string) => void,
  ): Promise<void> {
    const url = `${GEMINI_BASE_URL}/${GEMINI_MODEL}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          maxOutputTokens: 4096,
        },
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(
        `Gemini streaming error (${response.status}): ${errorBody}`,
      );
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No readable stream available from Gemini response.');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6).trim();
          if (!payload) continue;

          try {
            const event = JSON.parse(payload);
            const parts = event?.candidates?.[0]?.content?.parts;
            if (Array.isArray(parts)) {
              for (const part of parts) {
                if (part.text) {
                  onChunk(part.text);
                }
              }
            }
          } catch {
            // Skip malformed JSON
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  }
}
