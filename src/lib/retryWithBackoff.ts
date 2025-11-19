import { SupabaseClient, FunctionsHttpError } from '@supabase/supabase-js';
import { requestQueue } from './requestQueue';

interface RetryOptions {
  maxRetries?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  useQueue?: boolean; // Whether to use the request queue
}

/**
 * Wraps a Supabase edge function call with retry logic and exponential backoff for 429 rate limit errors.
 * 
 * @param supabase - Supabase client instance
 * @param functionName - Name of the edge function to invoke
 * @param body - Request body to send to the function
 * @param options - Retry configuration options
 * @returns Promise with the function response data
 */
export async function invokeWithRetry<T = any>(
  supabase: SupabaseClient,
  functionName: string,
  body?: any,
  options: RetryOptions = {}
): Promise<{ data: T | null; error: any }> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 10000,
    backoffMultiplier = 2,
    useQueue = true // Enable queue by default
  } = options;

  let lastError: any = null;
  let delayMs = initialDelayMs;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      // Use queue if enabled, otherwise direct invoke
      const { data, error } = useQueue
        ? await requestQueue.enqueue<T>(supabase, functionName, body)
        : await supabase.functions.invoke(functionName, { body });

      // If no error or error is not 429, return immediately
      if (!error || (!error.message?.includes('429') && !error.message?.includes('rate limit'))) {
        return { data, error };
      }

      // If it's a 429 error and we have retries left, continue
      if (attempt < maxRetries) {
        lastError = error;
        console.log(`Rate limit hit for ${functionName}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, delayMs));
        
        // Increase delay for next retry (exponential backoff)
        delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
        continue;
      }

      // Max retries reached
      return { data, error };
    } catch (error: any) {
      lastError = error;
      
      // Handle FunctionsHttpError (403/4xx/5xx from edge functions)
      if (error instanceof FunctionsHttpError) {
        let body = null;
        try {
          body = await error.context.json();
        } catch (_) {
          // fallback if not JSON
        }

        // Normalize into something predictable
        const normalizedError = new Error(body?.message || error.message || 'Edge function error');
        (normalizedError as any).code = body?.error || 'UNKNOWN_EDGE_ERROR';
        (normalizedError as any).details = body;
        (normalizedError as any).status = error.context.status;

        lastError = normalizedError;
        
        // Check if it's a rate limit error
        if ((normalizedError.message?.includes('429') || normalizedError.message?.includes('rate limit')) && attempt < maxRetries) {
          console.log(`Rate limit error for ${functionName}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
          await new Promise(resolve => setTimeout(resolve, delayMs));
          delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
          continue;
        }

        // Not a rate limit error or max retries reached
        return { data: null, error: normalizedError };
      }
      
      // Check if it's a rate limit error
      if ((error.message?.includes('429') || error.message?.includes('rate limit')) && attempt < maxRetries) {
        console.log(`Rate limit error for ${functionName}, retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})`);
        
        await new Promise(resolve => setTimeout(resolve, delayMs));
        delayMs = Math.min(delayMs * backoffMultiplier, maxDelayMs);
        continue;
      }

      // Not a rate limit error or max retries reached
      return { data: null, error: lastError };
    }
  }

  // Should never reach here, but just in case
  return { data: null, error: lastError };
}
