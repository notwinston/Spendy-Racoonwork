import { create } from 'zustand';
import { createLLMAdapter, resolveProvider } from '../services/llm/adapter';
import type { LLMAdapter } from '../services/llm/adapter';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface ChatState {
  messages: ChatMessage[];
  isOpen: boolean;
  isLoading: boolean;
  currentScreen: string;
  setOpen: (open: boolean) => void;
  setCurrentScreen: (screen: string) => void;
  sendMessage: (content: string) => Promise<void>;
  clearMessages: () => void;
}

/** Build a system prompt with financial context for the AI assistant. */
function buildSystemPrompt(currentScreen: string): string {
  return `You are a helpful, concise, and friendly AI financial assistant for Spendy — an app that predicts future spending based on calendar events. Keep responses brief (2-3 sentences) and actionable.

Current context:
- The user is viewing the "${currentScreen}" screen.
- Monthly budget: $1,000 with $340 remaining.
- Burn rate: 0.97x (on track).
- Financial health score: B (74/100).
- Top spending categories this month: Dining ($280), Transport ($180), Shopping ($120).
- Upcoming predicted expenses: Dinner ($45), Groceries ($85), Uber rides ($30).

Provide helpful, personalized financial advice. Be encouraging and use specific numbers when relevant.`;
}

/**
 * Generate a mock chat response based on user input.
 * Used when the mock LLM adapter is active so we get conversational replies
 * instead of the prediction-JSON the mock adapter normally returns.
 */
function generateMockChatResponse(userMessage: string, currentScreen: string): string {
  const lower = userMessage.toLowerCase();

  // Screen-contextual responses
  if (lower.includes('how am i doing') || lower.includes('doing financially')) {
    return "You're doing well! With $340 left of your $1,000 budget and a 0.97x burn rate, you're right on track for the month. Keep it up!";
  }
  if (lower.includes('burn rate') || lower.includes('burn')) {
    return "Your burn rate is 0.97x, which means you're spending just slightly under your daily budget pace. That's excellent — you'll likely finish the month with a small surplus!";
  }
  if (lower.includes('budget tip') || lower.includes('budget')) {
    return "Here's a tip: your dining category ($280) is your biggest expense. Try meal-prepping two days a week — you could save around $80/month!";
  }
  if (lower.includes('coming up') || lower.includes('upcoming') || lower.includes('what\'s ahead')) {
    return "You have a few expenses coming up: a dinner predicted at ~$45, groceries at ~$85, and Uber rides at ~$30. That's about $160 total — well within your remaining $340.";
  }
  if (lower.includes('expensive week') || lower.includes('week ahead')) {
    return "This week looks moderate. Your predicted expenses total about $160, which is on par with your weekly average. No surprises expected!";
  }
  if (lower.includes('schedule') || lower.includes('summary')) {
    return "Your calendar shows 5 events this week with predicted spending. The biggest one is groceries (~$85). The rest are smaller daily expenses.";
  }
  if (lower.includes('savings') || lower.includes('save') || lower.includes('saving')) {
    return "Great question! If you cut dining out by just once a week, you could save ~$120/month. That adds up to $1,440 a year — enough for a nice vacation fund!";
  }
  if (lower.includes('prediction') || lower.includes('predict')) {
    return "Your predictions have been 82% accurate this month. The AI learns from your feedback, so the more you review predictions, the better they get!";
  }
  if (lower.includes('cut spending') || lower.includes('cut')) {
    return "Your top 3 areas to cut: 1) Dining — try cooking at home more ($80 savings). 2) Transport — combine errands ($40 savings). 3) Shopping — use a 48-hour rule before purchases ($60 savings).";
  }
  if (lower.includes('progress') || lower.includes('my progress')) {
    return "You're Level 2 with 150 XP. You've maintained a 3-day streak and earned your first badge! Complete today's check-in to keep your streak going.";
  }
  if (lower.includes('challenge') || lower.includes('challenge ideas')) {
    return "Try the 'No-Spend Weekend' challenge! Go two days without discretionary spending. It's a great way to earn 50 XP and save money at the same time.";
  }
  if (lower.includes('level up') || lower.includes('level')) {
    return "To level up, focus on: daily check-ins (10 XP each), reviewing predictions (15 XP each), and completing challenges (50+ XP). You need 100 more XP for Level 3!";
  }
  if (lower.includes('score') || lower.includes('health score') || lower.includes('explain my score')) {
    return "Your financial health score is B (74/100). It's based on budget adherence, prediction accuracy, and spending consistency. To reach an A, try staying under budget for 3 consecutive weeks.";
  }
  if (lower.includes('trend') || lower.includes('spending trend')) {
    return "Your spending has trended down 12% over the last 3 months — great progress! Dining is down 8%, and transport is down 15%. Shopping has stayed flat.";
  }
  if (lower.includes('best') || lower.includes('best month') || lower.includes('best saving')) {
    return "Your best saving month was last month — you came in $120 under budget! The key was fewer dining-out expenses and no unexpected shopping trips.";
  }

  // Generic fallback responses based on current screen
  const screenResponses: Record<string, string> = {
    dashboard: "Based on your dashboard, you're tracking well this month. Your burn rate of 0.97x is nearly perfect, and your $340 remaining budget gives you comfortable room. Want me to break down any specific category?",
    calendar: "Looking at your calendar, you have several events coming up that may involve spending. I can help you estimate costs or plan around them. What would you like to know?",
    plan: "Your spending plan looks solid. You have a good balance between needs and wants. Would you like suggestions for optimizing your budget or reviewing your predictions?",
    arena: "You're making good progress in the arena! Challenges and streaks are a great way to build better financial habits. Want to hear about some new challenges?",
    insights: "Your insights show positive trends overall. Your financial health score of B (74) is above average. Want me to explain what's driving your score?",
  };

  return screenResponses[currentScreen] ??
    "I'm here to help with your finances! I can answer questions about your budget, spending predictions, savings tips, or anything else related to your financial goals. What would you like to know?";
}

