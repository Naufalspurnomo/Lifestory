type NetworkCallback = (online: boolean) => void;

export class NetworkDetector {
  private online = true;
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
    if (typeof navigator !== "undefined" && !navigator.onLine) {
      this.setOnline(false);
      return false;
    }

    try {
      const response = await this.fetchImpl(this.healthCheckUrl, {
        method: "GET",
        cache: "no-store",
      });
      const ok = response.ok;
      this.setOnline(ok);
      return ok;
    } catch {
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
