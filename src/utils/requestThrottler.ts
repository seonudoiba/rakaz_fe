class RequestThrottler {
  private pendingRequests: Map<string, Promise<any>> = new Map();
  private requestTimestamps: Map<string, number[]> = new Map();
  private maxRequestsPerWindow = 10;
  private windowMs = 1000;

  async throttle<T>(
    key: string,
    requestFn: () => Promise<T>,
    options: {
      maxRequestsPerWindow?: number;
      windowMs?: number;
      deduplicate?: boolean;
    } = {}
  ): Promise<T> {
    const {
      maxRequestsPerWindow = this.maxRequestsPerWindow,
      windowMs = this.windowMs,
      deduplicate = true,
    } = options;

    // Check if this request is already in progress
    if (deduplicate && this.pendingRequests.has(key)) {
      console.log(`🔄 [RequestThrottler] Deduplicating request: ${key}`);
      return this.pendingRequests.get(key) as Promise<T>;
    }

    // Check rate limit
    const now = Date.now();
    const timestamps = this.requestTimestamps.get(key) || [];
    const recentRequests = timestamps.filter(t => now - t < windowMs);
    
    if (recentRequests.length >= maxRequestsPerWindow) {
      const oldest = recentRequests[0];
      const waitTime = windowMs - (now - oldest);
      console.warn(`⏳ [RequestThrottler] Rate limited for ${key}, waiting ${waitTime}ms`);
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    // Update timestamps
    timestamps.push(now);
    this.requestTimestamps.set(key, timestamps);

    // Execute request
    try {
      const promise = requestFn();
      if (deduplicate) {
        this.pendingRequests.set(key, promise);
      }
      const result = await promise;
      return result;
    } finally {
      if (deduplicate) {
        this.pendingRequests.delete(key);
      }
    }
  }

  clear() {
    this.pendingRequests.clear();
    this.requestTimestamps.clear();
  }
}

export const requestThrottler = new RequestThrottler();