let adapterCache: LLMAdapter | null = null;

export const useChatStore = create<ChatState>((set, get) => ({
  messages: [],
  isOpen: false,
  isLoading: false,
  currentScreen: 'dashboard',

  setOpen: (open: boolean) => set({ isOpen: open }),

  setCurrentScreen: (screen: string) => set({ currentScreen: screen }),

  sendMessage: async (content: string) => {
    const { messages, currentScreen } = get();
    const userMessage: ChatMessage = {
      id: `msg-${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: Date.now(),
    };

    set({ messages: [...messages, userMessage], isLoading: true });

    try {
      let responseText: string;
      const provider = resolveProvider();

      if (provider === 'mock') {
        // Use chat-specific mock responses for a good UX without API keys
        await new Promise((resolve) => setTimeout(resolve, 500 + Math.random() * 500));
        responseText = generateMockChatResponse(content, currentScreen);
      } else {
        // Use real LLM adapter
        if (!adapterCache) {
          adapterCache = await createLLMAdapter(provider);
        }
        const systemPrompt = buildSystemPrompt(currentScreen);
        const conversationContext = get()
          .messages.slice(-10)
          .map((m) => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
          .join('\n');

        const fullPrompt = `${systemPrompt}\n\nConversation history:\n${conversationContext}\nUser: ${content}\n\nAssistant:`;
        responseText = await adapterCache.predict(fullPrompt);
      }

      const assistantMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: responseText,
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, assistantMessage],
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: `msg-${Date.now()}-assistant`,
        role: 'assistant',
        content: "Sorry, I couldn't process your request right now. Please try again in a moment.",
        timestamp: Date.now(),
      };

      set((state) => ({
        messages: [...state.messages, errorMessage],
        isLoading: false,
      }));
    }
  },

  clearMessages: () => set({ messages: [] }),
}));
