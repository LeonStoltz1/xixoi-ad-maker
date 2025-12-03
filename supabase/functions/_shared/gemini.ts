/**
 * Gemini AI Client for Edge Functions
 * Wraps Lovable's Gemini 2.5 Flash gateway with typed JSON responses
 */

const LOVABLE_AI_GATEWAY = 'https://ai.gateway.lovable.dev/v1/chat/completions';

export interface GeminiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GeminiResponse<T = string> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

/**
 * Call Gemini with structured JSON output using tool calling
 */
export async function geminiJson<T>(
  prompt: string,
  schema: {
    name: string;
    description: string;
    parameters: Record<string, unknown>;
  },
  systemPrompt?: string
): Promise<GeminiResponse<T>> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!apiKey) {
    return { success: false, error: 'LOVABLE_API_KEY not configured' };
  }

  const messages: GeminiMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        tools: [{
          type: 'function',
          function: schema
        }],
        tool_choice: { type: 'function', function: { name: schema.name } }
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }
      if (response.status === 402) {
        return { success: false, error: 'AI credits exhausted. Please add credits.' };
      }
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    if (!toolCall) {
      return { success: false, error: 'No tool call in response' };
    }

    const parsed = JSON.parse(toolCall.function.arguments) as T;
    
    return {
      success: true,
      data: parsed,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    };
  } catch (error) {
    console.error('Gemini client error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Call Gemini with plain text response
 */
export async function geminiText(
  prompt: string,
  systemPrompt?: string,
  options?: { temperature?: number; maxTokens?: number }
): Promise<GeminiResponse<string>> {
  const apiKey = Deno.env.get('LOVABLE_API_KEY');
  
  if (!apiKey) {
    return { success: false, error: 'LOVABLE_API_KEY not configured' };
  }

  const messages: GeminiMessage[] = [];
  
  if (systemPrompt) {
    messages.push({ role: 'system', content: systemPrompt });
  }
  
  messages.push({ role: 'user', content: prompt });

  try {
    const response = await fetch(LOVABLE_AI_GATEWAY, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages,
        temperature: options?.temperature,
        max_tokens: options?.maxTokens,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return { success: false, error: 'Rate limit exceeded. Please try again later.' };
      }
      if (response.status === 402) {
        return { success: false, error: 'AI credits exhausted. Please add credits.' };
      }
      return { success: false, error: `API error: ${response.status}` };
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;
    
    return {
      success: true,
      data: content || '',
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    };
  } catch (error) {
    console.error('Gemini client error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
