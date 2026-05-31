type NetworkCallback = (online: boolean) => void;

export class NetworkDetector {
  private online = true;
  private lastError: string | undefined;
  private callbacks = new Set<NetworkCallback>();
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private readonly healthCheckUrl = "/api/health",
    private readonly intervalMs = 30000,
    private readonly fetchImpl: typeof fetch = fetch
  ) {
    if (typeof navigator !== "undefined") {
      this.online = navigator.onLine;
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  getLastError(): string | undefined {
    return this.lastError;
  }

  reportOnline(): void {
    this.lastError = undefined;
    this.setOnline(true);
  }

  reportOffline(message: string): void {
    this.lastError = message;
    this.setOnline(false);
  }

  onStatusChange(callback: NetworkCallback): () => void {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  start(): void {
    if (typeof window !== "undefined") {
      window.addEventListener("online", this.handleOnline);
      window.addEventListener("offline", this.handleOffline);
    }
    void this.check();
    this.timer = setInterval(() => {
      void this.check();
    }, this.intervalMs);
  }

  stop(): void {
    if (typeof window !== "undefined") {
      window.removeEventListener("online", this.handleOnline);
      window.removeEventListener("offline", this.handleOffline);
    }
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async check(): Promise<boolean> {
    try {
      const response = await this.fetchImpl(this.healthCheckUrl, {
        method: "GET",
        cache: "no-store",
      });
      const ok = response.ok;
      this.lastError = ok
        ? undefined
        : `Health check failed with HTTP ${response.status}`;
      this.setOnline(ok);
      return ok;
    } catch (error) {
      this.lastError =
        error instanceof Error
          ? `Health check failed: ${error.message}`
          : "Health check failed: Network error";
      this.setOnline(false);
      return false;
    }
  }

  private readonly handleOnline = () => {
    this.setOnline(true);
    void this.check();
  };

  private readonly handleOffline = () => {
    this.setOnline(false);
  };

  private setOnline(next: boolean): void {
    if (this.online === next) return;
    this.online = next;
    this.callbacks.forEach((callback) => callback(next));
  }
}
