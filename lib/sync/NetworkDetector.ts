type NetworkCallback = (online: boolean) => void;

const OFFLINE_FAILURE_THRESHOLD = 4;
const HEALTH_CHECK_TIMEOUT_MS = 5_000;

export class NetworkDetector {
  private online = true;
  private lastError: string | undefined;
  private consecutiveFailures = 0;
  private browserOffline = false;
  private callbacks = new Set<NetworkCallback>();
  private timer: ReturnType<typeof setInterval> | null = null;
  private checking: Promise<boolean> | null = null;

  constructor(
    private readonly healthCheckUrl = "/api/health",
    private readonly intervalMs = 30000,
    private readonly fetchImpl: typeof fetch = fetch
  ) {
    if (
      typeof navigator !== "undefined" &&
      typeof navigator.onLine === "boolean"
    ) {
      this.online = navigator.onLine;
    }
  }

  isOnline(): boolean {
    return this.online;
  }

  canAttemptRequests(): boolean {
    return !this.browserOffline;
  }

  getLastError(): string | undefined {
    return this.lastError;
  }

  reportOnline(): void {
    this.lastError = undefined;
    this.consecutiveFailures = 0;
    this.browserOffline = false;
    this.setOnline(true);
  }

  reportOffline(message: string): void {
    this.lastError = message;
    this.consecutiveFailures = OFFLINE_FAILURE_THRESHOLD;
    this.setOnline(false);
  }

  reportFailure(message: string): void {
    this.lastError = message;
    this.consecutiveFailures += 1;
    if (this.consecutiveFailures >= OFFLINE_FAILURE_THRESHOLD) {
      this.setOnline(false);
    }
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

  check(): Promise<boolean> {
    if (this.checking) return this.checking;
    this.checking = this.runCheck().finally(() => {
      this.checking = null;
    });
    return this.checking;
  }

  private async runCheck(): Promise<boolean> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS);
    try {
      const response = await this.fetchImpl(this.healthCheckUrl, {
        method: "GET",
        cache: "no-store",
        signal: controller.signal,
      });
      const ok = response.ok;
      if (ok) {
        this.reportOnline();
      } else {
        this.reportFailure(`Health check failed with HTTP ${response.status}`);
      }
      return ok;
    } catch (error) {
      const message =
        error instanceof Error
          ? `Health check failed: ${error.message}`
          : "Health check failed: Network error";
      this.reportFailure(message);
      return false;
    } finally {
      clearTimeout(timer);
    }
  }

  private readonly handleOnline = () => {
    this.reportOnline();
    void this.check();
  };

  private readonly handleOffline = () => {
    this.browserOffline = true;
    this.reportOffline("Browser reported that the network connection is offline.");
  };

  private setOnline(next: boolean): void {
    if (this.online === next) return;
    this.online = next;
    this.callbacks.forEach((callback) => callback(next));
  }
}
