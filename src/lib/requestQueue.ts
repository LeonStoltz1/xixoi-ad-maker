import { SupabaseClient } from '@supabase/supabase-js';

interface QueuedRequest<T> {
  functionName: string;
  body?: any;
  resolve: (value: { data: T | null; error: any }) => void;
  reject: (error: any) => void;
}

class RequestQueue {
  private queue: QueuedRequest<any>[] = [];
  private processing = false;
  private lastRequestTime = 0;
  private readonly minDelay: number; // Minimum delay between requests in ms
  private readonly maxConcurrent: number; // Maximum concurrent requests

  constructor(minDelay = 500, maxConcurrent = 3) {
    this.minDelay = minDelay;
    this.maxConcurrent = maxConcurrent;
  }

  async enqueue<T>(
    supabase: SupabaseClient,
    functionName: string,
    body?: any
  ): Promise<{ data: T | null; error: any }> {
    return new Promise((resolve, reject) => {
      this.queue.push({ functionName, body, resolve, reject });
      this.processQueue(supabase);
    });
  }

  private async processQueue(supabase: SupabaseClient) {
    if (this.processing) return;
    this.processing = true;

    while (this.queue.length > 0) {
      // Calculate delay needed since last request
      const now = Date.now();
      const timeSinceLastRequest = now - this.lastRequestTime;
      const delayNeeded = Math.max(0, this.minDelay - timeSinceLastRequest);

      if (delayNeeded > 0) {
        await new Promise(resolve => setTimeout(resolve, delayNeeded));
      }

      const request = this.queue.shift();
      if (!request) continue;

      this.lastRequestTime = Date.now();

      try {
        const { data, error } = await supabase.functions.invoke(
          request.functionName,
          { body: request.body }
        );
        request.resolve({ data, error });
      } catch (error) {
        request.reject(error);
      }
    }

    this.processing = false;
  }

  getQueueLength(): number {
    return this.queue.length;
  }

  clear(): void {
    this.queue = [];
  }
}

// Singleton instance
export const requestQueue = new RequestQueue(500, 3);
